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

  const userId = req.user ? req.user.id : (req.headers['x-user-id'] || '')
  const userRole = req.user ? req.user.role : (req.headers['x-user-role'] || '')

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
      const actorId = req.user ? req.user.id : (req.headers['x-user-id'] || 'system')
      
      const actor = req.user || await User.findById(actorId).lean()
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

      const isAdmin = ['admin', 'super_admin'].includes(userRole)
      const isOwner = String(request.requesterId) === String(actorId)
      const isAssignedManager = String(request.assignedManagerId || '') === String(actorId)
      const requireStatus = (allowedStatuses) => {
        if (allowedStatuses.includes(request.status)) return null
        return res.status(409).json({
          success: false,
          error: `Action '${action}' is not available while the request is ${request.status.replace(/_/g, ' ').toLowerCase()}`
        })
      }

      // Role-based authorization for privileged actions
      const privilegedActions = {
        'approve': ['admin', 'super_admin'],
        'reject': ['admin', 'super_admin'],
        'clarify': ['admin', 'super_admin', 'manager'],
        'assign-manager': ['admin', 'super_admin'],
        'inspect': ['admin', 'super_admin', 'manager'],
        'verify': ['requester', 'admin', 'super_admin']
      }
      if (privilegedActions[action]) {
        const allowed = privilegedActions[action]
        if (!allowed.includes(userRole)) {
          return res.status(403).json({ success: false, error: `Action '${action}' requires one of these roles: ${allowed.join(', ')}` })
        }
      }

      if (['submit', 'cancel'].includes(action) && !isOwner && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Only the requester or an administrator can perform this action' })
      }
      if (action === 'inspect' && !isAdmin && !isAssignedManager) {
        return res.status(403).json({ success: false, error: 'Only the assigned manager can inspect this request' })
      }
      if (action === 'verify' && !isAdmin && !isOwner) {
        return res.status(403).json({ success: false, error: 'Only the original requester can verify completion' })
      }

      if (action === 'submit') {
        const invalid = requireStatus(['DRAFT', 'CLARIFICATION_REQUIRED'])
        if (invalid) return invalid
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
        const invalid = requireStatus(['DRAFT', 'SUBMITTED', 'CLARIFICATION_REQUIRED'])
        if (invalid) return invalid
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
        const invalid = requireStatus(['SUBMITTED', 'REOPENED'])
        if (invalid) return invalid
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
        const invalid = requireStatus(['SUBMITTED', 'REOPENED'])
        if (invalid) return invalid
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
        const invalid = requireStatus(['SUBMITTED'])
        if (invalid) return invalid
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
        const invalid = requireStatus(['APPROVED'])
        if (invalid) return invalid
        const { managerId } = req.body
        if (!managerId) return res.status(400).json({ success: false, error: 'Manager ID is required' })
        
        const manager = await User.findById(managerId).lean()
        if (!manager || manager.role !== 'manager') return res.status(404).json({ success: false, error: 'Manager user not found' })

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
        const invalid = requireStatus(['ASSIGNED_TO_MANAGER'])
        if (invalid) return invalid
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
        const invalid = requireStatus(['TECHNICIAN_COMPLETED'])
        if (invalid) return invalid
        const { result, rating, comment } = req.body
        const numericRating = Number(rating)
        if (!['RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED'].includes(result) || !Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
          return res.status(400).json({ success: false, error: 'Verification result and rating are required' })
        }

        request.requesterVerification = {
          result,
          rating: numericRating,
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

      const isAdmin = ['admin', 'super_admin'].includes(userRole)
      if (String(request.requesterId) !== String(userId) && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Only the requester or an administrator can edit this request' })
      }

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
