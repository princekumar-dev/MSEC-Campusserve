import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { getAuthOrNull } from '../utils/auth'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft, CheckCircle2, AlertCircle, Wrench, Download, Clock,
  Plus, Trash2, IndianRupee, FileCheck, ChevronRight, Loader2,
  AlertTriangle, Check, CheckCircle, Circle, User, Calendar, MapPin, Tag
} from 'lucide-react'

const WORKFLOW_STEPS = [
  { key: 'DRAFT', label: 'Draft', short: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted', short: 'Submit' },
  { key: 'UNDER_ADMIN_REVIEW', label: 'Review', short: 'Review' },
  { key: 'APPROVED', label: 'Approved', short: 'Approve' },
  { key: 'ASSIGNED_TO_MANAGER', label: 'Assigned', short: 'Assign' },
  { key: 'UNDER_INSPECTION', label: 'Inspection', short: 'Inspect' },
  { key: 'QUOTATION_SUBMITTED', label: 'Quotation', short: 'Quote' },
  { key: 'QUOTATION_APPROVED', label: 'Quote Approved', short: 'Q.Approve' },
  { key: 'WORK_ORDER_CREATED', label: 'Work Order', short: 'W.Order' },
  { key: 'IN_PROGRESS', label: 'In Progress', short: 'Progress' },
  { key: 'TECHNICIAN_COMPLETED', label: 'Completed', short: 'Done' },
  { key: 'SERVICE_VERIFIED', label: 'Verified', short: 'Verify' },
  { key: 'INVOICE_SUBMITTED', label: 'Invoice', short: 'Invoice' },
  { key: 'PAYMENT_PENDING', label: 'Payment', short: 'Payment' },
  { key: 'CLOSED', label: 'Closed', short: 'Closed' },
]

const STATUS_ORDER = WORKFLOW_STEPS.map(s => s.key)

const TABS = ['Overview', 'Diagnosis', 'Quotation', 'Work Order', 'Invoice', 'Payments', 'History']

function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  useEffect(() => {
    if (!open) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const scrollContainers = document.querySelectorAll('.layout-container')
    const previousContainerOverflow = Array.from(scrollContainers, node => node.style.overflow)

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    scrollContainers.forEach(node => { node.style.overflow = 'hidden' })

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      scrollContainers.forEach((node, index) => { node.style.overflow = previousContainerOverflow[index] })
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-6" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-50 rounded-full">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function StatusTimeline({ currentStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const altIdx = STATUS_ORDER.indexOf('UNDER_ADMIN_REVIEW')
  const effectiveIdx = currentIdx >= 0 ? currentIdx : (
    currentStatus === 'SUBMITTED' ? altIdx : -1
  )
  const isRejected = ['REJECTED', 'CANCELLED'].includes(currentStatus)
  const isOpen = ['CLARIFICATION_REQUIRED', 'REOPENED'].includes(currentStatus)
  const displayIdx = Math.max(0, effectiveIdx)
  const currentStep = WORKFLOW_STEPS[displayIdx]
  const nextStep = WORKFLOW_STEPS[Math.min(displayIdx + 1, WORKFLOW_STEPS.length - 1)]
  const progress = Math.round((displayIdx / (WORKFLOW_STEPS.length - 1)) * 100)

  return (
    <div className="premium-card overflow-hidden p-4 sm:p-5">
      <div className="sm:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">Workflow progress</p>
            <h2 className="mt-1 truncate text-base font-extrabold text-slate-900">
              {isRejected ? currentStatus.replace(/_/g, ' ') : currentStep?.label}
            </h2>
            {!isRejected && displayIdx < WORKFLOW_STEPS.length - 1 && (
              <p className="mt-0.5 text-xs text-slate-500">Next: {nextStep?.label}</p>
            )}
          </div>
          <span className="flex-shrink-0 rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700">
            {isRejected ? 'Stopped' : `${displayIdx + 1}/${WORKFLOW_STEPS.length}`}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${isRejected ? 'bg-rose-500' : 'bg-gradient-to-r from-violet-600 to-fuchsia-500'}`}
            style={{ width: isRejected ? '100%' : `${Math.max(5, progress)}%` }}
          />
        </div>
      </div>

      <div className="hidden overflow-x-auto scrollbar-none sm:block">
      <div className="grid min-w-[920px] grid-cols-[repeat(15,minmax(56px,1fr))] px-1 pt-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = effectiveIdx > idx && !isRejected
          const isCurrent = step.key === currentStatus || (
            currentStatus === 'SUBMITTED' && step.key === 'UNDER_ADMIN_REVIEW'
          )
          return (
            <div key={step.key} className="relative flex min-w-0 flex-col items-center">
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`absolute left-1/2 top-[15px] h-0.5 w-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
              <div className={`step-dot relative z-10 ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`} title={step.label}>
                {isCompleted ? <Check size={10} /> : <span className="text-xs">{idx + 1}</span>}
              </div>
              <span className={`mt-2 w-full truncate px-1 text-center text-[7px] font-bold uppercase tracking-wide ${
                idx === effectiveIdx ? 'text-violet-600' : 'text-slate-300'
              }`} title={step.label}>{step.short}</span>
            </div>
          )
        })}
      </div>
      </div>
      {(isRejected || isOpen) && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-bold ${
          isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {isRejected ? `Request ${currentStatus.toLowerCase()}` : `Status: ${currentStatus.replace(/_/g, ' ')}`}
        </div>
      )}
    </div>
  )
}

function ActionButton({ onClick, loading, variant = 'primary', disabled, children, className = '' }) {
  const variants = {
    primary: 'bg-violet-600 hover:bg-violet-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white',
    ghost: 'bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
    >
      {loading && <Loader2 size={12} className="animate-spin" />}
      {children}
    </button>
  )
}

function RequestDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()
  const auth = getAuthOrNull()

  const [request, setRequest] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [technicians, setTechnicians] = useState([])
  const [managers, setManagers] = useState([])

  const [adminComment, setAdminComment] = useState('')
  const [assignedManagerId, setAssignedManagerId] = useState('')

  const [diagnosis, setDiagnosis] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [estDuration, setEstDuration] = useState('4')
  const [serviceMode, setServiceMode] = useState('INTERNAL_STAFF')

  const [quoItems, setQuoItems] = useState([{ description: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 18, discount: 0, itemType: 'MATERIAL' }])
  const [quoTerms, setQuoTerms] = useState('')

  const [selectedTechId, setSelectedTechId] = useState('')
  const [woVendorName, setWoVendorName] = useState('')
  const [woScope, setWoScope] = useState('')

  const [progressPercent, setProgressPercent] = useState(0)
  const [progressNote, setProgressNote] = useState('')
  const [materialDesc, setMaterialDesc] = useState('')
  const [materialQty, setMaterialQty] = useState(1)
  const [materialUnit, setMaterialUnit] = useState('pcs')
  const [materialUnitCost, setMaterialUnitCost] = useState(0)

  const [costReason, setCostReason] = useState('')
  const [costSubtotal, setCostSubtotal] = useState(0)
  const [costTax, setCostTax] = useState(0)

  const [completionSummary, setCompletionSummary] = useState('')
  const [completionWarranty, setCompletionWarranty] = useState('')
  const [completionRecs, setCompletionRecs] = useState('')

  const [verifyResult, setVerifyResult] = useState('RESOLVED')
  const [verifyRating, setVerifyRating] = useState(5)
  const [verifyComment, setVerifyComment] = useState('')

  const [invDiscount, setInvDiscount] = useState(0)

  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('CASH')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')

  const [confirmModal, setConfirmModal] = useState({ open: false })

  const fetchRequestDetails = async () => {
    try {
      const res = await apiClient.get(`/api/requests?id=${id}`)
      if (res.success) {
        setRequest(res.data)
        if (res.data.inspection) {
          setDiagnosis(res.data.inspection.diagnosis || '')
          setRecommendation(res.data.inspection.recommendation || '')
          setEstDuration(res.data.inspection.estimatedDurationHours || '4')
          setServiceMode(res.data.inspection.serviceMode || 'INTERNAL_STAFF')
        }
        if (res.data.quotation) {
          setQuoTerms(res.data.quotation.terms || '')
          if (res.data.quotation.items?.length > 0) setQuoItems(res.data.quotation.items)
        }
        if (res.data.invoice) {
          setInvDiscount(res.data.invoice.discountTotal || 0)
        }
      }
    } catch (err) {
      showError('Load Error', 'Failed to load request details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchRequestDetails() }, [id])

  useEffect(() => {
    if (auth?.role === 'admin') {
      apiClient.get('/api/users?role=manager').then(res => {
        if (res.success) setManagers(res.users)
      })
    }
    if (auth?.role === 'manager') {
      apiClient.get('/api/users?role=technician').then(res => {
        if (res.success) setTechnicians(res.users)
      })
    }
  }, [auth?.role])

  const handleWorkflowAction = async (endpoint, payload, confirmMessage) => {
    if (confirmMessage) {
      setConfirmModal({
        open: true,
        title: 'Confirm Action',
        message: confirmMessage,
        onConfirm: async () => {
          setConfirmModal({ open: false })
          setActionLoading(true)
          try {
            const res = await apiClient.post(endpoint, payload)
            if (res.success) {
              showSuccess('Success', 'Action completed successfully')
              fetchRequestDetails()
              setAdminComment('')
            } else {
              showError('Failed', res.error || 'Action could not be executed')
            }
          } catch (err) {
            showError('Error', err.message || 'Connection error')
          } finally {
            setActionLoading(false)
          }
        },
        onCancel: () => setConfirmModal({ open: false })
      })
      return
    }
    setActionLoading(true)
    try {
      const res = await apiClient.post(endpoint, payload)
      if (res.success) {
        showSuccess('Success', 'Action completed successfully')
        fetchRequestDetails()
        setAdminComment('')
      } else {
        showError('Failed', res.error || 'Action could not be executed')
      }
    } catch (err) {
      showError('Error', err.message || 'Connection error')
    } finally {
      setActionLoading(false)
    }
  }

  const openPdf = (type) => {
    const origin = import.meta.env.VITE_API_URL || ''
    window.open(`${origin}/api/generate-pdf?type=${type}&id=${id}`, '_blank')
  }

  const addQuoItem = () => setQuoItems([...quoItems, { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 18, discount: 0, itemType: 'MATERIAL' }])
  const removeQuoItem = (i) => setQuoItems(quoItems.filter((_, idx) => idx !== i))
  const handleQuoItemChange = (i, field, val) => { const n = [...quoItems]; n[i][field] = val; setQuoItems(n) }

  const getTabDot = (tab) => {
    if (!request) return false
    if (tab === 'Overview' && ['SUBMITTED', 'APPROVED', 'REOPENED', 'CLARIFICATION_REQUIRED'].includes(request.status)) return true
    if (tab === 'Diagnosis' && ['ASSIGNED_TO_MANAGER'].includes(request.status) && auth?.role === 'manager') return true
    if (tab === 'Quotation' && ['QUOTATION_IN_PROGRESS', 'QUOTATION_REVISION_REQUIRED', 'QUOTATION_SUBMITTED'].includes(request.status)) return true
    if (tab === 'Work Order' && ['QUOTATION_APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'].includes(request.status)) return true
    if (tab === 'Invoice' && ['SERVICE_VERIFIED', 'INVOICE_SUBMITTED', 'INVOICE_REVISION_REQUIRED'].includes(request.status)) return true
    if (tab === 'Payments' && ['PAYMENT_PENDING', 'PARTIALLY_PAID'].includes(request.status)) return true
    return false
  }

  if (isLoading || !request) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-16 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ConfirmModal {...confirmModal} loading={actionLoading} />

      {/* Back + Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button onClick={() => navigate('/requests')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-all font-semibold">
          <ArrowLeft size={16} /> Back to Requests
        </button>
        <div className="flex items-center gap-2">
          <span className={`status-badge status-${request.status.toLowerCase()}`}>{request.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Status Timeline */}
      <StatusTimeline currentStatus={request.status} />

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <span className="text-xs font-mono text-violet-600 font-bold tracking-wider">{request.requestNumber}</span>
            <h1 className="mt-1 break-words text-xl font-black text-slate-800 sm:text-2xl">{request.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={12} /> {request.location}</span>
              <span className="flex items-center gap-1"><User size={12} /> {request.requesterName}</span>
              <span className="flex items-center gap-1"><Tag size={12} /> {request.category}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            request.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
            request.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
            request.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
            'bg-slate-100 text-slate-600'
          }`}>
            {request.priority}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="request-detail-tabs mobile-edge-scroll flex snap-x snap-mandatory gap-2 overflow-x-auto border-b border-slate-200 pb-1 scrollbar-none sm:gap-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`request-detail-tab relative flex-shrink-0 snap-start whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-all sm:-mb-px sm:px-5 ${
              activeTab === tab ? 'border-violet-600 text-violet-600 bg-violet-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {tab}
            {getTabDot(tab) && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-violet-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">

        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{request.description}</p>
                {request.emergencyReason && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs mt-4">
                    <strong>Emergency Reason:</strong> {request.emergencyReason}
                  </div>
                )}
              </div>

              {/* Requester Verification */}
              {auth?.role === 'requester' && request.status === 'TECHNICIAN_COMPLETED' && (
                <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={16} /> Verify Completion
                  </h3>
                  <p className="text-xs text-slate-500">The technician has marked this complete. Please verify.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Result</label>
                      <select value={verifyResult} onChange={e => setVerifyResult(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none">
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="PARTIALLY_RESOLVED">PARTIALLY RESOLVED</option>
                        <option value="UNRESOLVED">UNRESOLVED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Rating</label>
                      <input type="number" min="1" max="5" value={verifyRating} onChange={e => setVerifyRating(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <textarea rows={3} placeholder="Feedback notes..." value={verifyComment} onChange={e => setVerifyComment(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                  <ActionButton onClick={() => handleWorkflowAction(`/api/requests?action=verify&id=${id}`, { result: verifyResult, rating: verifyRating, comment: verifyComment }, 'Submit verification report?')} loading={actionLoading}>
                    Submit Verification
                  </ActionButton>
                </div>
              )}

              {/* Admin Review */}
              {auth?.role === 'admin' && request.status === 'SUBMITTED' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Admin Review</h3>
                  <textarea rows={2} placeholder="Review notes..." value={adminComment} onChange={e => setAdminComment(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                  <div className="flex flex-wrap gap-2">
                    <ActionButton variant="success" onClick={() => handleWorkflowAction(`/api/requests?action=approve&id=${id}`, { comment: adminComment }, 'Approve this request?')} loading={actionLoading}>
                      Approve
                    </ActionButton>
                    <ActionButton variant="primary" onClick={() => handleWorkflowAction(`/api/requests?action=clarify&id=${id}`, { comment: adminComment })} loading={actionLoading}>
                      Request Clarification
                    </ActionButton>
                    <ActionButton variant="danger" onClick={() => handleWorkflowAction(`/api/requests?action=reject&id=${id}`, { comment: adminComment }, 'Reject this request?')} loading={actionLoading}>
                      Reject
                    </ActionButton>
                  </div>
                </div>
              )}

              {/* Admin Manager Assignment */}
              {auth?.role === 'admin' && request.status === 'APPROVED' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Assign Manager</h3>
                  <select value={assignedManagerId} onChange={e => setAssignedManagerId(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none max-w-xs">
                    <option value="">Select Manager...</option>
                    {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.department})</option>)}
                  </select>
                  <ActionButton onClick={() => handleWorkflowAction(`/api/requests?action=assign-manager&id=${id}`, { managerId: assignedManagerId }, 'Dispatch to this manager?')} disabled={!assignedManagerId} loading={actionLoading}>
                    Dispatch to Manager
                  </ActionButton>
                </div>
              )}

              {/* Reopened */}
              {auth?.role === 'admin' && request.status === 'REOPENED' && (
                <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={16} /> Request Reopened
                  </h3>
                  <textarea rows={2} placeholder="Decision notes..." value={adminComment} onChange={e => setAdminComment(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                  <div className="flex flex-wrap gap-2">
                    <ActionButton variant="success" onClick={() => handleWorkflowAction(`/api/requests?action=approve&id=${id}`, { comment: adminComment || 'Re-approved' }, 'Re-approve this request?')} loading={actionLoading}>
                      Re-Approve
                    </ActionButton>
                    <ActionButton variant="danger" onClick={() => handleWorkflowAction(`/api/requests?action=reject&id=${id}`, { comment: adminComment || 'Closed' }, 'Close this request?')} loading={actionLoading}>
                      Close
                    </ActionButton>
                  </div>
                </div>
              )}

              {/* Clarification Required */}
              {auth?.role === 'requester' && request.status === 'CLARIFICATION_REQUIRED' && (
                <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={16} /> Clarification Required
                  </h3>
                  <p className="text-xs text-slate-500">Admin has requested additional information.</p>
                  <ActionButton onClick={() => handleWorkflowAction(`/api/requests?action=submit&id=${id}`, { comment: 'Resubmitted after clarification' }, 'Resubmit for review?')} loading={actionLoading}>
                    Resubmit for Review
                  </ActionButton>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 text-left">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">Details</h3>
                {[
                  ['Category', request.category],
                  ['Asset Code', request.assetCode || 'N/A'],
                  ['Created', new Date(request.createdAt).toLocaleDateString()],
                  ['Manager', request.assignedManagerName || 'Unassigned'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500 font-medium">{label}</span>
                    <span className="text-slate-800 font-bold text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIAGNOSIS */}
        {activeTab === 'Diagnosis' && (
          <div className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:space-y-6 sm:p-8">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600"><Wrench size={18} /></div>
              <h3 className="text-base font-bold text-slate-800">Diagnostic Assessment</h3>
            </div>
            {request.inspection ? (
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <strong className="text-slate-400 font-bold block mb-1">Diagnosis:</strong>
                  <p className="bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed text-xs">{request.inspection.diagnosis}</p>
                </div>
                <div>
                  <strong className="text-slate-400 font-bold block mb-1">Recommendation:</strong>
                  <p className="bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed text-xs">{request.inspection.recommendation}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><strong className="text-slate-400 font-bold block mb-0.5">Duration:</strong><span className="text-slate-800 font-semibold">{request.inspection.estimatedDurationHours}h</span></div>
                  <div><strong className="text-slate-400 font-bold block mb-0.5">Mode:</strong><span className="text-slate-800 font-semibold capitalize">{request.inspection.serviceMode.replace(/_/g, ' ')}</span></div>
                </div>
              </div>
            ) : auth?.role === 'manager' && request.status === 'ASSIGNED_TO_MANAGER' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Diagnosis *</label>
                  <textarea rows={3} placeholder="Diagnostic analysis..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Recommendation *</label>
                  <textarea rows={3} placeholder="Recommendation..." value={recommendation} onChange={e => setRecommendation(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Est. Hours</label>
                    <input type="number" value={estDuration} onChange={e => setEstDuration(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Service Mode</label>
                    <select value={serviceMode} onChange={e => setServiceMode(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none">
                      <option value="INTERNAL_STAFF">Internal</option>
                      <option value="EXTERNAL_VENDOR">External Vendor</option>
                    </select>
                  </div>
                </div>
                <ActionButton onClick={() => handleWorkflowAction(`/api/requests?action=inspect&id=${id}`, { diagnosis, recommendation, estimatedDurationHours: estDuration, serviceMode }, 'Submit diagnosis report?')} loading={actionLoading} className="w-full">
                  Submit Diagnosis
                </ActionButton>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No inspection data available.</div>
            )}
          </div>
        )}

        {/* QUOTATION */}
        {activeTab === 'Quotation' && (
          <div className="space-y-6">
            {auth?.role === 'admin' && request.status === 'QUOTATION_SUBMITTED' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Budget Approval</h3>
                <textarea rows={2} placeholder="Approval notes..." value={adminComment} onChange={e => setAdminComment(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <ActionButton variant="success" onClick={() => handleWorkflowAction(`/api/quotations?action=approve&id=${id}`, { comment: adminComment }, 'Approve quotation?')} loading={actionLoading}>Approve</ActionButton>
                  <ActionButton variant="primary" onClick={() => handleWorkflowAction(`/api/quotations?action=revise&id=${id}`, { comment: adminComment })} loading={actionLoading}>Request Revision</ActionButton>
                  <ActionButton variant="danger" onClick={() => handleWorkflowAction(`/api/quotations?action=reject&id=${id}`, { comment: adminComment }, 'Reject quotation?')} loading={actionLoading}>Reject</ActionButton>
                </div>
              </div>
            )}

            {request.quotation ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">{request.quotation.quotationNumber}</span>
                    <h3 className="text-base font-bold text-slate-800">v{request.quotation.version}</h3>
                  </div>
                  <ActionButton variant="ghost" onClick={() => openPdf('quotation')}><Download size={14} /> PDF</ActionButton>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-2">Type</th><th className="pb-2">Description</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Price</th><th className="pb-2 text-right">Tax</th><th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {request.quotation.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 capitalize text-xs">{item.itemType.toLowerCase()}</td>
                          <td className="py-2.5 font-semibold text-slate-800">{item.description}</td>
                          <td className="py-2.5 text-right text-xs">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 text-right text-xs">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right text-xs">{item.taxRate}%</td>
                          <td className="py-2.5 text-right font-bold text-slate-800 text-xs">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100 text-sm">
                  <div className="space-y-1 text-right">
                    <div className="text-xs text-slate-500">Subtotal: ₹{request.quotation.subtotal.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">Tax: ₹{request.quotation.taxTotal.toFixed(2)}</div>
                    <div className="text-violet-700 font-bold">Total: ₹{request.quotation.grandTotal.toFixed(2)}</div>
                  </div>
                </div>
                {auth?.role === 'manager' && request.status === 'QUOTATION_IN_PROGRESS' && (
                  <ActionButton onClick={() => handleWorkflowAction(`/api/quotations?action=submit&id=${id}`, {}, 'Submit quotation for approval?')} loading={actionLoading}>
                    Submit Quotation
                  </ActionButton>
                )}
              </div>
            ) : null}

            {auth?.role === 'manager' && (['QUOTATION_IN_PROGRESS', 'QUOTATION_REVISION_REQUIRED'].includes(request.status) || !request.quotation) && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Build Estimate</h3>
                <div className="space-y-4">
                  {quoItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                        <select value={item.itemType} onChange={e => handleQuoItemChange(idx, 'itemType', e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none">
                          <option value="MATERIAL">Material</option><option value="LABOUR">Labour</option><option value="SERVICE">Service</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                        <input type="text" placeholder="Description..." value={item.description} onChange={e => handleQuoItemChange(idx, 'description', e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty</label>
                        <input type="number" value={item.quantity} onChange={e => handleQuoItemChange(idx, 'quantity', e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (₹)</label>
                        <input type="number" value={item.unitPrice} onChange={e => handleQuoItemChange(idx, 'unitPrice', e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                      </div>
                      <button type="button" onClick={() => removeQuoItem(idx)} className="p-2 text-rose-600 hover:bg-rose-50 rounded border border-rose-100 mt-5 bg-rose-50"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addQuoItem} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-bold">
                    <Plus size={14} /> Add Line Item
                  </button>
                  <div className="pt-4 border-t border-slate-200">
                    <ActionButton onClick={() => handleWorkflowAction(`/api/quotations?requestId=${id}`, { items: quoItems, terms: quoTerms })} loading={actionLoading}>
                      Save Draft
                    </ActionButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORK ORDER */}
        {activeTab === 'Work Order' && (
          <div className="space-y-6">
            {auth?.role === 'manager' && request.status === 'QUOTATION_APPROVED' && !request.workOrder?.workOrderNumber && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Create Work Order</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Technician</label>
                    <select value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none">
                      <option value="">Select...</option>
                      {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Vendor (if external)</label>
                    <input type="text" placeholder="Vendor name..." value={woVendorName} onChange={e => setWoVendorName(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Scope of Work</label>
                  <textarea rows={3} placeholder="Details..." value={woScope} onChange={e => setWoScope(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                </div>
                <ActionButton onClick={() => handleWorkflowAction(`/api/work-orders?requestId=${id}`, { technicianId: selectedTechId, vendorName: woVendorName, scope: woScope }, 'Issue work order?')} loading={actionLoading}>
                  Issue Work Order
                </ActionButton>
              </div>
            )}

            {request.workOrder?.workOrderNumber ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">{request.workOrder.workOrderNumber}</span>
                    <h3 className="text-base font-bold text-slate-800">Work Order</h3>
                  </div>
                  <ActionButton variant="ghost" onClick={() => openPdf('workorder')}><Download size={14} /> PDF</ActionButton>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <div><strong>Technician:</strong> {request.workOrder.technicianName || 'External'}</div>
                    {request.workOrder.vendorName && <div><strong>Vendor:</strong> {request.workOrder.vendorName}</div>}
                    <div><strong>Budget:</strong> ₹{request.workOrder.approvedAmount?.toFixed(2)}</div>
                  </div>
                  <div>
                    <strong>Scope:</strong>
                    <p className="bg-slate-50 p-3 rounded border border-slate-100 text-xs mt-1">{request.workOrder.scope}</p>
                  </div>
                </div>

                {/* Additional Costs */}
                {request.workOrder.additionalCosts?.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Additional Costs</h4>
                    <div className="space-y-3">
                      {request.workOrder.additionalCosts.map(c => (
                        <div key={c._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded">
                          <div>
                            <div className="text-xs font-bold text-slate-700">{c.reason}</div>
                            <div className="text-xs text-slate-400">{c.requestedBy}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold">₹{c.grandTotal.toFixed(2)}</span>
                            {c.status === 'PENDING' && auth?.role === 'admin' ? (
                              <div className="flex gap-1.5">
                                <ActionButton variant="success" onClick={() => handleWorkflowAction(`/api/work-orders?action=approve-cost&id=${id}&costId=${c._id}`, {}, 'Approve cost?')} loading={actionLoading} className="text-xs py-1 px-2">Approve</ActionButton>
                                <ActionButton variant="danger" onClick={() => handleWorkflowAction(`/api/work-orders?action=reject-cost&id=${id}&costId=${c._id}`, {}, 'Reject cost?')} loading={actionLoading} className="text-xs py-1 px-2">Reject</ActionButton>
                              </div>
                            ) : (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : c.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials */}
                {request.workOrder.materials?.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materials</h4>
                    <ul className="text-xs divide-y divide-slate-50">
                      {request.workOrder.materials.map((m, idx) => (
                        <li key={idx} className="flex justify-between py-2">
                          <span>{m.description} (×{m.quantity})</span>
                          <span className="font-bold">₹{m.totalCost.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technician Actions */}
                {auth?.role === 'technician' && String(request.workOrder.technicianId) === String(auth?.id) && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider">Work Center</h4>

                    {request.status === 'TECHNICIAN_ASSIGNED' && (
                      <div className="flex gap-2">
                        <ActionButton variant="success" onClick={() => handleWorkflowAction(`/api/work-orders?action=accept&id=${id}`, {}, 'Accept this assignment?')} loading={actionLoading}>Accept</ActionButton>
                        <ActionButton variant="danger" onClick={() => {
                          const reason = prompt('Decline reason:')
                          if (reason) handleWorkflowAction(`/api/work-orders?action=decline&id=${id}`, { reason })
                        }} loading={actionLoading}>Decline</ActionButton>
                      </div>
                    )}

                    {['WORK_ACCEPTED', 'PAUSED'].includes(request.status) && (
                      <ActionButton onClick={() => handleWorkflowAction(`/api/work-orders?action=start&id=${id}`, {}, 'Start work?')} loading={actionLoading}>Start Work</ActionButton>
                    )}

                    {['IN_PROGRESS', 'ADDITIONAL_COST_PENDING'].includes(request.status) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-slate-800">Progress Update</h5>
                          <div className="grid grid-cols-4 gap-2">
                            <input type="number" placeholder="%" value={progressPercent} onChange={e => setProgressPercent(e.target.value)} className="bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                            <input type="text" placeholder="Note..." value={progressNote} onChange={e => setProgressNote(e.target.value)} className="col-span-3 bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                          </div>
                          <ActionButton variant="ghost" onClick={() => handleWorkflowAction(`/api/work-orders?action=update&id=${id}`, { progressPercent, note: progressNote })} loading={actionLoading} className="text-xs py-1.5">Post Update</ActionButton>

                          <div className="border-t border-slate-200 pt-3 space-y-2">
                            <h5 className="text-xs font-bold text-slate-800">Add Material</h5>
                            <input type="text" placeholder="Material name..." value={materialDesc} onChange={e => setMaterialDesc(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="number" placeholder="Qty" value={materialQty} onChange={e => setMaterialQty(e.target.value)} className="bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                              <input type="number" placeholder="Cost/unit ₹" value={materialUnitCost} onChange={e => setMaterialUnitCost(e.target.value)} className="bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                            </div>
                            <ActionButton variant="ghost" onClick={() => handleWorkflowAction(`/api/work-orders?action=material&id=${id}`, { description: materialDesc, quantity: materialQty, unit: materialUnit, unitCost: materialUnitCost })} loading={actionLoading} className="text-xs py-1.5">Add Material</ActionButton>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-slate-800">Extra Budget</h5>
                          <input type="text" placeholder="Reason..." value={costReason} onChange={e => setCostReason(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                          <input type="number" placeholder="Amount ₹" value={costSubtotal} onChange={e => setCostSubtotal(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                          <ActionButton variant="ghost" onClick={() => handleWorkflowAction(`/api/work-orders?action=additional-cost&id=${id}`, { reason: costReason, subtotal: costSubtotal, taxTotal: costTax })} loading={actionLoading} className="text-xs py-1.5">Submit Cost Request</ActionButton>

                          <div className="border-t border-slate-200 pt-3 space-y-2">
                            <h5 className="text-xs font-bold text-slate-800">Complete</h5>
                            <textarea rows={2} placeholder="Summary..." value={completionSummary} onChange={e => setCompletionSummary(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none resize-none" />
                            <ActionButton variant="success" onClick={() => handleWorkflowAction(`/api/work-orders?action=complete&id=${id}`, { summary: completionSummary, warrantyDetails: completionWarranty, recommendations: completionRecs }, 'Mark as complete?')} loading={actionLoading} className="w-full">
                              Complete Work
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">No work order yet.</div>
            )}
          </div>
        )}

        {/* INVOICE */}
        {activeTab === 'Invoice' && (
          <div className="space-y-6">
            {auth?.role === 'admin' && request.status === 'INVOICE_SUBMITTED' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Invoice Review</h3>
                <textarea rows={2} placeholder="Notes..." value={adminComment} onChange={e => setAdminComment(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <ActionButton variant="success" onClick={() => handleWorkflowAction(`/api/invoices?action=approve&id=${id}`, { comment: adminComment }, 'Approve invoice?')} loading={actionLoading}>Approve</ActionButton>
                  <ActionButton variant="primary" onClick={() => handleWorkflowAction(`/api/invoices?action=revise&id=${id}`, { comment: adminComment })} loading={actionLoading}>Revision</ActionButton>
                  <ActionButton variant="danger" onClick={() => handleWorkflowAction(`/api/invoices?action=reject&id=${id}`, { comment: adminComment }, 'Reject invoice?')} loading={actionLoading}>Reject</ActionButton>
                </div>
              </div>
            )}

            {request.invoice?.invoiceNumber ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">{request.invoice.invoiceNumber}</span>
                    <h3 className="text-base font-bold text-slate-800">v{request.invoice.version}</h3>
                  </div>
                  <ActionButton variant="ghost" onClick={() => openPdf('invoice')}><Download size={14} /> PDF</ActionButton>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-2">Description</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Price</th><th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {request.invoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-semibold text-slate-800">{item.description}</td>
                          <td className="py-2.5 text-right text-xs">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 text-right text-xs">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800 text-xs">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100 text-sm">
                  <div className="space-y-1 text-right">
                    <div className="text-xs text-slate-500">Subtotal: ₹{request.invoice.subtotal.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">Tax: ₹{request.invoice.taxTotal.toFixed(2)}</div>
                    <div className="text-violet-700 font-bold">Due: ₹{request.invoice.grandTotal.toFixed(2)}</div>
                    <div className="text-emerald-600 font-bold text-xs">Balance: ₹{request.invoice.balanceDue.toFixed(2)}</div>
                  </div>
                </div>
                {auth?.role === 'manager' && request.status === 'INVOICE_IN_PROGRESS' && (
                  <ActionButton onClick={() => handleWorkflowAction(`/api/invoices?action=submit&id=${id}`, {}, 'Submit invoice?')} loading={actionLoading}>Submit Invoice</ActionButton>
                )}
              </div>
            ) : null}

            {auth?.role === 'manager' && ['SERVICE_VERIFIED', 'INVOICE_REVISION_REQUIRED'].includes(request.status) && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Generate Invoice</h3>
                <ActionButton onClick={() => {
                  const items = []
                  if (request.quotation) request.quotation.items.forEach(i => items.push({ description: i.description, quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice, taxRate: i.taxRate }))
                  if (request.workOrder?.materials) request.workOrder.materials.forEach(m => items.push({ description: `Material: ${m.description}`, quantity: m.quantity, unit: m.unit, unitPrice: m.unitCost }))
                  handleWorkflowAction(`/api/invoices?requestId=${id}`, { items }, 'Import quotation & create invoice?')
                }} loading={actionLoading}>
                  Import & Draft Invoice
                </ActionButton>
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === 'Payments' && (
          <div className="space-y-6">
            {(auth?.role === 'accounts' || auth?.role === 'admin') && ['PAYMENT_PENDING', 'PARTIALLY_PAID'].includes(request.status) && request.invoice?.status === 'APPROVED' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Record Payment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Amount (₹)</label>
                    <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Method</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none">
                      <option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank Transfer</option><option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Reference</label>
                    <input type="text" placeholder="Ref number..." value={payRef} onChange={e => setPayRef(e.target.value)} className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-sm focus:outline-none" />
                  </div>
                </div>
                <ActionButton onClick={() => handleWorkflowAction(`/api/payments?id=${id}`, { amount: payAmount, method: payMethod, referenceNumber: payRef, notes: payNotes }, 'Record payment?')} loading={actionLoading}>
                  Record Payment
                </ActionButton>
              </div>
            )}

            {request.payments?.length > 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment History</h3>
                  <ActionButton variant="ghost" onClick={() => openPdf('receipt')}><Download size={14} /> Receipt</ActionButton>
                </div>
                <div className="space-y-3">
                  {request.payments.map(p => (
                    <div key={p._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{p.paymentNumber}</div>
                        <div className="text-xs text-slate-400">{p.method} · {p.referenceNumber || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 text-sm">₹{p.amount.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">No payments recorded.</div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'History' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Audit Trail</h3>
            <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {request.statusHistory?.map((h, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-violet-600 ring-4 ring-white" />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="font-bold text-violet-600 uppercase tracking-wide">{h.newStatus.replace(/_/g, ' ')}</span>
                    <span>{formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-bold text-slate-800">{h.actorName}</span>: {h.comment || 'Status updated'}
                  </div>
                </div>
              ))}
              {(!request.statusHistory || request.statusHistory.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs">No history records.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RequestDetails
