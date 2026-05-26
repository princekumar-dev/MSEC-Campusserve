import { useEffect, useMemo, useState } from 'react'
import apiClient from '../utils/apiClient'
import { getUserFriendlyMessage } from '../utils/apiErrorMessages'
import { Navigate } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import { useConfetti } from '../components/Confetti'
import SwipeableCard from '../components/SwipeableCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { usePushNotifications, usePageFocus } from '../hooks/usePushNotifications'

function Leave() {
  const authStr = localStorage.getItem('auth')
  const auth = authStr ? JSON.parse(authStr) : null
  if (!auth || auth.role !== 'student') {
    return <Navigate to="/home" replace />
  }

  const { showSuccess, showError } = useAlert()
  const { celebrate, ConfettiContainer } = useConfetti()

  const [type, setType] = useState(() => {
    // Restore previous tab selection from localStorage
    return localStorage.getItem('leaveTabSelection') || 'leave'
  })
  const [reason, setReason] = useState('')
  const [reasonTouched, setReasonTouched] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expectedArrivalTime, setExpectedArrivalTime] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachmentName, setAttachmentName] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [recordingRequest, setRecordingRequest] = useState(() => {
    // Restore timer state from localStorage or sessionStorage on mount
    const saved = localStorage.getItem('activeTimer') || sessionStorage.getItem('activeTimer')
    return saved ? JSON.parse(saved) : null
  })
  const [recordingTime, setRecordingTime] = useState(0) // Timer for recording
  const [arrivalTime, setArrivalTime] = useState(null) // Store the actual arrival time
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmingArrivalId, setConfirmingArrivalId] = useState(null)
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false)

  const studentId = auth.id

  // Styles for interactive UI
  const styles = useMemo(() => `
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); }
      70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
      100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
    }
    .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }

    .segmented-control { position: relative; }
    .segmented-highlight { position: absolute; top: 0.25rem; bottom: 0.25rem; background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2); border-radius: 0.75rem; transition: left 200ms ease; }
  `, [])

  const fetchRequests = async (force = false) => {
    try {
      setLoading(true)
      const opts = force ? { cache: false, dedupe: false } : undefined
      const data = await apiClient.get(`/api/leaves?studentId=${studentId}`, opts)
      if (data.success) {
        setRequests(data.requests || [])
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchRequests()
    const handleGlobal = () => fetchRequests(true)
    window.addEventListener('notificationsUpdated', handleGlobal)
    window.addEventListener('marksheetsUpdated', handleGlobal)
    
    // Live clock timer
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000)
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleGlobal)
      window.removeEventListener('marksheetsUpdated', handleGlobal)
      clearInterval(clockTimer)
    }
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAttachmentName(file.name)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        const base64Str = canvas.toDataURL('image/jpeg', 0.6)
        setAttachment(base64Str)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // Listen for push notifications and page focus changes
  usePushNotifications({
    'late_arrival': () => {
      console.log('🔔 Late arrival notification triggered refresh')
      fetchRequests()
    }
  })

  usePageFocus(() => {
    fetchRequests()
    // Restore previous tab selection from localStorage
    const savedTab = localStorage.getItem('leaveTabSelection') || 'leave'
    setType(savedTab)
  })

  // Restore timer state on visibility change (mobile-specific)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - restore timer state
        const saved = localStorage.getItem('activeTimer')
        if (saved) {
          const savedRequest = JSON.parse(saved)
          // Check if this request still exists and needs confirmation
          setRecordingRequest(savedRequest)
        }
      }
    }

    const handlePageShow = (event) => {
      // Handle back/forward navigation on mobile (iOS Safari)
      if (event.persisted) {
        const saved = localStorage.getItem('activeTimer')
        if (saved) {
          const savedRequest = JSON.parse(saved)
          setRecordingRequest(savedRequest)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  // Persist timer state to localStorage whenever it changes
  useEffect(() => {
    if (recordingRequest) {
      localStorage.setItem('activeTimer', JSON.stringify(recordingRequest))
      // Also save to sessionStorage as backup for mobile
      sessionStorage.setItem('activeTimer', JSON.stringify(recordingRequest))
    } else {
      localStorage.removeItem('activeTimer')
      sessionStorage.removeItem('activeTimer')
    }
  }, [recordingRequest])

  // Save selected tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('leaveTabSelection', type)
  }, [type])

  // Timer effect for recording - updates display every second
  useEffect(() => {
    if (!recordingRequest) return
    
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1) // This triggers a re-render to update the time display
    }, 1000)
    
    return () => clearInterval(timer)
  }, [recordingRequest])

  // Default ETA helper for late - returns just time (HH:MM)
  const defaultETA = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30)
    const pad = (n) => `${n}`.padStart(2, '0')
    const hh = pad(now.getHours())
    const mi = pad(now.getMinutes())
    return `${hh}:${mi}`
  }

  useEffect(() => {
    if (type === 'late' && !expectedArrivalTime) {
      setExpectedArrivalTime(defaultETA())
    }
  }, [type])

  // Derived values & validation
  const reasonMax = 200
  const reasonCount = reason.length
  const daysCount = useMemo(() => {
    if (!startDate || !endDate) return 0
    const s = new Date(startDate)
    const e = new Date(endDate)
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
    return isNaN(diff) || diff < 0 ? 0 : diff
  }, [startDate, endDate])

  useEffect(() => {
    if (startDate && endDate) {
      // Ensure endDate is not before startDate
      const s = new Date(startDate)
      const e = new Date(endDate)
      if (e < s) setEndDate(startDate)
    }
  }, [startDate, endDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setReasonTouched(true)
    if (!reason.trim()) {
      showError('Missing reason', 'Please provide a reason.')
      return
    }
    if (reason.length > reasonMax) {
      showError('Too long', `Reason should be under ${reasonMax} characters.`)
      return
    }
    if (type === 'leave') {
      if (!startDate || !endDate) {
        showError('Missing dates', 'Please provide start and end dates.')
        return
      }
      if (daysCount <= 0) {
        showError('Invalid dates', 'End date must be the same or after start date.')
        return
      }
    } else {
      if (!expectedArrivalTime) {
        showError('Missing time', 'Please provide expected arrival time.')
        return
      }
    }
    setSubmitting(true)
    try {
      const body = {
        type,
        reason,
        regNumber: auth.regNumber,
        phoneNumber: auth.phoneNumber
      }
      if (type === 'leave') {
        body.startDate = startDate
        body.endDate = endDate
      } else {
        // Combine today's date with the time input
        const today = new Date().toISOString().split('T')[0]
        body.expectedArrivalTime = `${today}T${expectedArrivalTime}`
      }
      if (attachment) {
        body.attachmentData = attachment
      }
      const data = await apiClient.post('/api/leaves?action=create', body)
      if (data && data.success) {
        showSuccess('Request submitted', `${type === 'leave' ? 'Leave' : 'Late'} request created`)
        celebrate()
        setReason('')
        setStartDate('')
        setEndDate('')
        setExpectedArrivalTime('')
        setAttachment(null)
        setAttachmentName('')
        if (type === 'late' && data.request) {
          setRecordingRequest(data.request)
          setRecordingTime(0)
          setArrivalTime(null)
          setIsTimerModalOpen(true)
        } else {
          setType('leave')
        }
        // Force-fetch to bypass cached responses so the new request appears immediately
        fetchRequests(true)
      } else {
        showError('Failed', data.error || 'Could not submit request')
      }
    } catch (err) {
      showError('Error', getUserFriendlyMessage(err, 'Could not submit. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
  
  // Format date without time for leave requests (date-only inputs)
  const formatDateOnly = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium' }) : '-'

  const handleConfirmArrival = async (request) => {
    // Prevent duplicate clicks
    if (!request || !request._id) return
    if (confirmingArrivalId) return

    // If the request status is no longer waiting for confirmation, avoid calling API
    if (request.status !== 'waiting_for_arrival_confirmation') {
      showError('Cannot confirm', 'This request is no longer awaiting your arrival confirmation.')
      // Refresh list to reflect current server state
      fetchRequests(true)
      return
    }

    setConfirmingArrivalId(request._id)
    try {
      const data = await apiClient.patch(`/api/leaves?id=${request._id}&action=confirm-arrival`, {})

      if (data && data.success) {
        // Prefer arrival time returned from server so display is accurate
        const confirmedAt = data.request && data.request.arrivalConfirmedAt ? data.request.arrivalConfirmedAt : new Date()
        setArrivalTime(confirmedAt)
        showSuccess('Success', 'Your arrival has been confirmed and parent has been notified!')
        localStorage.removeItem('activeTimer') // Clear timer from localStorage
        sessionStorage.removeItem('activeTimer') // Clear timer from sessionStorage
        setRecordingRequest(null)
        setRecordingTime(0)
        setIsTimerModalOpen(false)
        fetchRequests(true)
      } else {
        showError('Failed', data.error || 'Could not confirm arrival')
        console.error('Confirm arrival error:', data)
      }
    } catch (error) {
      // Handle AbortError (timeout) separately for friendlier messaging
      if (error && (error.name === 'AbortError' || (error.message && error.message.toLowerCase().includes('aborted')))) {
        showError('Request timed out', 'The confirmation request took too long. Please try again.')
      } else if (error && error.status === 400 && error.data && error.data.error) {
        // Backend returned a 400 with a human-friendly message (e.g., status already changed)
        showError('Cannot confirm', error.data.error)
        fetchRequests(true)
      } else {
        showError('Error', getUserFriendlyMessage(error, 'Could not complete. Please try again.'))
      }
      console.error('Confirm arrival exception:', error)
    } finally {
      setConfirmingArrivalId(null)
    }
  }
            try { window.refreshNotificationCount && window.refreshNotificationCount() } catch (e) {}

  // Called when user confirms deletion
  const performDeleteLeave = async (request) => {
    try {

      const data = await apiClient.del(`/api/leaves?id=${request._id}&action=delete`, { body: {} })

      if (data && data.success) {
        showSuccess('Success', 'Leave request deleted successfully')
        fetchRequests(true)
      } else {
        showError('Failed', data.error || 'Could not delete request')
        console.error('Delete error:', data)
      }
    } catch (error) {
      showError('Error', getUserFriendlyMessage(error, 'Could not complete. Please try again.'))
      console.error('Delete exception:', error)
    }
  }

  const handleDeleteLeave = (request) => {
    setConfirmAction({
      title: 'Delete leave request?',
      message: 'This will permanently delete your leave request. This action cannot be undone. Continue?',
      onConfirm: () => performDeleteLeave(request)
    })
  }

  // Calculate form completion percentage
  const formCompletion = useMemo(() => {
    let completed = 0
    let total = 2 // reason + type
    
    if (reason.trim()) completed++
    
    if (type === 'leave') {
      total += 2 // dates
      if (startDate) completed++
      if (endDate) completed++
    } else {
      total += 1 // arrival time
      if (expectedArrivalTime) completed++
    }
    
    return Math.round((completed / total) * 100)
  }, [reason, type, startDate, endDate, expectedArrivalTime])

  return (
    <>
    <div className="px-3 sm:px-4 py-4 w-full max-w-5xl mx-auto">
      <style>{styles}</style>
      <ConfettiContainer />
      
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Leave / Late Request</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${formCompletion}%` }}
          />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Form Type Selector */}
          <div>
            <label className="block text-xs font-bold mb-2 text-gray-700">REQUEST TYPE</label>
            <div className="segmented-control relative p-1 rounded-xl bg-gray-50 border border-gray-200">
              <div 
                className="segmented-highlight"
                style={{ 
                  left: type==='leave' ? '0.25rem' : 'calc(50% + 0.25rem)',
                  width: 'calc(50% - 0.5rem)'
                }} 
              />
              <div className="grid grid-cols-2 gap-0">
                <button 
                  type="button" 
                  onClick={() => setType('leave')} 
                  className={`relative z-10 px-4 py-2 rounded-lg text-xs font-bold transition-all ${type==='leave' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Leave
                </button>
                <button 
                  type="button" 
                  onClick={() => setType('late')} 
                  className={`relative z-10 px-4 py-2 rounded-lg text-xs font-bold transition-all ${type==='late' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Late Arrival
                </button>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-700">REASON</label>
            <div className="relative">
              <textarea 
                value={reason} 
                onChange={e=>setReason(e.target.value)} 
                onBlur={() => setReasonTouched(true)}
                maxLength={200}
                rows={type === 'leave' ? 3 : 2}
                className={`w-full border rounded-lg px-3 py-2 pb-7 text-sm transition-all resize-none focus:outline-none ${reasonTouched && !reason.trim() ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100'} ${reasonCount > 160 ? 'pulse-glow' : ''}`}
                placeholder={type === 'leave' ? "Medical appointment, family emergency..." : "Traffic delay, vehicle breakdown..."} 
              />
              <div className="absolute right-3 bottom-2 text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500">{reasonCount}/200</div>
            </div>
            {reasonTouched && !reason.trim() && (
              <p className="text-xs text-red-600 mt-1 font-semibold">⚠ Reason required</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Leave-specific fields */}
          {type === 'leave' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-bold mb-1 text-gray-700">Start Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e=>setStartDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer" 
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold mb-1 text-gray-700">End Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e=>setEndDate(e.target.value)} 
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Duration Summary Card */}
              {startDate && endDate && (
                <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Total</p>
                      <p className="text-lg font-bold text-blue-600">{daysCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Weekends</p>
                      <p className="text-lg font-bold text-purple-600">
                        {(() => {
                          let weekends = 0
                          for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
                            if (d.getDay() === 0 || d.getDay() === 6) weekends++
                          }
                          return weekends
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Working</p>
                      <p className="text-lg font-bold text-green-600">
                        {(() => {
                          let weekends = 0
                          for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
                            if (d.getDay() === 0 || d.getDay() === 6) weekends++
                          }
                          return daysCount - weekends
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Status</p>
                      <p className={`text-xs font-bold ${daysCount >= 5 ? 'text-red-600' : daysCount >= 2 ? 'text-orange-600' : 'text-green-600'}`}>
                        {daysCount >= 5 ? 'Long' : daysCount >= 2 ? 'Moderate' : 'Short'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Date (Today)</label>
                  <input 
                    type="date" 
                    value={new Date().toISOString().split('T')[0]} 
                    disabled 
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 text-sm cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-700">Arrival Time</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={expectedArrivalTime} 
                      onChange={e=>setExpectedArrivalTime(e.target.value)} 
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer" 
                      required
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 bg-blue-50 px-2.5 py-1.5 rounded">Defaults to +30 minutes from now</p>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Attachment Upload (Only for Leave) */}
          {type === 'leave' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">ATTACHMENT (Optional)</label>
              
              {!attachmentName ? (
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 sm:p-6 text-center hover:bg-blue-50 transition-colors">
                    <div className="text-3xl mb-1">📸</div>
                    <p className="font-semibold text-gray-800 text-sm">Upload image</p>
                    <p className="text-xs text-gray-500">Max 800px width, JPEG</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">✅</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate text-xs">{attachmentName}</p>
                          <p className="text-xs text-gray-600">Attached</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setAttachment(null); setAttachmentName('') }} 
                        className="text-red-500 hover:text-red-700 font-bold text-lg flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    {attachment && (
                      <div className="rounded-lg overflow-hidden border border-blue-200 max-h-32">
                        <img src={attachment} alt="Preview" className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer inline-block">
                    <span className="text-xs font-semibold text-blue-600 hover:text-blue-800">Change image</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button 
              disabled={submitting} 
              style={{borderColor:'#C9A84C', color:'#C9A84C'}}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor='#C9A84C'; e.currentTarget.style.color='white' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.style.color='#C9A84C' }}
              className="w-full sm:flex-1 px-4 py-2.5 rounded-lg bg-transparent font-semibold text-sm border-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 active:scale-95"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button 
              type="button" 
              onClick={() => { setType('leave'); setReason(''); setReasonTouched(false); setStartDate(''); setEndDate(''); setExpectedArrivalTime(''); setAttachment(null); setAttachmentName('') }} 
              className="w-full sm:flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-white hover:text-red-600 font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:shadow-red-500/50 border-2 border-red-600 transform hover:scale-105 active:scale-95"
            >
              Clear Form
            </button>
          </div>
        </div>
      </form>

      {/* Summary Section */}
      <div className="bg-white rounded-xl shadow-sm mb-5 border border-gray-100 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-gray-100">
          <h2 className="font-bold text-sm">Request Summary</h2>
        </div>
        <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs text-gray-600 font-semibold">Student</p>
            <p className="font-bold text-gray-900 truncate text-sm">{auth.name}</p>
            <p className="text-xs text-gray-500">{auth.regNumber}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
            <p className="text-xs text-gray-600 font-semibold">Type</p>
            <p className="font-bold text-sm">{type === 'leave' ? 'Leave' : 'Late'}</p>
          </div>
          {type === 'leave' ? (
            <>
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-xs text-gray-600 font-semibold">Period</p>
                <p className="font-bold text-xs text-gray-900">{startDate ? new Date(startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}</p>
                <p className="text-xs text-gray-500">to {endDate ? new Date(endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 border border-green-100">
                <p className="text-xs text-gray-600 font-semibold">Days</p>
                <p className="font-bold text-lg text-green-600">{daysCount || '—'}</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-xs text-gray-600 font-semibold">Expected</p>
                <p className="font-bold text-xs text-gray-900">{expectedArrivalTime ? `${expectedArrivalTime}` : '—'}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 border border-green-100">
                <p className="text-xs text-gray-600 font-semibold">Status</p>
                <p className="font-bold text-xs text-green-700">Pending</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <h2 className="font-bold text-lg">My Requests</h2>
          {!loading && requests.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700">{requests.length}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-5 text-center">
            <div className="inline-block px-3 py-1.5 rounded text-xs text-gray-600 font-semibold bg-gray-100">Loading...</div>
          </div>
        ) : (
          <div className="divide-y">
            {(() => {
              const filteredRequests = requests.filter(r => r.type === type)
              
              if (filteredRequests.length === 0) {
                return (
                  <div className="p-6 text-center">
                    <p className="text-gray-600 font-semibold text-sm">{requests.length === 0 ? 'No requests yet' : `No ${type} requests`}</p>
                  </div>
                )
              }

              return filteredRequests.map((r) => {
                const deletableStatuses = ['requested', 'waiting_for_arrival_confirmation', 'rejected_by_hod']
                const canDelete = r.type === 'leave' && deletableStatuses.includes(r.status)
                
                // Status badge config
                const statusConfig = {
                  'requested': { bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pending', color: 'text-yellow-700' },
                  'waiting_for_arrival_confirmation': { bg: 'bg-blue-50', border: 'border-blue-200', label: 'En Route', color: 'text-blue-700' },
                  'approved_by_hod': { bg: 'bg-green-50', border: 'border-green-200', label: 'Approved', color: 'text-green-700' },
                  'rejected_by_hod': { bg: 'bg-red-50', border: 'border-red-200', label: 'Rejected', color: 'text-red-700' },
                  'confirmed': { bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Confirmed', color: 'text-emerald-700' }
                }
                const status = statusConfig[r.status] || { bg: 'bg-gray-50', border: 'border-gray-200', label: r.status, color: 'text-gray-700' }

                const swipeActions = r.type === 'leave' ? [
                  ...(canDelete ? [{
                    label: 'Delete',
                    icon: '🗑️',
                    onClick: () => handleDeleteLeave(r),
                    className: 'bg-red-600 hover:bg-red-700 text-white',
                    direction: 'right',
                    autoTrigger: true
                  }] : []),
                  ...(r.status === 'approved_by_hod' ? [{
                    label: 'Download',
                    icon: '📄',
                    onClick: () => {
                      const link = document.createElement('a')
                      link.href = `/api/generate-pdf?type=leave&leaveId=${r._id}`
                      link.download = `leave-approval-${r._id}.pdf`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    },
                    className: 'bg-blue-600 hover:bg-blue-700 text-white'
                  }] : [])
                ] : []

                const isRecording = recordingRequest?._id === r._id

                return (
                  <li key={r._id} className="hover:bg-gray-50 transition-colors p-0">
                    <SwipeableCard actions={swipeActions}>
                      <div className="px-4 sm:px-5 py-3 sm:py-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          {/* Left: Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color} border ${status.border} inline-flex items-center gap-1`}>
                                {status.label}
                              </span>
                              {r.type === 'leave' && r.status === 'approved_by_hod' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">Ready to Download</span>}
                              {r.type === 'leave' && (() => {
                                const leaveDays = Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24)) + 1
                                return leaveDays >= 5 && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Long Leave</span>
                              })()}
                              {r.type === 'late' && r.status === 'waiting_for_arrival_confirmation' && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 animate-pulse">Active</span>}
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-1">{r.reason}</p>
                            
                            {r.type === 'leave' ? (
                              <div className="text-xs text-gray-500 space-y-0.5">
                                <p>{formatDateOnly(r.startDate)} to {formatDateOnly(r.endDate)}</p>
                                {r.rejectionReason && <p className="text-red-600 font-semibold">Reason: {r.rejectionReason}</p>}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 space-y-0.5">
                                <p>Expected: {formatDate(r.expectedArrivalTime)}</p>
                                {r.arrivalConfirmedAt && <p className="text-green-600 font-semibold">Arrived: {formatDate(r.arrivalConfirmedAt)}</p>}
                              </div>
                            )}

                            {r.attachmentData && (
                              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200">
                                Attachment
                              </div>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col gap-1.5">
                            {r.type === 'leave' && r.status === 'approved_by_hod' && (
                              <a href={`/api/generate-pdf?type=leave&leaveId=${r._id}`} className="inline-flex items-center justify-center px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-95">
                                Download PDF
                              </a>
                            )}
                            {r.type === 'late' && r.status === 'waiting_for_arrival_confirmation' && (
                              <button
                                onClick={() => {
                                  if (!isRecording) {
                                    setRecordingRequest(r)
                                    setRecordingTime(0)
                                    setArrivalTime(null)
                                  }
                                  setIsTimerModalOpen(true)
                                }}
                                className="px-3 py-2 text-xs font-bold rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                              >
                                {isRecording ? 'View' : 'Start'} Timer
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile: Swipe hint */}
                        {r.type === 'leave' && canDelete && (
                          <div className="sm:hidden mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Swipe right to delete</p>
                          </div>
                        )}
                      </div>
                    </SwipeableCard>
                  </li>
                )
              })
            })()}
          </div>
        )}
      </div>

    {isTimerModalOpen && recordingRequest && recordingRequest.type === 'late' && recordingRequest.status === 'waiting_for_arrival_confirmation' && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/30 backdrop-blur-sm"
        onClick={() => setIsTimerModalOpen(false)}
      >
        <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-6 bg-white rounded-xl text-gray-900 shadow-2xl relative overflow-hidden border border-amber-100">
            {/* Station Clock Design */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-theme-gold-600 via-theme-gold-400 to-theme-gold-600"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-theme-gold-600 animate-pulse"></span>
                  Live Transit Status
                </div>
                <div className="font-semibold text-lg">On the way to College</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-widest">Expected</div>
                <div className="font-mono text-xl text-theme-gold">{formatDate(recordingRequest.expectedArrivalTime).split(', ')[1] || formatDate(recordingRequest.expectedArrivalTime)}</div>
              </div>
            </div>

            <div className="bg-theme-gold-50 rounded-lg p-4 mb-5 border border-amber-200 flex flex-col items-center justify-center min-h-[100px]">
              <p className="text-xs text-gray-600 uppercase tracking-widest mb-2 font-mono">Current Time (IST)</p>
              <div className="text-4xl sm:text-5xl font-bold font-mono tracking-wider text-emerald-600" style={{ textShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>
                {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
              </div>
            </div>

            <button
              onClick={() => handleConfirmArrival(recordingRequest)}
              disabled={confirmingArrivalId === recordingRequest._id}
              className={`w-full px-4 py-4 font-bold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] ${confirmingArrivalId === recordingRequest._id ? 'bg-emerald-200 text-emerald-800 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white transform hover:scale-[1.02]'}`}
            >
              ✅ I'VE REACHED
            </button>
            <div className="mt-3">
              <button
                onClick={() => { setRecordingRequest(null); setRecordingTime(0); setArrivalTime(null); setIsTimerModalOpen(false) }}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
              >
                Cancel Timer
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
    {confirmAction && (
      <ConfirmDialog
        open={true}
        title={confirmAction.title}
        description={confirmAction.message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => { confirmAction.onConfirm(); setConfirmAction(null); }}
        onCancel={() => setConfirmAction(null)}
      />
    )}
    </>
  )
}

export default Leave
 
