import mongoose from 'mongoose'

// User Schema for CampusServe
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'staff', 'hod', 'requester', 'manager', 'technician', 'accounts', 'vendor', 'super_admin'], 
    required: true 
  },
  name: { type: String, required: true },
  department: { type: String, required: true }, // e.g. 'CSE', 'ECE', 'MECH', 'ADMIN', 'MAINTENANCE'
  phoneNumber: { type: String },
  eSignature: { type: String }, // Base64 encoded signature image
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// Service Request Schema (incorporates inspection, quotation, work order, invoice, payments)
const ServiceRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  assetCode: { type: String },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], default: 'LOW' },
  emergencyReason: { type: String },
  description: { type: String, required: true },
  status: { 
    type: String, 
    default: 'DRAFT' 
  },
  
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  
  assignedManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedManagerName: { type: String },
  assignedManagerEmail: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  closedAt: { type: Date },
  
  statusHistory: [{
    oldStatus: { type: String },
    newStatus: { type: String },
    actorId: { type: String },
    actorName: { type: String },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Inspection Module
  inspection: {
    diagnosis: { type: String },
    recommendation: { type: String },
    estimatedDurationHours: { type: Number },
    serviceMode: { type: String, enum: ['INTERNAL_STAFF', 'EXTERNAL_VENDOR'] },
    inspectionDate: { type: Date }
  },
  
  // Quotation Module
  quotation: {
    quotationNumber: { type: String },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'] },
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    validUntil: { type: Date },
    terms: { type: String },
    createdBy: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    items: [{
      itemType: { type: String, enum: ['MATERIAL', 'LABOUR', 'SERVICE'] },
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      unitPrice: { type: Number, required: true },
      taxRate: { type: Number, default: 18 }, // percentage
      discount: { type: Number, default: 0 }, // absolute amount
      lineTotal: { type: Number, required: true }
    }]
  },
  
  // Work Order Module
  workOrder: {
    workOrderNumber: { type: String },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technicianName: { type: String },
    vendorId: { type: String },
    vendorName: { type: String },
    scope: { type: String },
    startDate: { type: Date },
    dueDate: { type: Date },
    approvedAmount: { type: Number },
    status: { type: String }, // e.g. ASSIGNED, ACCEPTED, DECLINED, IN_PROGRESS, PAUSED, COMPLETED
    declineReason: { type: String },
    updates: [{
      progressPercent: { type: Number },
      note: { type: String },
      createdBy: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],
    materials: [{
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      unitCost: { type: Number, required: true },
      totalCost: { type: Number, required: true }
    }],
    additionalCosts: [{
      reason: { type: String },
      subtotal: { type: Number },
      taxTotal: { type: Number },
      grandTotal: { type: Number },
      status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
      requestedBy: { type: String },
      approvedBy: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],
    completionReport: {
      summary: { type: String },
      completedAt: { type: Date },
      warrantyDetails: { type: String },
      recommendations: { type: String }
    }
  },
  
  // Requester Verification
  requesterVerification: {
    result: { type: String, enum: ['RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED'] },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    verifiedBy: { type: String },
    verifiedAt: { type: Date }
  },
  
  // Invoice Module
  invoice: {
    invoiceNumber: { type: String },
    version: { type: Number, default: 1 },
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'] },
    createdBy: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    items: [{
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      unitPrice: { type: Number, required: true },
      taxRate: { type: Number, default: 18 },
      lineTotal: { type: Number, required: true }
    }]
  },
  
  // Payments Recorded
  payments: [{
    paymentNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD'], required: true },
    referenceNumber: { type: String },
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: String },
    notes: { type: String }
  }]
})

// Indexes for request status, department and query lookups
ServiceRequestSchema.index({ requestNumber: 1 })
ServiceRequestSchema.index({ status: 1 })
ServiceRequestSchema.index({ requesterId: 1 })
ServiceRequestSchema.index({ assignedManagerId: 1 })
ServiceRequestSchema.index({ 'workOrder.technicianId': 1 })

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  url: { type: String, default: '/' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

// Access Policy Schema (retained for backward compatibility or future configurations)
const AccessPolicySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'login_window' },
  staffHodWindowStart: { type: Number, default: 8 * 60 + 30 },
  staffHodWindowEnd: { type: Number, default: 17 * 60 },
  enforceForStaffHod: { type: Boolean, default: false },
  updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
})

export const User = mongoose.models.User || mongoose.model('User', UserSchema)
export const ServiceRequest = mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', ServiceRequestSchema)
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)
export const AccessPolicy = mongoose.models.AccessPolicy || mongoose.model('AccessPolicy', AccessPolicySchema)
