import { connectToDatabase } from '../lib/mongo.js'
import { ServiceRequest, User } from '../models.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectToDatabase()
  } catch (dbErr) {
    console.error('DB connect error in requests API:', dbErr.message)
    return res.status(503).json({ success: false, error: 'Database connection failed' })
  }

  const userId = req.headers['x-user-id']
  const userRole = req.headers['x-user-role']

  try {
    if (req.method === 'GET') {
      const { id, status, priority, category } = req.query

      // 1. Fetch single request by ID
      if (id) {
        const request = await ServiceRequest.findById(id).lean()
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' })
        return res.status(200).json({ success: true, data: request })
      }

      // 2. Fetch list of requests
      const filter = {}
      if (status) filter.status = status
      if (priority) filter.priority = priority
      if (category) filter.category = category

      // Role-based filtering
      if (userRole === 'requester') {
        filter.requesterId = userId
      } else if (userRole === 'manager') {
        // Managers see their assigned requests, or approved requests waiting for assignment
        filter.$or = [
          { assignedManagerId: userId },
          { status: 'APPROVED' }
        ]
      } else if (userRole === 'technician') {
        filter['workOrder.technicianId'] = userId
      }

      const requests = await ServiceRequest.find(filter).sort({ createdAt: -1 }).lean()
      return res.status(200).json({ success: true, data: requests })
    }

    if (req.method === 'POST') {
      const { action, id } = req.query
      const actorId = req.headers['x-user-id'] || 'system'
      
      const actor = await User.findById(actorId).lean()
      const actorName = actor ? actor.name : 'Unknown User'

      // 1. Create New Request
      if (!action) {
        const { title, category, location, assetCode, priority, emergencyReason, description, submitImmediately } = req.body

        if (!title || !category || !location || !description) {
          return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        const requester = await User.findById(actorId).lean()
        if (!requester) return res.status(404).json({ success: false, error: 'Requester user not found' })

        const year = new Date().getFullYear()
        const randomNum = Math.floor(Math.random() * 900000) + 100000
        const requestNumber = `REQ-${year}-${randomNum}`

        const status = submitImmediately ? 'SUBMITTED' : 'DRAFT'

        const newRequest = new ServiceRequest({
          requestNumber,
          title,
          category,
          location,
          assetCode,
          priority: priority || 'LOW',
          emergencyReason,
          description,
          status,
          requesterId: requester._id,
          requesterName: requester.name,
          requesterEmail: requester.email,
          statusHistory: [{
            oldStatus: '',
            newStatus: status,
            actorId: requester._id.toString(),
            actorName: requester.name,
            comment: submitImmediately ? 'Request submitted' : 'Request drafted'
          }]
        })

        await newRequest.save()
        return res.status(201).json({ success: true, data: newRequest })
      }

      // Action operations require a request ID
      if (!id) {
        return res.status(400).json({ success: false, error: 'Request ID is required' })
      }

      const request = await ServiceRequest.findById(id)
      if (!request) {
        return res.status(404).json({ success: false, error: 'Request not found' })
      }

      const oldStatus = request.status

      if (action === 'submit') {
        request.status = 'SUBMITTED'
        request.submittedAt = new Date()
        request.statusHistory.push({
          oldStatus,
          newStatus: 'SUBMITTED',
          actorId,
          actorName,
          comment: 'Request submitted for admin review'
        })
      } 
      else if (action === 'cancel') {
        request.status = 'CANCELLED'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'CANCELLED',
          actorId,
          actorName,
          comment: req.body.comment || 'Request cancelled by user'
        })
      } 
      else if (action === 'approve') {
        request.status = 'APPROVED'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'APPROVED',
          actorId,
          actorName,
          comment: req.body.comment || 'Request approved'
        })
      } 
      else if (action === 'reject') {
        if (!req.body.comment) return res.status(400).json({ success: false, error: 'Rejection comment is required' })
        request.status = 'REJECTED'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'REJECTED',
          actorId,
          actorName,
          comment: req.body.comment
        })
      } 
      else if (action === 'clarify') {
        if (!req.body.comment) return res.status(400).json({ success: false, error: 'Clarification details are required' })
        request.status = 'CLARIFICATION_REQUIRED'
        request.statusHistory.push({
          oldStatus,
          newStatus: 'CLARIFICATION_REQUIRED',
          actorId,
          actorName,
          comment: req.body.comment
        })
      } 
      else if (action === 'assign-manager') {
        const { managerId } = req.body
        if (!managerId) return res.status(400).json({ success: false, error: 'Manager ID is required' })
        
        const manager = await User.findById(managerId).lean()
        if (!manager) return res.status(404).json({ success: false, error: 'Manager user not found' })

        request.assignedManagerId = manager._id
        request.assignedManagerName = manager.name
        request.assignedManagerEmail = manager.email
        request.status = 'ASSIGNED_TO_MANAGER'
        
        request.statusHistory.push({
          oldStatus,
          newStatus: 'ASSIGNED_TO_MANAGER',
          actorId,
          actorName,
          comment: `Assigned to manager: ${manager.name}`
        })
      } 
      else if (action === 'inspect') {
        const { diagnosis, recommendation, estimatedDurationHours, serviceMode } = req.body
        if (!diagnosis || !recommendation || !serviceMode) {
          return res.status(400).json({ success: false, error: 'Missing inspection details' })
        }

        request.inspection = {
          diagnosis,
          recommendation,
          estimatedDurationHours: Number(estimatedDurationHours || 0),
          serviceMode,
          inspectionDate: new Date()
        }
        request.status = 'QUOTATION_IN_PROGRESS'
        
        request.statusHistory.push({
          oldStatus,
          newStatus: 'QUOTATION_IN_PROGRESS',
          actorId,
          actorName,
          comment: `Inspection completed. Diagnosis: ${diagnosis}`
        })
      } 
      else if (action === 'verify') {
        const { result, rating, comment } = req.body
        if (!result || !rating) {
          return res.status(400).json({ success: false, error: 'Verification result and rating are required' })
        }

        request.requesterVerification = {
          result,
          rating: Number(rating),
          comment,
          verifiedBy: actorName,
          verifiedAt: new Date()
        }

        if (result === 'UNRESOLVED') {
          request.status = 'REOPENED'
        } else {
          request.status = 'SERVICE_VERIFIED'
        }

        request.statusHistory.push({
          oldStatus,
          newStatus: request.status,
          actorId,
          actorName,
          comment: `Requester verification: ${result}. Feedback: ${comment || 'None'}`
        })
      } 
      else {
        return res.status(400).json({ success: false, error: 'Invalid action' })
      }

      await request.save()
      return res.status(200).json({ success: true, data: request })
    }

    // Delete or edit requests in draft status
    if (req.method === 'PATCH') {
      const { id } = req.query
      if (!id) return res.status(400).json({ success: false, error: 'Request ID is required' })

      const request = await ServiceRequest.findById(id)
      if (!request) return res.status(404).json({ success: false, error: 'Request not found' })

      if (request.status !== 'DRAFT' && request.status !== 'CLARIFICATION_REQUIRED') {
        return res.status(400).json({ success: false, error: 'Only drafts or requests needing clarification can be modified' })
      }

      const updates = req.body
      delete updates.status
      delete updates.requestNumber
      delete updates.requesterId
      delete updates.statusHistory

      Object.assign(request, updates)
      await request.save()

      return res.status(200).json({ success: true, data: request })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })

  } catch (error) {
    console.error('Error in requests API:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
