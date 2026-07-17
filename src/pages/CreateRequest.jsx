import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { ChevronRight, ArrowLeft, PenTool } from 'lucide-react'

const categories = [
  'Classroom Equipment',
  'Electrical & Lights',
  'Plumbing & Water',
  'HVAC & A/C',
  'IT Hardware & Network',
  'Furniture Repair',
  'Civil & Painting'
]

function CreateRequest() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Classroom Equipment',
    location: '',
    assetCode: '',
    priority: 'LOW',
    emergencyReason: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (submitImmediately) => {
    const { title, category, location, description, priority, emergencyReason } = formData

    if (!title || !category || !location || !description) {
      showError('Form Incomplete', 'Please fill in all required fields (Title, Category, Location, Description)')
      return
    }

    if (priority === 'EMERGENCY' && !emergencyReason) {
      showError('Reason Required', 'Please provide a reason for the emergency priority escalation')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post('/api/requests', {
        ...formData,
        submitImmediately
      })

      if (res.success) {
        showSuccess(
          submitImmediately ? 'Request Submitted!' : 'Draft Saved!',
          submitImmediately 
            ? `Your service ticket ${res.data.requestNumber} has been submitted for review.`
            : `Your service ticket ${res.data.requestNumber} is saved as a draft.`
        )
        navigate('/requests')
      } else {
        showError('Submission Failed', res.error || 'Failed to submit service request')
      }
    } catch (err) {
      showError('Submission Error', err.message || 'Server error saving request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slideUp">
      
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-700 transition-all font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Back to Requests</span>
        </button>
        <span className="text-xs text-slate-400 font-mono">Step 1 of 1</span>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Form Title */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600">
            <PenTool size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800">Submit Service Request</h1>
            <p className="text-xs text-slate-500 mt-0.5">Submit maintenance issue details to the service managers</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Request Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Projector not displaying input in Room 302"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Service Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl py-3 px-4 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-white text-slate-700">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Specific Location *
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Main Block - Room 302"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Asset Code (Optional)
              </label>
              <input
                type="text"
                name="assetCode"
                placeholder="e.g. PROJ-MB-302"
                value={formData.assetCode}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Priority Urgency
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl py-3 px-4 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all appearance-none"
              >
                <option value="LOW" className="bg-white text-slate-700">LOW (General maintenance)</option>
                <option value="MEDIUM" className="bg-white text-slate-700">MEDIUM (Needs attention within 48h)</option>
                <option value="HIGH" className="bg-white text-slate-700">HIGH (Interferes with classes/work)</option>
                <option value="EMERGENCY" className="bg-white text-slate-700">EMERGENCY (Immediate safety/operations risk)</option>
              </select>
            </div>
          </div>

          {formData.priority === 'EMERGENCY' && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                Emergency Reason *
              </label>
              <input
                type="text"
                name="emergencyReason"
                placeholder="Describe why this requires immediate escalation..."
                value={formData.emergencyReason}
                onChange={handleInputChange}
                className="w-full bg-rose-50 border border-rose-200 focus:border-rose-500 focus:bg-white rounded-xl py-3 px-4 text-rose-800 placeholder-rose-400 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Detailed Description of the Issue *
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Provide a thorough description of the fault..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] shadow-sm shadow-violet-600/10"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Submit Ticket</span>
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default CreateRequest
