import { connectToDatabase } from '../lib/mongo.js'
import { ServiceRequest } from '../models.js'
import PDFDocument from 'pdfkit'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    await connectToDatabase()
  } catch (dbErr) {
    console.error('DB connect error in generate-pdf API:', dbErr.message)
    return res.status(503).json({ success: false, error: 'Database connection failed' })
  }

  const { type, id } = req.query

  if (!id || !type) {
    return res.status(400).json({ success: false, error: 'Request ID and document type are required' })
  }

  try {
    const request = await ServiceRequest.findById(id).lean()
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service Request not found' })
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${type}-${id}.pdf"`)

    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    doc.pipe(res)

    // Common Header Layout
    doc.fillColor('#4c1d95').font('Helvetica-Bold').fontSize(24).text('CAMPUSSERVE PRO', { align: 'center' })
    doc.fillColor('#6b7280').font('Helvetica').fontSize(10).text('College Maintenance & Service Operations Portal', { align: 'center' })
    doc.text('Meenakshi Sundararajan Engineering College, Chennai', { align: 'center' })
    doc.moveDown()
    
    // Draw line
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown()

    const labelX = 50
    const valX = 180

    if (type === 'quotation') {
      const q = request.quotation
      if (!q) {
        doc.fillColor('red').fontSize(14).text('No quotation generated for this request yet.', { align: 'center' })
        doc.end()
        return
      }

      // Title
      doc.fillColor('#7c3aed').font('Helvetica-Bold').fontSize(16).text(`QUOTATION ESTIMATE: ${q.quotationNumber} (v${q.version})`)
      doc.moveDown(0.5)

      // Meta Table
      doc.fillColor('#374151').font('Helvetica-Bold').fontSize(10)
      doc.text('Request Ref:', labelX, doc.y).font('Helvetica').text(request.requestNumber, valX)
      doc.font('Helvetica-Bold').text('Subject Title:', labelX, doc.y).font('Helvetica').text(request.title, valX)
      doc.font('Helvetica-Bold').text('Requester:', labelX, doc.y).font('Helvetica').text(`${request.requesterName} (${request.requesterEmail})`, valX)
      doc.font('Helvetica-Bold').text('Department & Location:', labelX, doc.y).font('Helvetica').text(`${request.category} - ${request.location}`, valX)
      doc.font('Helvetica-Bold').text('Validity:', labelX, doc.y).font('Helvetica').text(new Date(q.validUntil).toLocaleDateString(), valX)
      doc.font('Helvetica-Bold').text('Created By:', labelX, doc.y).font('Helvetica').text(q.createdBy || 'Service Manager', valX)
      doc.moveDown()

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown()

      // Table Header
      doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(10)
      doc.text('Description', 50, doc.y, { width: 220 })
      doc.text('Qty', 270, doc.y - 12, { width: 40, align: 'right' })
      doc.text('Unit Price', 320, doc.y - 12, { width: 70, align: 'right' })
      doc.text('Tax', 400, doc.y - 12, { width: 50, align: 'right' })
      doc.text('Total', 460, doc.y - 12, { width: 80, align: 'right' })
      doc.moveDown(0.5)

      doc.strokeColor('#f3f4f6').moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown(0.5)

      // Items
      doc.font('Helvetica').fillColor('#1f2937')
      q.items.forEach(item => {
        const itemY = doc.y
        doc.text(item.description, 50, itemY, { width: 220 })
        doc.text(item.quantity.toString(), 270, itemY, { width: 40, align: 'right' })
        doc.text(`₹${item.unitPrice.toFixed(2)}`, 320, itemY, { width: 70, align: 'right' })
        doc.text(`${item.taxRate}%`, 400, itemY, { width: 50, align: 'right' })
        doc.text(`₹${item.lineTotal.toFixed(2)}`, 460, itemY, { width: 80, align: 'right' })
        doc.moveDown(0.5)
      })

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown()

      // Summary
      doc.font('Helvetica-Bold')
      doc.text(`Subtotal:  ₹${q.subtotal.toFixed(2)}`, 380, doc.y, { align: 'right' })
      doc.text(`Tax Total:  ₹${q.taxTotal.toFixed(2)}`, 380, doc.y, { align: 'right' })
      if (q.discountTotal > 0) {
        doc.text(`Discount: -₹${q.discountTotal.toFixed(2)}`, 380, doc.y, { align: 'right' })
      }
      doc.fillColor('#7c3aed').fontSize(12).text(`Grand Total: ₹${q.grandTotal.toFixed(2)}`, 380, doc.y, { align: 'right' })

      doc.moveDown(2)
      doc.fillColor('#9ca3af').fontSize(8).text('This is a computer generated document. Verified and approved digitally.', { align: 'center' })
    } 
    
    else if (type === 'workorder') {
      const w = request.workOrder
      if (!w) {
        doc.fillColor('red').fontSize(14).text('No work order raised for this request yet.', { align: 'center' })
        doc.end()
        return
      }

      // Title
      doc.fillColor('#7c3aed').font('Helvetica-Bold').fontSize(16).text(`WORK ORDER: ${w.workOrderNumber}`)
      doc.moveDown(0.5)

      // Meta Table
      doc.fillColor('#374151').font('Helvetica-Bold').fontSize(10)
      doc.text('Request Ref:', labelX, doc.y).font('Helvetica').text(request.requestNumber, valX)
      doc.font('Helvetica-Bold').text('Subject Title:', labelX, doc.y).font('Helvetica').text(request.title, valX)
      doc.font('Helvetica-Bold').text('Assigned Technician:', labelX, doc.y).font('Helvetica').text(w.technicianName || 'External Vendor', valX)
      if (w.vendorName) {
        doc.font('Helvetica-Bold').text('External Vendor:', labelX, doc.y).font('Helvetica').text(w.vendorName, valX)
      }
      doc.font('Helvetica-Bold').text('Dates:', labelX, doc.y).font('Helvetica').text(`Start: ${new Date(w.startDate).toLocaleDateString()} | Due: ${new Date(w.dueDate).toLocaleDateString()}`, valX)
      doc.font('Helvetica-Bold').text('Approved Budget:', labelX, doc.y).font('Helvetica').text(`₹${w.approvedAmount.toFixed(2)}`, valX)
      doc.moveDown()

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown()

      doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(11).text('Scope of Work:')
      doc.font('Helvetica').fillColor('#1f2937').fontSize(10).text(w.scope || request.description)
      doc.moveDown()

      // Safety Instructions
      doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(11).text('Safety and Operational Instructions:')
      doc.font('Helvetica').fillColor('#1f2937').fontSize(10).text('1. Wear appropriate protection equipment (PPE) before commencing work.\n2. In case of electrical tasks, verify lines are powered off and locked.\n3. Log any material usage and post progress updates live.')
      
      doc.moveDown(2)
      doc.fillColor('#9ca3af').fontSize(8).text('Authorized and dispatched dynamically. Standard SLAs apply.', { align: 'center' })
    } 
    
    else if (type === 'invoice') {
      const inv = request.invoice
      if (!inv) {
        doc.fillColor('red').fontSize(14).text('No invoice created for this request yet.', { align: 'center' })
        doc.end()
        return
      }

      // Title
      doc.fillColor('#7c3aed').font('Helvetica-Bold').fontSize(16).text(`FINAL SERVICE INVOICE: ${inv.invoiceNumber}`)
      doc.moveDown(0.5)

      // Meta Table
      doc.fillColor('#374151').font('Helvetica-Bold').fontSize(10)
      doc.text('Request Ref:', labelX, doc.y).font('Helvetica').text(request.requestNumber, valX)
      doc.font('Helvetica-Bold').text('Subject Title:', labelX, doc.y).font('Helvetica').text(request.title, valX)
      doc.font('Helvetica-Bold').text('Service Provider:', labelX, doc.y).font('Helvetica').text('Campus Maintenance Department', valX)
      doc.font('Helvetica-Bold').text('Requester:', labelX, doc.y).font('Helvetica').text(`${request.requesterName} (${request.requesterEmail})`, valX)
      doc.font('Helvetica-Bold').text('Created By:', labelX, doc.y).font('Helvetica').text(inv.createdBy || 'Service Manager', valX)
      doc.moveDown()

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown()

      // Table Header
      doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(10)
      doc.text('Description', 50, doc.y, { width: 260 })
      doc.text('Qty', 310, doc.y - 12, { width: 40, align: 'right' })
      doc.text('Unit Price', 360, doc.y - 12, { width: 80, align: 'right' })
      doc.text('Total', 450, doc.y - 12, { width: 90, align: 'right' })
      doc.moveDown(0.5)

      doc.strokeColor('#f3f4f6').moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown(0.5)

      // Items
      doc.font('Helvetica').fillColor('#1f2937')
      inv.items.forEach(item => {
        const itemY = doc.y
        doc.text(item.description, 50, itemY, { width: 260 })
        doc.text(item.quantity.toString(), 310, itemY, { width: 40, align: 'right' })
        doc.text(`₹${item.unitPrice.toFixed(2)}`, 360, itemY, { width: 80, align: 'right' })
        doc.text(`₹${item.lineTotal.toFixed(2)}`, 450, itemY, { width: 90, align: 'right' })
        doc.moveDown(0.5)
      })

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown()

      // Summary
      doc.font('Helvetica-Bold')
      doc.text(`Subtotal:  ₹${inv.subtotal.toFixed(2)}`, 380, doc.y, { align: 'right' })
      doc.text(`Tax Total:  ₹${inv.taxTotal.toFixed(2)}`, 380, doc.y, { align: 'right' })
      if (inv.discountTotal > 0) {
        doc.text(`Discount: -₹${inv.discountTotal.toFixed(2)}`, 380, doc.y, { align: 'right' })
      }
      doc.fillColor('#7c3aed').fontSize(12).text(`Grand Total: ₹${inv.grandTotal.toFixed(2)}`, 380, doc.y, { align: 'right' })

      doc.moveDown(2)
      doc.fillColor('#9ca3af').fontSize(8).text('Invoice generated under institutional guidelines. Approved for payment settlement.', { align: 'center' })
    } 
    
    else if (type === 'receipt') {
      const lastPayment = request.payments && request.payments.length > 0 ? request.payments[request.payments.length - 1] : null
      if (!lastPayment) {
        doc.fillColor('red').fontSize(14).text('No payment has been recorded for this invoice yet.', { align: 'center' })
        doc.end()
        return
      }

      // Title
      doc.fillColor('#7c3aed').font('Helvetica-Bold').fontSize(16).text(`OFFICIAL PAYMENT RECEIPT: REC-${lastPayment.paymentNumber.split('-')[2]}`)
      doc.moveDown(0.5)

      // Meta Table
      doc.fillColor('#374151').font('Helvetica-Bold').fontSize(10)
      doc.text('Payment Ref:', labelX, doc.y).font('Helvetica').text(lastPayment.paymentNumber, valX)
      doc.font('Helvetica-Bold').text('Invoice Ref:', labelX, doc.y).font('Helvetica').text(request.invoice ? request.invoice.invoiceNumber : 'N/A', valX)
      doc.font('Helvetica-Bold').text('Request Ref:', labelX, doc.y).font('Helvetica').text(request.requestNumber, valX)
      doc.font('Helvetica-Bold').text('Paid At:', labelX, doc.y).font('Helvetica').text(new Date(lastPayment.paidAt).toLocaleString(), valX)
      doc.font('Helvetica-Bold').text('Payment Method:', labelX, doc.y).font('Helvetica').text(lastPayment.method, valX)
      if (lastPayment.referenceNumber) {
        doc.font('Helvetica-Bold').text('Transaction Ref:', labelX, doc.y).font('Helvetica').text(lastPayment.referenceNumber, valX)
      }
      doc.font('Helvetica-Bold').text('Amount Settled:', labelX, doc.y).font('Helvetica').fillColor('#059669').text(`₹${lastPayment.amount.toFixed(2)}`, valX)
      doc.fillColor('#374151').font('Helvetica-Bold').text('Remaining Balance:', labelX, doc.y).font('Helvetica').text(`₹${request.invoice ? request.invoice.balanceDue.toFixed(2) : '0.00'}`, valX)
      doc.font('Helvetica-Bold').text('Recorded By:', labelX, doc.y).font('Helvetica').text(lastPayment.recordedBy || 'Accounts Officer', valX)
      doc.moveDown()

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
      doc.moveDown()

      doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(11).text('Payment Notes:')
      doc.font('Helvetica').fillColor('#1f2937').fontSize(10).text(lastPayment.notes || 'No payment description notes added.')

      doc.moveDown(3)
      doc.fillColor('#9ca3af').fontSize(8).text('This is a system generated transaction receipt acknowledging receipt of funds.', { align: 'center' })
    } 
    
    else {
      doc.fillColor('red').fontSize(14).text('Unsupported document type.', { align: 'center' })
    }

    doc.end()

  } catch (error) {
    console.error('Error generating PDF:', error)
    return res.status(500).json({ success: false, error: 'Internal server error rendering PDF' })
  }
}
