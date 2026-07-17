import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { getAuthOrNull } from '../utils/auth'
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Wrench, 
  FileCheck, IndianRupee, Plus, Trash2, Download, Clock 
} from 'lucide-react'

const tabs = ['Overview', 'Diagnosis', 'Quotation', 'Work Order', 'Invoice', 'Payments', 'History']

function RequestDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()
  const auth = getAuthOrNull()

  const [request, setRequest] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [isLoading, setIsLoading] = useState(true)

  // Dropdown data
  const [technicians, setTechnicians] = useState([])
  const [managers, setManagers] = useState([])

  // Forms states
  const [adminComment, setAdminComment] = useState('')
  const [assignedManagerId, setAssignedManagerId] = useState('')
  
  // Inspection Form
  const [diagnosis, setDiagnosis] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [estDuration, setEstDuration] = useState('4')
  const [serviceMode, setServiceMode] = useState('INTERNAL_STAFF')

  // Quotation Builder Form
  const [quoItems, setQuoItems] = useState([{ description: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 18, discount: 0, itemType: 'MATERIAL' }])
  const [quoTerms, setQuoTerms] = useState('')

  // Work Order Form
  const [selectedTechId, setSelectedTechId] = useState('')
  const [woVendorName, setWoVendorName] = useState('')
  const [woScope, setWoScope] = useState('')
  const [woStartDate, setWoStartDate] = useState('')
  const [woDueDate, setWoDueDate] = useState('')

  // Tech Updates Form
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressNote, setProgressNote] = useState('')
  const [materialDesc, setMaterialDesc] = useState('')
  const [materialQty, setMaterialQty] = useState(1)
  const [materialUnit, setMaterialUnit] = useState('pcs')
  const [materialUnitCost, setMaterialUnitCost] = useState(0)

  // Additional Budget Form
  const [costReason, setCostReason] = useState('')
  const [costSubtotal, setCostSubtotal] = useState(0)
  const [costTax, setCostTax] = useState(0)

  // Completion Form
  const [completionSummary, setCompletionSummary] = useState('')
  const [completionWarranty, setCompletionWarranty] = useState('')
  const [completionRecs, setCompletionRecs] = useState('')

  // Verification Form
  const [verifyResult, setVerifyResult] = useState('RESOLVED')
  const [verifyRating, setVerifyRating] = useState(5)
  const [verifyComment, setVerifyComment] = useState('')

  // Invoice Form
  const [invItems, setInvItems] = useState([])
  const [invDiscount, setInvDiscount] = useState(0)

  // Payment Form
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('CASH')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')

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
          if (res.data.quotation.items && res.data.quotation.items.length > 0) {
            setQuoItems(res.data.quotation.items)
          }
        }
        if (res.data.invoice) {
          setInvDiscount(res.data.invoice.discountTotal || 0)
          if (res.data.invoice.items && res.data.invoice.items.length > 0) {
            setInvItems(res.data.invoice.items)
          }
        }
      }
    } catch (err) {
      showError('Load Error', 'Failed to retrieve request detailed parameters')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequestDetails()
  }, [id])

  useEffect(() => {
    if (auth.role === 'admin') {
      apiClient.get('/api/users?role=manager').then(res => {
        if (res.success) setManagers(res.users)
      })
    }
    if (auth.role === 'manager') {
      apiClient.get('/api/users?role=technician').then(res => {
        if (res.success) setTechnicians(res.users)
      })
    }
  }, [auth.role])

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  const handleWorkflowAction = async (endpoint, payload) => {
    try {
      const res = await apiClient.post(endpoint, payload)
      if (res.success) {
        showSuccess('Success', 'Workflow state updated successfully')
        fetchRequestDetails()
        setAdminComment('')
      } else {
        showError('Action Failed', res.error || 'Action could not be executed')
      }
    } catch (err) {
      showError('System Error', err.message || 'Workflow connection error')
    }
  }

  const openPdf = (type) => {
    const origin = import.meta.env.VITE_API_URL || ''
    window.open(`${origin}/api/generate-pdf?type=${type}&id=${id}`, '_blank')
  }

  const addQuoItem = () => {
    setQuoItems([...quoItems, { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 18, discount: 0, itemType: 'MATERIAL' }])
  }
  const removeQuoItem = (index) => {
    setQuoItems(quoItems.filter((_, i) => i !== index))
  }
  const handleQuoItemChange = (index, field, val) => {
    const newItems = [...quoItems]
    newItems[index][field] = val
    setQuoItems(newItems)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Back button & status info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <button 
          onClick={() => navigate('/requests')}
          className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-700 transition-all font-semibold self-start"
        >
          <ArrowLeft size={16} />
          <span>Back to Requests Logs</span>
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">Current Status:</span>
          <span className="font-bold text-violet-750 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded uppercase tracking-wider">
            {request.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 text-left">
        <div>
          <span className="text-xs font-mono text-violet-600 font-bold tracking-wider">{request.requestNumber}</span>
          <h1 className="text-2xl font-black text-slate-800 mt-1">{request.title}</h1>
          <p className="text-sm text-slate-500 mt-1">Location: {request.location} | Requester: {request.requesterName} ({request.requesterEmail})</p>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            request.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
            request.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
            'bg-slate-100 text-slate-600'
          }`}>
            {request.priority} Priority
          </span>
        </div>
      </div>

      {/* Tab Menu */}
      <div className="flex overflow-x-auto space-x-1 border-b border-slate-200 pb-px scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-violet-600 text-violet-600 bg-violet-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description of Problem</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{request.description}</p>
                {request.emergencyReason && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs mt-4">
                    <strong>Emergency Escalation Reason:</strong> {request.emergencyReason}
                  </div>
                )}
              </div>

              {/* Verification & Action center (if Requester feedback is pending) */}
              {auth.role === 'requester' && request.status === 'TECHNICIAN_COMPLETED' && (
                <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-2">
                    <AlertCircle size={16} />
                    <span>Completion Verification Required</span>
                  </h3>
                  <p className="text-xs text-slate-500">The assigned technician has marked this task complete. Please verify if the issue is fully resolved.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Resolution Result</label>
                      <select 
                        value={verifyResult} 
                        onChange={(e) => setVerifyResult(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-700 text-sm focus:outline-none"
                      >
                        <option value="RESOLVED">RESOLVED (Perfectly working)</option>
                        <option value="PARTIALLY_RESOLVED">PARTIALLY RESOLVED (Usable but incomplete)</option>
                        <option value="UNRESOLVED">UNRESOLVED (Needs further work)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Rating (1 to 5 stars)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="5"
                        value={verifyRating} 
                        onChange={(e) => setVerifyRating(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-700 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Feedback Notes</label>
                    <textarea 
                      rows={3}
                      placeholder="Comment on the service performance..."
                      value={verifyComment}
                      onChange={(e) => setVerifyComment(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-700 placeholder-slate-400 text-sm focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={() => handleWorkflowAction(`/api/requests?action=verify&id=${id}`, { result: verifyResult, rating: verifyRating, comment: verifyComment })}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all"
                  >
                    Submit Verification Report
                  </button>
                </div>
              )}

              {/* Admin Request Review Options */}
              {auth.role === 'admin' && request.status === 'SUBMITTED' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Admin Action Center</h3>
                  <p className="text-xs text-slate-500">Review request and select approval workflow</p>
                  
                  <textarea
                    rows={2}
                    placeholder="Enter review decision notes / rejection reason / clarification details..."
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-750 placeholder-slate-400 text-sm focus:outline-none resize-none"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleWorkflowAction(`/api/requests?action=approve&id=${id}`, { comment: adminComment })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => handleWorkflowAction(`/api/requests?action=clarify&id=${id}`, { comment: adminComment })}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      Request Clarification
                    </button>
                    <button
                      onClick={() => handleWorkflowAction(`/api/requests?action=reject&id=${id}`, { comment: adminComment })}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Manager Assignment */}
              {auth.role === 'admin' && request.status === 'APPROVED' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                  <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Assign Service Manager</h3>
                  
                  <div className="max-w-xs">
                    <select
                      value={assignedManagerId}
                      onChange={(e) => setAssignedManagerId(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-750 text-sm focus:outline-none"
                    >
                      <option value="">Select Manager...</option>
                      {managers.map(m => (
                        <option key={m._id} value={m._id} className="bg-white text-slate-700">{m.name} ({m.department})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    disabled={!assignedManagerId}
                    onClick={() => handleWorkflowAction(`/api/requests?action=assign-manager&id=${id}`, { managerId: assignedManagerId })}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all disabled:opacity-50"
                  >
                    Dispatch to Selected Manager
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar metadata */}
            <div className="space-y-6 text-left">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">Request Details</h3>
                
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Category</span>
                  <span className="text-slate-800 font-bold text-right">{request.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Asset Code</span>
                  <span className="text-slate-850 font-bold text-right font-mono text-xs">{request.assetCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Created On</span>
                  <span className="text-slate-805 font-bold text-right">{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Manager</span>
                  <span className="text-slate-800 font-bold text-right">{request.assignedManagerName || 'Unassigned'}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* DIAGNOSIS TAB */}
        {activeTab === 'Diagnosis' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 text-left">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                <Wrench size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Manager Diagnostic Assessment</h3>
            </div>

            {request.inspection ? (
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <strong className="text-slate-400 font-bold block mb-1">Diagnosis Analysis:</strong>
                  <p className="bg-slate-50 p-3 rounded border border-slate-150 leading-relaxed text-xs">{request.inspection.diagnosis}</p>
                </div>
                <div>
                  <strong className="text-slate-400 font-bold block mb-1">Repair Recommendation:</strong>
                  <p className="bg-slate-50 p-3 rounded border border-slate-150 leading-relaxed text-xs">{request.inspection.recommendation}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-slate-400 font-bold block mb-0.5">Est. Duration:</strong>
                    <span className="text-slate-800 font-semibold">{request.inspection.estimatedDurationHours} hours</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 font-bold block mb-0.5">Service Mode:</strong>
                    <span className="text-slate-800 font-semibold capitalize">{request.inspection.serviceMode.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            ) : auth.role === 'manager' && request.status === 'ASSIGNED_TO_MANAGER' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Diagnosis Details *</label>
                  <textarea
                    rows={3}
                    placeholder="Enter diagnostic analysis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Repair Recommendation *</label>
                  <textarea
                    rows={3}
                    placeholder="Enter recommendation..."
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Est. Hours</label>
                    <input 
                      type="number" 
                      value={estDuration} 
                      onChange={(e) => setEstDuration(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-800 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Service Execution Mode</label>
                    <select
                      value={serviceMode}
                      onChange={(e) => setServiceMode(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-700 text-sm focus:outline-none"
                    >
                      <option value="INTERNAL_STAFF">Internal Technician</option>
                      <option value="EXTERNAL_VENDOR">External Vendor</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleWorkflowAction(`/api/requests?action=inspect&id=${id}`, { diagnosis, recommendation, estimatedDurationHours: estDuration, serviceMode })}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3 rounded-lg transition-all w-full"
                >
                  Complete Diagnosis Report
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Diagnostic reports are not available or pending manager inspection.
              </div>
            )}
          </div>
        )}

        {/* QUOTATION TAB */}
        {activeTab === 'Quotation' && (
          <div className="space-y-6">
            
            {/* Admin Quotation approval options */}
            {auth.role === 'admin' && request.status === 'QUOTATION_SUBMITTED' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Admin Budget Approval Center</h3>
                
                <textarea
                  rows={2}
                  placeholder="Enter approval or revision instructions comment..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleWorkflowAction(`/api/quotations?action=approve&id=${id}`, { comment: adminComment })}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    Approve Quotation
                  </button>
                  <button
                    onClick={() => handleWorkflowAction(`/api/quotations?action=revise&id=${id}`, { comment: adminComment })}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={() => handleWorkflowAction(`/api/quotations?action=reject&id=${id}`, { comment: adminComment })}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    Reject Quotation
                  </button>
                </div>
              </div>
            )}

            {/* Display Quotation */}
            {request.quotation ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">Quotation Estimate</span>
                    <h3 className="text-base font-bold text-slate-800">{request.quotation.quotationNumber} (v{request.quotation.version})</h3>
                  </div>

                  <button
                    onClick={() => openPdf('quotation')}
                    className="flex items-center space-x-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750 px-4 py-2 rounded-lg text-xs font-bold transition-all animate-fadeIn"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Tax (GST)</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {request.quotation.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 capitalize">{item.itemType.toLowerCase()}</td>
                          <td className="py-2.5 font-semibold text-slate-800">{item.description}</td>
                          <td className="py-2.5 text-right">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 text-right">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right">{item.taxRate}%</td>
                          <td className="py-2.5 text-right font-bold text-slate-800">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 text-sm font-semibold text-slate-700">
                  <div className="space-y-1.5 text-right">
                    <div>Subtotal: ₹{request.quotation.subtotal.toFixed(2)}</div>
                    <div>Tax Total: ₹{request.quotation.taxTotal.toFixed(2)}</div>
                    <div className="text-violet-700 text-base font-bold">Grand Total: ₹{request.quotation.grandTotal.toFixed(2)}</div>
                  </div>
                </div>

                {auth.role === 'manager' && request.status === 'QUOTATION_IN_PROGRESS' && (
                  <button
                    onClick={() => handleWorkflowAction(`/api/quotations?action=submit&id=${id}`)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all"
                  >
                    Submit Quotation for Approval
                  </button>
                )}
              </div>
            ) : null}

            {/* Quotation Builder (visible to managers) */}
            {auth.role === 'manager' && 
             (['QUOTATION_IN_PROGRESS', 'QUOTATION_REVISION_REQUIRED'].includes(request.status) || !request.quotation) && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Quotation Line-Item Estimate Builder</h3>

                <div className="space-y-4">
                  {quoItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end p-4 bg-slate-50 rounded-lg border border-slate-150">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                        <select
                          value={item.itemType}
                          onChange={(e) => handleQuoItemChange(idx, 'itemType', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="MATERIAL">Material</option>
                          <option value="LABOUR">Labour</option>
                          <option value="SERVICE">Service</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description *</label>
                        <input
                          type="text"
                          placeholder="e.g. HDMI Board Replacement"
                          value={item.description}
                          onChange={(e) => handleQuoItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuoItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price (₹) *</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleQuoItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => removeQuoItem(idx)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded border border-rose-100 mt-6 bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addQuoItem}
                    className="flex items-center space-x-1 text-xs text-violet-600 hover:text-violet-700 font-bold"
                  >
                    <Plus size={14} />
                    <span>Add Line Item</span>
                  </button>

                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleWorkflowAction(`/api/quotations?requestId=${id}`, { items: quoItems, terms: quoTerms })}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all"
                    >
                      Save Estimate Draft
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORK ORDER TAB */}
        {activeTab === 'Work Order' && (
          <div className="space-y-6">
            
            {/* Work Order Builder */}
            {auth.role === 'manager' && request.status === 'QUOTATION_APPROVED' && !request.workOrder?.workOrderNumber && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-left">
                <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Generate & Dispatch Work Order</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Assign Technician</label>
                    <select
                      value={selectedTechId}
                      onChange={(e) => setSelectedTechId(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-700 text-sm focus:outline-none"
                    >
                      <option value="">Select Technician...</option>
                      {technicians.map(t => (
                        <option key={t._id} value={t._id} className="bg-white text-slate-700">{t.name} ({t.department})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">External Vendor (If external)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ABC Projector Services"
                      value={woVendorName}
                      onChange={(e) => setWoVendorName(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-750 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Scope of Work</label>
                  <textarea 
                    rows={3}
                    placeholder="Provide details..."
                    value={woScope}
                    onChange={(e) => setWoScope(e.target.value)}
                    className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-750 placeholder-slate-400 text-sm focus:outline-none resize-none"
                  />
                </div>

                <button
                  onClick={() => handleWorkflowAction(`/api/work-orders?requestId=${id}`, { technicianId: selectedTechId, vendorName: woVendorName, scope: woScope })}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all"
                >
                  Issue Work Order
                </button>
              </div>
            )}

            {/* Display Work Order */}
            {request.workOrder && request.workOrder.workOrderNumber ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">Work Order Details</span>
                    <h3 className="text-base font-bold text-slate-800">{request.workOrder.workOrderNumber}</h3>
                  </div>

                  <button
                    onClick={() => openPdf('workorder')}
                    className="flex items-center space-x-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-700">
                  <div className="space-y-2">
                    <div><strong>Technician:</strong> {request.workOrder.technicianName || 'External Vendor'}</div>
                    {request.workOrder.vendorName && <div><strong>Vendor:</strong> {request.workOrder.vendorName}</div>}
                    <div><strong>Approved Budget:</strong> ₹{request.workOrder.approvedAmount.toFixed(2)}</div>
                  </div>
                  <div className="space-y-2">
                    <div><strong>Scope of Work:</strong></div>
                    <p className="bg-slate-55/40 p-3 rounded border border-slate-150 leading-relaxed text-xs">{request.workOrder.scope}</p>
                  </div>
                </div>

                {/* Additional Cost Requests */}
                {request.workOrder.additionalCosts && request.workOrder.additionalCosts.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Additional Cost Approvals</h4>
                    <div className="space-y-3">
                      {request.workOrder.additionalCosts.map((c) => (
                        <div key={c._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 rounded">
                          <div>
                            <div className="text-xs font-bold text-slate-750">{c.reason}</div>
                            <div className="text-[10px] text-slate-400">Requested by: {c.requestedBy}</div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-slate-750">₹{c.grandTotal.toFixed(2)}</span>
                            {c.status === 'PENDING' && auth.role === 'admin' ? (
                              <div className="flex space-x-1.5">
                                <button
                                  onClick={() => handleWorkflowAction(`/api/work-orders?action=approve-cost&id=${id}&costId=${c._id}`)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleWorkflowAction(`/api/work-orders?action=reject-cost&id=${id}&costId=${c._id}`)}
                                  className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-850' : 
                                c.status === 'REJECTED' ? 'bg-rose-100 text-rose-850' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {c.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Material usage list */}
                {request.workOrder.materials && request.workOrder.materials.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recorded Material Usage</h4>
                    <ul className="text-xs text-slate-650 space-y-1">
                      {request.workOrder.materials.map((m, idx) => (
                        <li key={idx} className="flex justify-between py-1 border-b border-slate-50">
                          <span>{m.description} (Qty: {m.quantity})</span>
                          <span className="font-bold text-slate-800">₹{m.totalCost.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technician Action Center */}
                {auth.role === 'technician' && request.workOrder.technicianId === auth.id && (
                  <div className="pt-4 border-t border-slate-100 space-y-6">
                    <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider">Technician Work Center</h4>
                    
                    {request.status === 'TECHNICIAN_ASSIGNED' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWorkflowAction(`/api/work-orders?action=accept&id=${id}`)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                          Accept Assignment
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please enter decline reason:')
                            if (reason) handleWorkflowAction(`/api/work-orders?action=decline&id=${id}`, { reason })
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                          Decline Assignment
                        </button>
                      </div>
                    )}

                    {['WORK_ACCEPTED', 'PAUSED'].includes(request.status) && (
                      <button
                        onClick={() => handleWorkflowAction(`/api/work-orders?action=start&id=${id}`)}
                        className="bg-violet-600 hover:bg-violet-750 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        Start Executing Work
                      </button>
                    )}

                    {['IN_PROGRESS', 'ADDITIONAL_COST_PENDING'].includes(request.status) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 md:space-y-0">
                        
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-800">Log Job Updates</h5>
                          
                          <div className="grid grid-cols-4 gap-2 items-center">
                            <input 
                              type="number" 
                              placeholder="%"
                              value={progressPercent}
                              onChange={(e) => setProgressPercent(e.target.value)}
                              className="col-span-1 bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                            />
                            <input 
                              type="text" 
                              placeholder="Update note..."
                              value={progressNote}
                              onChange={(e) => setProgressNote(e.target.value)}
                              className="col-span-3 bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                            />
                          </div>

                          <button
                            onClick={() => handleWorkflowAction(`/api/work-orders?action=update&id=${id}`, { progressPercent, note: progressNote })}
                            className="bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750 px-3 py-1.5 rounded text-[10px] font-bold"
                          >
                            Post Progress Update
                          </button>

                          <div className="border-t border-slate-200 pt-4 space-y-2">
                            <h5 className="text-xs font-bold text-slate-800">Add Material Usage</h5>
                            <input 
                              type="text" 
                              placeholder="Material name..."
                              value={materialDesc}
                              onChange={(e) => setMaterialDesc(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="number" 
                                placeholder="Qty"
                                value={materialQty}
                                onChange={(e) => setMaterialQty(e.target.value)}
                                className="bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                              />
                              <input 
                                type="number" 
                                placeholder="Cost per unit (₹)"
                                value={materialUnitCost}
                                onChange={(e) => setMaterialUnitCost(e.target.value)}
                                className="bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={() => handleWorkflowAction(`/api/work-orders?action=material&id=${id}`, { description: materialDesc, quantity: materialQty, unit: materialUnit, unitCost: materialUnitCost })}
                              className="bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750 px-3 py-1.5 rounded text-[10px] font-bold"
                            >
                              Add Material Line
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-800">Request Extra Budget</h5>
                          <input 
                            type="text" 
                            placeholder="Reason for extra cost..."
                            value={costReason}
                            onChange={(e) => setCostReason(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                          />
                          <input 
                            type="number" 
                            placeholder="Amount (₹)"
                            value={costSubtotal}
                            onChange={(e) => setCostSubtotal(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                          />
                          <button
                            onClick={() => handleWorkflowAction(`/api/work-orders?action=additional-cost&id=${id}`, { reason: costReason, subtotal: costSubtotal, taxTotal: costTax })}
                            className="bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750 px-3 py-1.5 rounded text-[10px] font-bold"
                          >
                            Submit Cost Request
                          </button>

                          <div className="border-t border-slate-200 pt-4 space-y-2">
                            <h5 className="text-xs font-bold text-slate-800">Complete Operations</h5>
                            <textarea
                              rows={2}
                              placeholder="Enter completion summary notes..."
                              value={completionSummary}
                              onChange={(e) => setCompletionSummary(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none resize-none"
                            />
                            <button
                              onClick={() => handleWorkflowAction(`/api/work-orders?action=complete&id=${id}`, { summary: completionSummary, warrantyDetails: completionWarranty, recommendations: completionRecs })}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all w-full"
                            >
                              Dispatch Completion Report
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No work order raised yet. Wait for budget quotation approval.
              </div>
            )}

          </div>
        )}

        {/* INVOICE TAB */}
        {activeTab === 'Invoice' && (
          <div className="space-y-6">
            
            {/* Admin Invoice approval options */}
            {auth.role === 'admin' && request.status === 'INVOICE_SUBMITTED' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Admin Invoice Review Portal</h3>
                
                <textarea
                  rows={2}
                  placeholder="Enter invoice decision notes or revision comments..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none resize-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleWorkflowAction(`/api/invoices?action=approve&id=${id}`, { comment: adminComment })}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    Approve Invoice
                  </button>
                  <button
                    onClick={() => handleWorkflowAction(`/api/invoices?action=revise&id=${id}`, { comment: adminComment })}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    Request Invoice Revision
                  </button>
                  <button
                    onClick={() => handleWorkflowAction(`/api/invoices?action=reject&id=${id}`, { comment: adminComment })}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    Reject Invoice
                  </button>
                </div>
              </div>
            )}

            {/* Display Invoice */}
            {request.invoice && request.invoice.invoiceNumber ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">Invoice Summary</span>
                    <h3 className="text-base font-bold text-slate-800">{request.invoice.invoiceNumber} (v{request.invoice.version})</h3>
                  </div>

                  <button
                    onClick={() => openPdf('invoice')}
                    className="flex items-center space-x-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Quantity</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {request.invoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-semibold text-slate-800">{item.description}</td>
                          <td className="py-2.5 text-right">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 text-right">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 text-sm font-semibold text-slate-700">
                  <div className="space-y-1.5 text-right">
                    <div>Subtotal: ₹{request.invoice.subtotal.toFixed(2)}</div>
                    <div>Tax: ₹{request.invoice.taxTotal.toFixed(2)}</div>
                    <div className="text-violet-700 text-base font-bold">Total Amount Due: ₹{request.invoice.grandTotal.toFixed(2)}</div>
                    <div className="text-emerald-600 font-bold">Balance Due: ₹{request.invoice.balanceDue.toFixed(2)}</div>
                  </div>
                </div>

                {auth.role === 'manager' && request.status === 'INVOICE_IN_PROGRESS' && (
                  <button
                    onClick={() => handleWorkflowAction(`/api/invoices?action=submit&id=${id}`)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all"
                  >
                    Submit Invoice for Approval
                  </button>
                )}
              </div>
            ) : null}

            {/* Invoice Builder (visible to managers) */}
            {auth.role === 'manager' && 
             (['SERVICE_VERIFIED', 'INVOICE_REVISION_REQUIRED'].includes(request.status) || !request.invoice) && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Generate Service Invoice</h3>
                <p className="text-xs text-slate-500">Generates invoice importing quotation line items and recording actuals.</p>

                <button
                  onClick={() => {
                    const items = []
                    if (request.quotation) {
                      request.quotation.items.forEach(i => items.push({ description: i.description, quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice, taxRate: i.taxRate }))
                    }
                    if (request.workOrder && request.workOrder.materials) {
                      request.workOrder.materials.forEach(m => items.push({ description: `Material: ${m.description}`, quantity: m.quantity, unit: m.unit, unitPrice: m.unitCost }))
                    }
                    
                    handleWorkflowAction(`/api/invoices?requestId=${id}`, { items })
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all"
                >
                  Import Quotation Details & Draft Invoice
                </button>
              </div>
            )}

          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'Payments' && (
          <div className="space-y-6">
            
            {/* Record Payment Form */}
            {auth.role === 'accounts' && ['PAYMENT_PENDING', 'PARTIALLY_PAID'].includes(request.status) && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Record Transaction Payment</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Payment Amount (₹)</label>
                    <input 
                      type="number" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-800 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-700 text-sm focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Reference Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UTR123456789"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-slate-800 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleWorkflowAction(`/api/payments?id=${id}`, { amount: payAmount, method: payMethod, referenceNumber: payRef, notes: payNotes })}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all"
                >
                  Record Payment & Clear Invoice
                </button>
              </div>
            )}

            {/* List recorded payments */}
            {request.payments && request.payments.length > 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Transaction History Logs</h3>
                  <button
                    onClick={() => openPdf('receipt')}
                    className="flex items-center space-x-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-150 text-violet-750 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={14} />
                    <span>Download Last Receipt</span>
                  </button>
                </div>

                <ul className="divide-y divide-slate-50">
                  {request.payments.map((p) => (
                    <li key={p._id} className="py-3 flex justify-between items-center text-sm text-slate-700">
                      <div>
                        <div className="font-bold text-slate-800">{p.paymentNumber}</div>
                        <div className="text-[10px] text-slate-400">Method: {p.method} | Ref: {p.referenceNumber || 'None'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">₹{p.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No payment transactions recorded yet.
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'History' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Audit Trail History</h3>
            
            <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {request.statusHistory.map((h, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-violet-600 ring-4 ring-white"></div>
                  
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-violet-600 uppercase tracking-wide">{h.newStatus.replace(/_/g, ' ')}</span>
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-bold text-slate-800">{h.actorName}</span>: {h.comment || 'Status modified'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default RequestDetails
