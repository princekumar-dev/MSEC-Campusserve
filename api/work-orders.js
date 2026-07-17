import { connectToDatabase } from '../lib/mongo.js'
import { ServiceRequest, User } from '../models.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectToDatabase()
  } catch (dbErr) {
    console.error('DB connect error in work-orders API:', dbErr.message)
    return res.status(503).json({ success: false, error: 'Database connection failed' })
  }

  const { action, id, requestId, costId } = req.query
  const actorId = req.headers['x-user-id'] || 'system'
  const actor = await User.findById(actorId).lean()
  const actorName = actor ? actor.name : 'Unknown User'

  try {
    // 1. Create Work Order (based on approved quotation)
    if (req.method === 'POST' && !action && requestId) {
      const request = await ServiceRequest.findById(requestId)
      if (!request) return res.status(404).json({ success: false, error: 'Request not found' })

      const { technicianId, vendorName, scope, startDate, dueDate } = req.body

      const year = new Date().getFullYear()
      const randomNum = Math.floor(Math.random() * 90000) + 10000
      const workOrderNumber = `WO-${year}-${randomNum}`

      let techName = ''
      let techUser = null

      if (technicianId) {
        techUser = await User.findById(technicianId).lean()
        if (techUser) techName = techUser.name
      }

      const budget = request.quotation ? request.quotation.grandTotal : 0

      request.workOrder = {
        workOrderNumber,
        technicianId: techUser ? techUser._id : null,
        technicianName: techName,
        vendorName: vendorName || '',
        scope: scope || request.description,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        approvedAmount: budget,
        status: techUser ? 'ASSIGNED' : 'CREATED',
        updates: [],
        materials: [],
        additionalCosts: []
      }

      const oldStatus = request.status
      request.status = techUser ? 'TECHNICIAN_ASSIGNED' : 'WORK_ORDER_CREATED'
      
      request.statusHistory.push({
        oldStatus,
        newStatus: request.status,
        actorId,
        actorName,
        comment: `Work order created. Assigned Technician: ${techName || 'None'}`
      })

      await request.save()
      return res.status(200).json({ success: true, data: request })
    }

    // 2. Perform actions on work order
    if (req.method === 'POST' && action && id) {
      const request = await ServiceRequest.findById(id)
      if (!request) return res.status(404).json({ success: false, error: 'Request not found' })
      if (!request.workOrder) return res.status(400).json({ success: false, error: 'No work order found for this request' })

      const oldStatus = request.status

      if (action === 'accept') {
        request.workOrder.status = 'ACCEPTED'
        request.status = 'WORK_ACCEPTED'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'WORK_ACCEPTED',
          actorId,
          actorName,
          comment: 'Technician accepted the work order'
        })
      }
      else if (action === 'decline') {
        const { reason } = req.body
        if (!reason) return res.status(400).json({ success: false, error: 'Decline reason is required' })

        request.workOrder.status = 'DECLINED'
        request.workOrder.declineReason = reason
        request.status = 'WORK_DECLINED'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'WORK_DECLINED',
          actorId,
          actorName,
          comment: `Technician declined the work order. Reason: ${reason}`
        })
      }
      else if (action === 'start') {
        request.workOrder.status = 'IN_PROGRESS'
        request.status = 'IN_PROGRESS'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'IN_PROGRESS',
          actorId,
          actorName,
          comment: 'Technician started the work'
        })
      }
      else if (action === 'pause') {
        const { note } = req.body
        request.workOrder.status = 'PAUSED'
        request.status = 'PAUSED'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'PAUSED',
          actorId,
          actorName,
          comment: `Work paused: ${note || 'Technician requested pause'}`
        })
      }
      else if (action === 'resume') {
        request.workOrder.status = 'IN_PROGRESS'
        request.status = 'IN_PROGRESS'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'IN_PROGRESS',
          actorId,
          actorName,
          comment: 'Work resumed by technician'
        })
      }
      else if (action === 'update') {
        const { progressPercent, note } = req.body
        if (progressPercent === undefined || !note) {
          return res.status(400).json({ success: false, error: 'Progress percentage and note are required' })
        }

        request.workOrder.updates.push({
          progressPercent: Number(progressPercent),
          note,
          createdBy: actorName,
          createdAt: new Date()
        })
        
        request.statusHistory.push({
          oldStatus,
          newStatus: request.status,
          actorId,
          actorName,
          comment: `Progress update: ${progressPercent}% - ${note}`
        })
      }
      else if (action === 'material') {
        const { description, quantity, unit, unitCost } = req.body
        if (!description || !quantity || !unitCost) {
          return res.status(400).json({ success: false, error: 'Missing material details' })
        }

        const qty = Number(quantity)
        const cost = Number(unitCost)
        const total = qty * cost

        request.workOrder.materials.push({
          description,
          quantity: qty,
          unit: unit || 'pcs',
          unitCost: cost,
          totalCost: total
        })

        request.statusHistory.push({
          oldStatus,
          newStatus: request.status,
          actorId,
          actorName,
          comment: `Recorded material usage: ${description} (Qty: ${qty})`
        })
      }
      else if (action === 'additional-cost') {
        const { reason, subtotal, taxTotal } = req.body
        if (!reason || !subtotal) {
          return res.status(400).json({ success: false, error: 'Reason and subtotal are required' })
        }

        const subt = Number(subtotal)
        const tax = Number(taxTotal || 0)
        const grand = subt + tax

        request.workOrder.additionalCosts.push({
          reason,
          subtotal: subt,
          taxTotal: tax,
          grandTotal: grand,
          status: 'PENDING',
          requestedBy: actorName
        })

        request.status = 'ADDITIONAL_COST_PENDING'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'ADDITIONAL_COST_PENDING',
          actorId,
          actorName,
          comment: `Requested additional budget of ₹${grand.toFixed(2)}: ${reason}`
        })
      }
      else if (action === 'approve-cost' && costId) {
        const costRequest = request.workOrder.additionalCosts.id(costId)
        if (!costRequest) return res.status(404).json({ success: false, error: 'Additional cost request not found' })

        costRequest.status = 'APPROVED'
        costRequest.approvedBy = actorName
        
        // Increase the approved work order amount
        request.workOrder.approvedAmount += costRequest.grandTotal

        request.status = 'IN_PROGRESS'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'IN_PROGRESS',
          actorId,
          actorName,
          comment: `Approved additional budget of ₹${costRequest.grandTotal.toFixed(2)}. New total budget: ₹${request.workOrder.approvedAmount.toFixed(2)}`
        })
      }
      else if (action === 'reject-cost' && costId) {
        const costRequest = request.workOrder.additionalCosts.id(costId)
        if (!costRequest) return res.status(404).json({ success: false, error: 'Additional cost request not found' })

        costRequest.status = 'REJECTED'
        costRequest.approvedBy = actorName

        request.status = 'IN_PROGRESS'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'IN_PROGRESS',
          actorId,
          actorName,
          comment: `Rejected additional budget of ₹${costRequest.grandTotal.toFixed(2)}`
        })
      }
      else if (action === 'complete') {
        const { summary, warrantyDetails, recommendations } = req.body
        if (!summary) return res.status(400).json({ success: false, error: 'Completion summary is required' })

        request.workOrder.completionReport = {
          summary,
          completedAt: new Date(),
          warrantyDetails: warrantyDetails || '',
          recommendations: recommendations || ''
        }
        
        request.workOrder.status = 'COMPLETED'
        request.status = 'TECHNICIAN_COMPLETED'
        
        request.statusHistory.push({
          oldStatus,
          newStatus: 'TECHNICIAN_COMPLETED',
          actorId,
          actorName,
          comment: `Work completed by technician. Summary: ${summary}`
        })
      }
      else {
        return res.status(400).json({ success: false, error: 'Invalid action' })
      }

      await request.save()
      return res.status(200).json({ success: true, data: request })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })

  } catch (error) {
    console.error('Error in work-orders API:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
