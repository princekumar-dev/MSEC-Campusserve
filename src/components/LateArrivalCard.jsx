import { useState, useEffect, memo, useMemo } from 'react'
import { Clock, AlertCircle, CheckCircle2, MapPin, User, Phone, AlertTriangle } from 'lucide-react'
import SwipeableCard from './SwipeableCard'
import { getNotificationConfig } from '../utils/notificationTypes'

/**
 * Enhanced Late Arrival Card Component with Advanced Features
 * - Real-time countdown timer
 * - Overdue detection with visual warnings
 * - Confirmation workflow with modal
 * - Student context information
 * - Status indicators and progress
 * - Mobile swipe gestures
 */
export const LateArrivalCard = memo(({ 
  request, 
  onApprove, 
  processing,
  onMarkRead
}) => {
  const config = getNotificationConfig(request.type)
  const [timeLeft, setTimeLeft] = useState('')
  const [timeInSeconds, setTimeInSeconds] = useState(0)
  const [isOverdue, setIsOverdue] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [recordedTime, setRecordedTime] = useState(null)
  const [delayMinutes, setDelayMinutes] = useState(0)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const arrival = new Date(request.data?.expectedArrivalTime)
      const diff = arrival - now

      if (diff <= 0) {
        setIsOverdue(true)
        const absDiff = Math.abs(diff)
        const mins = Math.floor(absDiff / 60000)
        setDelayMinutes(mins)
        setTimeLeft('Overdue by ' + mins + 'm')
        setTimeInSeconds(0)
      } else {
        setIsOverdue(false)
        setDelayMinutes(0)
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setTimeInSeconds(diff / 1000)
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [request.data?.expectedArrivalTime])

  const handleConfirm = () => {
    setRecordedTime(new Date())
    onApprove(request)
    setTimeout(() => setShowConfirm(false), 500)
  }

  // Swipe action
  const swipeActions = useMemo(() => [
    {
      label: 'Record',
      icon: <CheckCircle2 className="w-5 h-5" />,
      onClick: handleConfirm,
      className: 'bg-green-600 hover:bg-green-700 text-white',
      direction: 'right',
      autoTrigger: false
    }
  ], [request])

  // Calculate progress percentage (0-100)
  const maxTime = 30 * 60 // 30 minutes assumed max
  const progressPercent = Math.min(100, Math.max(0, (timeInSeconds / maxTime) * 100))

  const requestContent = (
    <div className={`border-2 rounded-xl overflow-hidden transition-all ${config.bgColor} ${config.borderColor}`}>
      {/* Status Bar Animation */}
      <div className={`h-1 transition-all duration-500 ${
        isOverdue 
          ? 'bg-gradient-to-r from-red-500 to-red-600' 
          : 'bg-gradient-to-r from-amber-400 to-orange-500'
      }`}></div>

      <div className="p-4 sm:p-5">
        {/* Header with Avatar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Animated Avatar */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg transition-transform ${
              isOverdue 
                ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse' 
                : 'bg-gradient-to-br from-orange-400 to-orange-600'
            }`}>
              {request.data?.studentName?.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-gray-900 break-words">
                {request.data?.studentName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3" />
                {request.data?.regNumber}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap ${
              isOverdue
                ? 'bg-red-100 text-red-700 animate-pulse'
                : 'bg-amber-100 text-amber-700'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {isOverdue ? 'OVERDUE' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Student Context Info */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="bg-white/40 rounded-lg p-2 backdrop-blur">
            <p className="text-gray-600 font-semibold">Year</p>
            <p className="font-bold text-gray-900">{request.data?.year}</p>
          </div>
          <div className="bg-white/40 rounded-lg p-2 backdrop-blur">
            <p className="text-gray-600 font-semibold">Section</p>
            <p className="font-bold text-gray-900">{request.data?.section}</p>
          </div>
          <div className="bg-white/40 rounded-lg p-2 backdrop-blur">
            <p className="text-gray-600 font-semibold">Dept</p>
            <p className="font-bold text-gray-900">{request.data?.department?.substring(0, 3)}</p>
          </div>
        </div>

        {/* Countdown Timer - Prominent */}
        <div className={`mb-4 p-3 rounded-lg border-2 transition-all ${
          isOverdue
            ? 'bg-red-50 border-red-300'
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">Expected Arrival</span>
            <span className={`font-mono font-bold text-lg flex items-center gap-1.5 ${
              isOverdue ? 'text-red-600' : 'text-amber-600'
            }`}>
              <Clock className="w-5 h-5" />
              {timeLeft}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 rounded-full ${
                isOverdue 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              style={{ width: `${Math.max(5, 100 - progressPercent)}%` }}
            ></div>
          </div>
          
          {/* Time Details */}
          <p className="text-xs text-gray-600 mt-2 font-mono">
            {new Date(request.data?.expectedArrivalTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>

        {/* Reason - Highlighted */}
        <div className="mb-4 bg-white/50 backdrop-blur rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 font-bold mb-1.5">Reason for Late Arrival</p>
          <p className="text-sm text-gray-900 italic leading-relaxed">
            "{request.data?.reason}"
          </p>
        </div>

        {/* Alert if Overdue */}
        {isOverdue && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-red-700">Student is {delayMinutes} minutes late</p>
              <p className="text-red-600 text-xs mt-0.5">Please confirm their arrival status immediately</p>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg animate-in">
            <div className="flex items-start gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900">Confirm Arrival Recording</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Record {request.data?.studentName}'s arrival at {new Date().toLocaleTimeString()}?
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing === request._id}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {processing === request._id ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>✓ Yes, Confirm</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {recordedTime && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-3 animate-in">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-700">Arrival Recorded!</p>
              <p className="text-xs text-green-600">at {recordedTime.toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* Main Action Button */}
        {!showConfirm && !recordedTime && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={processing === request._id}
            className={`w-full px-4 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
              isOverdue
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
            } disabled:opacity-50`}
          >
            {processing === request._id ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recording...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {isOverdue ? 'Record Arrival (Overdue)' : 'I\'ve Arrived - Record Now'}
              </>
            )}
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          Reported: {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Just now'}
        </p>
      </div>
    </div>
  )

  return (
    <SwipeableCard actions={swipeActions}>
      {requestContent}
    </SwipeableCard>
  )
})

LateArrivalCard.displayName = 'LateArrivalCard'

export default LateArrivalCard
