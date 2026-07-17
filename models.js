import mongoose from 'mongoose'

// User Schema for CampusServe & MSEC Academics
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'staff', 'hod', 'requester', 'manager', 'technician', 'accounts', 'vendor', 'super_admin'], 
    required: true 
  },
  name: { type: String, required: true },
  department: { type: String, required: true }, // e.g. 'CSE', 'ECE', 'MECH', 'ADMIN', 'MAINTENANCE', etc.
  year: { type: String }, // For staff - which year they handle (I, II, III, IV, etc.)
  section: { type: String }, // For staff - which section they handle (A, B, C, etc.)
  phoneNumber: { type: String },
  eSignature: { type: String }, // Base64 encoded signature image
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// Student Schema
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regNumber: { type: String, required: true, unique: true },
  year: { type: String, required: true },
  section: { type: String, required: true },
  department: { type: String, enum: ['CSE', 'AI_DS', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'HNS', 'ADMIN'], required: true },
  studentPhoneNumber: { type: String },
  studentPasswordHash: { type: String },
  parentPhoneNumber: { type: String, required: true },
  attendance: { type: String },
  // Optional fields populated from import sessions
  examinationName: { type: String },
  examinationDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

// Marksheet Schema
const MarksheetSchema = new mongoose.Schema({
  marksheetId: { type: String, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentDetails: {
    name: String,
    regNumber: String,
    year: String,
    section: String,
    department: String,
    studentPhoneNumber: String,
    parentPhoneNumber: String,
    attendance: String,
    examinationName: String,
    examinationDate: Date
  },
  // Top-level examination fields
  examinationName: { type: String },
  examinationDate: { type: Date, required: true },
  semester: { type: String }, // Add semester field
  subjects: [{
    subjectName: { type: String, required: true },
    subjectCode: { type: String },
    marks: { type: Number },
    result: { type: String, enum: ['Pass', 'Fail', 'Absent'], required: true }
  }],
  overallResult: { type: String, enum: ['Pass', 'Fail', 'Absent'] },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String, required: true },
  staffSignature: { type: String }, // Base64 encoded signature
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hodName: { type: String },
  hodSignature: { type: String }, // Base64 encoded signature
  principalSignature: { type: String }, // Base64 encoded signature
  status: {
    type: String,
    enum: ['draft', 'verified_by_staff', 'dispatch_requested', 'rescheduled_by_hod', 'approved_by_hod', 'rejected_by_hod', 'dispatched'],
    default: 'draft'
  },
  dispatchRequest: {
    requestedAt: Date,
    requestedBy: String,
    hodResponse: String, // 'approved', 'rejected', 'rescheduled'
    hodComments: String,
    scheduledDispatchDate: Date,
    respondedAt: Date,
    preDispatchNotificationSent: { type: Boolean, default: false },
    autoDispatched: { type: Boolean, default: false },
    autoDispatchFailed: { type: Boolean, default: false },
    dispatchError: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'rescheduled', 'dispatched'], default: 'pending' },
    dispatchedAt: Date
  },
  dispatchStatus: {
    dispatched: { type: Boolean, default: false },
    dispatchedAt: Date,
    whatsappStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    whatsappError: String
  },
  // Track whether a staff (or reviewer) has "visited" this marksheet UI
  visited: { type: Boolean, default: false },
  visitedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Add compound indexes for query performance
MarksheetSchema.index({ staffId: 1, status: 1, createdAt: -1 })
MarksheetSchema.index({ 'studentDetails.department': 1, status: 1, createdAt: -1 })
MarksheetSchema.index({ 'studentDetails.year': 1, 'studentDetails.department': 1, createdAt: -1 })
MarksheetSchema.index({ status: 1, createdAt: -1 })
MarksheetSchema.index({ studentId: 1, createdAt: -1 })
MarksheetSchema.index({ 'studentDetails.regNumber': 1 })
MarksheetSchema.index({ 'dispatchStatus.dispatched': 1, createdAt: -1 })

// Excel Import Session Schema - for temporary storage during import
const ImportSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  semester: { type: String },
  examinationName: { type: String },
  examinationDate: { type: Date, required: true },
  studentsData: [{
    name: String,
    regNumber: String,
    year: String,
    section: String,
    studentPhoneNumber: String,
    parentPhoneNumber: String,
    attendance: String,
    examinationName: String,
    examinationDate: Date,
    subjects: [{
      subjectName: String,
      subjectCode: String,
      marks: Number,
      result: { type: String, enum: ['Pass', 'Fail', 'Absent'] }
    }]
  }],
  status: { type: String, enum: ['pending', 'processed', 'error'], default: 'pending' },
  errorMessages: [String],
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Auto-delete after 24 hours
})

// Leave/Late Request Schema
const LeaveRequestSchema = new mongoose.Schema({
  type: { type: String, enum: ['leave', 'late'], required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentDetails: {
    name: String,
    regNumber: String,
    year: String,
    section: String,
    department: String,
    parentPhoneNumber: String
  },
  reason: { type: String, required: true },
  attachmentData: { type: String }, // Base64 encoded proof image
  startDate: { type: Date },
  endDate: { type: Date },
  expectedArrivalTime: { type: Date },
  recordedAt: { type: Date }, // When staff clicked "Record" button
  arrivalConfirmedAt: { type: Date }, // When student clicked "Reached" button
  arrivalRecordedAt: { type: Date }, // Legacy field
  status: { type: String, enum: ['requested', 'waiting_for_arrival_confirmation', 'approved_by_hod', 'rejected_by_hod', 'acknowledged_by_staff'], default: 'requested' },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hodName: { type: String },
  hodSignature: { type: String },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffName: { type: String },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

LeaveRequestSchema.index({ 'studentDetails.department': 1, type: 1, status: 1, createdAt: -1 })
LeaveRequestSchema.index({ 'studentDetails.department': 1, 'studentDetails.year': 1, 'studentDetails.section': 1, type: 1, status: 1, createdAt: -1 })
LeaveRequestSchema.index({ studentId: 1, type: 1, createdAt: -1 })

// Staff Approval Request Schema - for pending staff account approvals from HOD
const StaffApprovalRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true }, // Will be hashed and stored temporarily
  department: {
    type: String,
    enum: ['CSE', 'AI_DS', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'HNS', 'ADMIN', 'MAINTENANCE'],
    required: true
  },
  year: { type: String, required: true }, // I, II, III, IV
  section: { type: String, required: true }, // A, B, etc.
  phoneNumber: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  approvalHodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Which HOD should approve
  approvalHodName: { type: String },
  approvalHodEmail: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who approved it
  rejectionReason: { type: String }, // If rejected, why?
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

StaffApprovalRequestSchema.index({ email: 1 })
StaffApprovalRequestSchema.index({ status: 1, approvalHodId: 1 })
StaffApprovalRequestSchema.index({ department: 1, year: 1, status: 1 })

// Access Policy Schema (retained for backward compatibility or future configurations)
const AccessPolicySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'login_window' },
  staffHodWindowStart: { type: Number, default: 8 * 60 + 30 },
  staffHodWindowEnd: { type: Number, default: 17 * 60 },
  enforceForStaffHod: { type: Boolean, default: false },
  updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
})

// Service Request Schema for CampusServe (incorporates inspection, quotation, work order, invoice, payments)
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

// WhatsApp Instance Schema - track per-staff Evolution instances
const WhatsappInstanceSchema = new mongoose.Schema({
  instanceName: { type: String, required: true, index: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerJid: { type: String },
  configured: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Pre-save hooks
LeaveRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

StaffApprovalRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

AccessPolicySchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

MarksheetSchema.pre('save', function(next) {
  if (!this.marksheetId) {
    this.marksheetId = 'MS' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
  }
  this.updatedAt = new Date()
  next()
})

ImportSessionSchema.pre('save', function(next) {
  if (!this.sessionId) {
    this.sessionId = 'IMP' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
  }
  next()
})

WhatsappInstanceSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Export all models, checking Mongoose cache to prevent conflicts
export const User = mongoose.models.User || mongoose.model('User', UserSchema)
export const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema)
export const Marksheet = mongoose.models.Marksheet || mongoose.model('Marksheet', MarksheetSchema)
export const ImportSession = mongoose.models.ImportSession || mongoose.model('ImportSession', ImportSessionSchema)
export const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema)
export const StaffApprovalRequest = mongoose.models.StaffApprovalRequest || mongoose.model('StaffApprovalRequest', StaffApprovalRequestSchema)
export const AccessPolicy = mongoose.models.AccessPolicy || mongoose.model('AccessPolicy', AccessPolicySchema)
export const ServiceRequest = mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', ServiceRequestSchema)
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)
export const WhatsappInstance = mongoose.models.WhatsappInstance || mongoose.model('WhatsappInstance', WhatsappInstanceSchema)
