import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { ChevronRight, ArrowLeft, PenTool, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

const categories = [
  { value: 'Classroom Equipment', icon: '🖥️', desc: 'Projectors, screens, speakers' },
  { value: 'Electrical & Lights', icon: '💡', desc: 'Wiring, switches, lighting' },
  { value: 'Plumbing & Water', icon: '🔧', desc: 'Pipes, taps, drainage' },
  { value: 'HVAC & A/C', icon: '❄️', desc: 'Air conditioning, ventilation' },
  { value: 'IT Hardware & Network', icon: '🌐', desc: 'Computers, network, printers' },
  { value: 'Furniture Repair', icon: '🪑', desc: 'Desks, chairs, fixtures' },
  { value: 'Civil & Painting', icon: '🎨', desc: 'Walls, floors, structures' },
]

const priorities = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200', activeColor: 'bg-slate-600 text-white', desc: 'General maintenance' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-200', activeColor: 'bg-blue-600 text-white', desc: 'Within 48 hours' },
  { value: 'HIGH', label: 'High', color: 'bg-amber-50 text-amber-600 border-amber-200', activeColor: 'bg-amber-600 text-white', desc: 'Impacts operations' },
  { value: 'EMERGENCY', label: 'Emergency', color: 'bg-rose-50 text-rose-600 border-rose-200', activeColor: 'bg-rose-600 text-white', desc: 'Immediate risk' },
]

function CreateRequest() {
  const [formData, setFormData] = useState({
    title: '', category: 'Classroom Equipment', location: '', assetCode: '',
    priority: 'LOW', emergencyReason: '', description: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdNumber, setCreatedNumber] = useState('')
  const navigate = useNavigate()
  const alert = useAlert()

  const descMaxLength = 1000
  const titleMaxLength = 100

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'description' && value.length > descMaxLength) return
    if (name === 'title' && value.length > titleMaxLength) return
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.title.trim()) errs.title = 'Title is required'
    if (!formData.location.trim()) errs.location = 'Location is required'
    if (!formData.description.trim()) errs.description = 'Description is required'
    if (formData.description.trim().length < 10) errs.description = 'Description must be at least 10 characters'
    if (formData.priority === 'EMERGENCY' && !formData.emergencyReason.trim()) errs.emergencyReason = 'Emergency reason is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (submitImmediately) => {
    if (!validate()) return

    setIsLoading(true)
    try {
      const res = await apiClient.post('/api/requests', { ...formData, submitImmediately })
      if (res.success) {
        setCreatedNumber(res.data.requestNumber)
        setShowSuccess(true)
        setTimeout(() => navigate('/requests'), 2000)
      } else {
        alert.showError('Failed', res.error || 'Could not submit request')
      }
    } catch (err) {
      alert.showError('Error', err.message || 'Server error')
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-scaleIn">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Request Created!</h2>
        <p className="text-sm text-slate-500 mb-1">Your service ticket has been submitted.</p>
        <p className="text-lg font-mono font-bold text-violet-600">{createdNumber}</p>
        <p className="text-xs text-slate-400 mt-4">Redirecting to requests...</p>
      </div>
    )
  }

  const getSelectedCategory = () => categories.find(c => c.value === formData.category)
  const getSelectedPriority = () => priorities.find(p => p.value === formData.priority)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-semibold transition-all">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">New Request</span>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600">
            <PenTool size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800">Service Request</h1>
            <p className="text-xs text-slate-500 mt-0.5">Describe your maintenance issue</p>
          </div>
        </div>

        <div className="space-y-5 text-left">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Title <span className="text-rose-400">*</span>
            </label>
            <input type="text" name="title" placeholder="e.g. Projector not displaying in Room 302" value={formData.title} onChange={handleInputChange}
              className={`w-full bg-slate-50 border rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${errors.title ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-violet-500 focus:bg-white'}`} />
            <div className="flex justify-between mt-1">
              {errors.title && <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1"><AlertTriangle size={10} />{errors.title}</span>}
              <span className="text-[10px] text-slate-400 ml-auto">{formData.title.length}/{titleMaxLength}</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Category <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(cat => (
                <button key={cat.value} type="button" onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.category === cat.value
                      ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <span className="text-lg block mb-1">{cat.icon}</span>
                  <span className="text-[10px] font-bold text-slate-700 block leading-tight">{cat.value}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location + Asset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Location <span className="text-rose-400">*</span>
              </label>
              <input type="text" name="location" placeholder="e.g. Main Block - Room 302" value={formData.location} onChange={handleInputChange}
                className={`w-full bg-slate-50 border rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${errors.location ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-violet-500 focus:bg-white'}`} />
              {errors.location && <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1"><AlertTriangle size={10} />{errors.location}</span>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Asset Code</label>
              <input type="text" name="assetCode" placeholder="e.g. PROJ-MB-302" value={formData.assetCode} onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all" />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Priority</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {priorities.map(p => (
                <button key={p.value} type="button" onClick={() => setFormData(prev => ({ ...prev, priority: p.value }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    formData.priority === p.value ? p.activeColor + ' border-transparent shadow-md' : p.color + ' hover:shadow-sm'
                  }`}>
                  <span className="text-xs font-bold block">{p.label}</span>
                  <span className={`text-[9px] block mt-0.5 ${formData.priority === p.value ? 'text-white/80' : 'text-slate-400'}`}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Reason */}
          {formData.priority === 'EMERGENCY' && (
            <div className="animate-slideUp">
              <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                Emergency Reason <span className="text-rose-400">*</span>
              </label>
              <input type="text" name="emergencyReason" placeholder="Why is this an emergency?" value={formData.emergencyReason} onChange={handleInputChange}
                className={`w-full bg-rose-50 border rounded-xl py-3 px-4 text-rose-800 placeholder-rose-400 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all ${errors.emergencyReason ? 'border-rose-400' : 'border-rose-200 focus:border-rose-500'}`} />
              {errors.emergencyReason && <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1"><AlertTriangle size={10} />{errors.emergencyReason}</span>}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea name="description" rows={5} placeholder="Describe the issue in detail..." value={formData.description} onChange={handleInputChange}
              className={`w-full bg-slate-50 border rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all resize-none ${errors.description ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-violet-500 focus:bg-white'}`} />
            <div className="flex justify-between mt-1">
              {errors.description && <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1"><AlertTriangle size={10} />{errors.description}</span>}
              <span className={`text-[10px] ml-auto ${formData.description.length > descMaxLength * 0.9 ? 'text-amber-500' : 'text-slate-400'}`}>
                {formData.description.length}/{descMaxLength}
              </span>
            </div>
          </div>

          {/* Priority Preview */}
          {formData.priority === 'EMERGENCY' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertTriangle size={14} />
              <span className="font-semibold">Emergency requests are escalated immediately and bypass normal queue.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" disabled={isLoading} onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all disabled:opacity-50">
              Save as Draft
            </button>
            <button type="button" disabled={isLoading} onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm shadow-violet-600/10 disabled:opacity-50">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>Submit Request</span><ChevronRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateRequest
