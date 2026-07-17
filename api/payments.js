import { connectToDatabase } from '../lib/mongo.js'
import { ServiceRequest, User } from '../models.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectToDatabase()
  } catch (dbErr) {
    console.error('DB connect error in payments API:', dbErr.message)
    return res.status(503).json({ success: false, error: 'Database connection failed' })
  }

  const { id } = req.query
  const actorId = req.headers['x-user-id'] || 'system'
  const actor = await User.findById(actorId).lean()
  const actorName = actor ? actor.name : 'Unknown User'

  try {
    if (req.method === 'POST') {
      if (!id) return res.status(400).json({ success: false, error: 'Request ID is required' })

      const request = await ServiceRequest.findById(id)
      if (!request) return res.status(404).json({ success: false, error: 'Request not found' })
      if (!request.invoice) return res.status(400).json({ success: false, error: 'Invoice must be created and approved before recording payment' })

      const { amount, method, referenceNumber, notes } = req.body
      if (!amount || !method) {
        return res.status(400).json({ success: false, error: 'Amount and payment method are required' })
      }

      const paymentAmt = Number(amount)
      if (paymentAmt <= 0) {
        return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero' })
      }

      const year = new Date().getFullYear()
      const randomNum = Math.floor(Math.random() * 90000) + 10000
      const paymentNumber = `PAY-${year}-${randomNum}`

      // Add to payments list
      request.payments.push({
        paymentNumber,
        amount: paymentAmt,
        method,
        referenceNumber: referenceNumber || '',
        paidAt: new Date(),
        recordedBy: actorName,
        notes: notes || ''
      })

      // Update balance
      request.invoice.balanceDue = Math.max(0, request.invoice.balanceDue - paymentAmt)
      
      const oldStatus = request.status
      if (request.invoice.balanceDue <= 0) {
        request.status = 'CLOSED' // Automatically close once paid in full and receipt is generated
      } else {
        request.status = 'PARTIALLY_PAID'
      }

      request.statusHistory.push({
        oldStatus,
        newStatus: request.status,
        actorId,
        actorName,
        comment: `Recorded payment: ₹${paymentAmt.toFixed(2)} via ${method}. Outstanding balance: ₹${request.invoice.balanceDue.toFixed(2)}. Status: ${request.status}`
      })

      await request.save()
      return res.status(200).json({ success: true, data: request })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })

  } catch (error) {
    console.error('Error in payments API:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
