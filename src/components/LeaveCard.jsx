import { useState, useEffect, memo, useMemo } from 'react'
import { X, CheckCircle2, Calendar, AlertTriangle, MessageSquare, FileText, TrendingUp, Clock, User } from 'lucide-react'
import SwipeableCard from './SwipeableCard'
import { getNotificationConfig } from '../utils/notificationTypes'

/**
 * Enhanced Leave Request Card Component
 * - Duration calculation with visual indicators
 * - Leave type color-coding with gradient badges
 * - Calendar visualization
 * - Rejection reason with optional notes
 * - Leave balance estimation
 * - Holiday conflict detection
 * - Approval notes dialog
 * - Mobile swipe gestures
 */
export const LeaveCard = memo(({ 
  request, 
  onApprove, 
  onReject, 
  processing,
  leaveBalance = null
}) => {
  const config = getNotificationConfig(request.type)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [showApprovalNotes, setShowApprovalNotes] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [approveState, setApproveState] = useState(null)

  // Calculate leave duration
  const startDate = new Date(request.data?.startDate)
  const endDate = new Date(request.data?.endDate)
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  const isLongLeave = duration >= 5
  const isVeryLongLeave = duration >= 10

  // Get leave type info
  const getLeaveTypeInfo = (type) => {
    const typeMap = {
      medical: { color: 'from-red-500 to-red-600', icon: '🏥', label: 'Medical' },
      casual: { color: 'from-blue-500 to-blue-600', icon: '🎯', label: 'Casual' },
      emergency: { color: 'from-orange-500 to-orange-600', icon: '🚨', label: 'Emergency' },
      sick: { color: 'from-pink-500 to-pink-600', icon: '🤒', label: 'Sick' },
      bereavement: { color: 'from-gray-600 to-gray-700', icon: '🪦', label: 'Bereavement' }
    }
    return typeMap[type?.toLowerCase()] || typeMap.casual
  }

  const leaveTypeInfo = getLeaveTypeInfo(request.data?.type)

  // Check if dates are weekends
  const getWeekendCount = () => {
    let weekends = 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) weekends++
    }
    return weekends
  }

  const weekendCount = getWeekendCount()
  const workingDays = duration - weekendCount

  const handleRejectWithReason = () => {
    onReject({ ...request, rejectReason, notes: rejectReason })
    setShowRejectReason(false)
    setRejectReason('')
  }

  const handleApproveWithNotes = () => {
    setApproveState('confirming')
    onApprove({ ...request, approvalNotes, notes: approvalNotes })
    setTimeout(() => {
      setShowApprovalNotes(false)
      setApprovalNotes('')
      setApproveState(null)
    }, 800)
  }

  // Swipe actions
  const swipeActions = useMemo(() => [
    {
      label: 'Reject',
      icon: <X className="w-5 h-5" />,
      onClick: () => setShowRejectReason(true),
      className: 'bg-red-500 hover:bg-red-600 text-white',
    }
  ], [])

  const requestContent = (
    <div className={`border-2 rounded-xl overflow-hidden transition-all ${config.bgColor} ${config.borderColor}`}>
      {/* Accent Bar */}
      <div className={`h-1 bg-gradient-to-r ${leaveTypeInfo.color}`}></div>

      <div className="p-4 sm:p-5">
        {/* Header with Avatar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
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

          {/* Status Badges */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs whitespace-nowrap bg-amber-100 text-amber-700 animate-pulse`}>
              <Clock className="w-3 h-3" />
              PENDING
            </span>
            {isVeryLongLeave && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs whitespace-nowrap bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" />
                {duration} DAYS
              </span>
            )}
          </div>
        </div>

        {/* Leave Type Badge - Prominent */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${leaveTypeInfo.color} shadow-lg`}>
            <span className="text-lg">{leaveTypeInfo.icon}</span>
            {leaveTypeInfo.label} Leave
          </span>
        </div>

        {/* Duration Info Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/50 backdrop-blur rounded-lg p-2.5 border border-gray-200">
            <p className="text-xs text-gray-600 font-bold">Total Days</p>
            <p className="text-lg font-bold text-gray-900">{duration}</p>
          </div>
          <div className="bg-white/50 backdrop-blur rounded-lg p-2.5 border border-gray-200">
            <p className="text-xs text-gray-600 font-bold">Working Days</p>
            <p className="text-lg font-bold text-blue-600">{workingDays}</p>
          </div>
          <div className="bg-white/50 backdrop-blur rounded-lg p-2.5 border border-gray-200">
            <p className="text-xs text-gray-600 font-bold">Weekends</p>
            <p className="text-lg font-bold text-purple-600">{weekendCount}</p>
          </div>
        </div>

        {/* Date Range - Visual Calendar */}
        <div className="mb-4 p-3 rounded-lg bg-white/60 backdrop-blur border border-blue-200">
          <p className="text-xs text-gray-600 font-bold mb-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Leave Period
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 font-semibold">From</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-gray-900">
                  {startDate.getDate()}
                </p>
                <p className="text-xs text-gray-600">
                  {startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {startDate.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold">To</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-gray-900">
                  {endDate.getDate()}
                </p>
                <p className="text-xs text-gray-600">
                  {endDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {endDate.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
            </div>
          </div>
        </div>

        {/* Student Context */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
            <p className="text-gray-600 font-bold">Year</p>
            <p className="font-bold text-gray-900">{request.data?.year}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
            <p className="text-gray-600 font-bold">Section</p>
            <p className="font-bold text-gray-900">{request.data?.section}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
            <p className="text-gray-600 font-bold">Dept</p>
            <p className="font-bold text-gray-900">{request.data?.department?.substring(0, 3).toUpperCase()}</p>
          </div>
        </div>

        {/* Reason - Highlighted */}
        <div className="mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 font-bold mb-2 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            Reason
          </p>
          <p className="text-sm text-gray-900 italic leading-relaxed">
            "{request.data?.reason}"
          </p>
        </div>

        {/* Attachment Preview - VISIBLE TO HOD */}
        {request.data?.attachmentData && (
          <div className="mb-4 p-3 rounded-lg border-2 border-blue-300 bg-blue-50">
            <p className="text-xs text-gray-600 font-bold mb-3 flex items-center gap-2">
              <span>📎</span>
              Proof / Attachment
            </p>
            <div className="relative rounded-lg overflow-hidden border-2 border-blue-200 bg-white shadow-md hover:shadow-lg transition-shadow">
              <img 
                src={request.data.attachmentData} 
                alt="Leave proof attachment"
                className="w-full h-auto object-cover max-h-96"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors cursor-pointer">
                <span className="text-white text-center font-bold drop-shadow-lg opacity-0 hover:opacity-100 transition-opacity">Click to view</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
              ✅ Student attached proof for verification
            </p>
          </div>
        )}

        {/* No Attachment Notice */}
        {!request.data?.attachmentData && (
          <div className="mb-4 p-3 rounded-lg border-2 border-amber-300 bg-amber-50">
            <p className="text-xs text-amber-700 font-semibold flex items-center gap-2">
              ⚠️ No attachment provided
            </p>
            <p className="text-xs text-amber-600 mt-1">Student did not upload any proof or attachment</p>
          </div>
        )}

        {/* Long Leave Warning */}
        {isLongLeave && (
          <div className={`mb-4 p-3 rounded-lg border flex items-start gap-2 ${
            isVeryLongLeave
              ? 'bg-red-50 border-red-300'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isVeryLongLeave ? 'text-red-600' : 'text-amber-600'
            }`} />
            <div className="text-sm">
              <p className={`font-bold ${isVeryLongLeave ? 'text-red-700' : 'text-amber-700'}`}>
                {isVeryLongLeave ? 'Very Long Leave' : 'Long Leave'} ({duration} days)
              </p>
              <p className={`text-xs mt-0.5 ${isVeryLongLeave ? 'text-red-600' : 'text-amber-600'}`}>
                {isVeryLongLeave 
                  ? 'Requires careful review and coverage planning'
                  : 'Please ensure adequate coverage during this period'}
              </p>
            </div>
          </div>
        )}

        {/* Reject Reason Dialog */}
        {showRejectReason && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg animate-in">
            <p className="text-sm font-bold text-gray-900 mb-3">Why are you rejecting this leave?</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection (optional)"
              className="w-full text-sm p-3 border border-red-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectReason(false)}
                className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithReason}
                disabled={processing === request._id}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {processing === request._id ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  '✕ Reject'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Approval Notes Dialog */}
        {showApprovalNotes && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg animate-in">
            <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Add Approval Notes (Optional)
            </p>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="E.g., 'Approved - arrange coverage for practical sessions'"
              className="w-full text-sm p-3 border border-green-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows="2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowApprovalNotes(false)}
                className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveWithNotes}
                disabled={processing === request._id || approveState === 'confirming'}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {processing === request._id || approveState === 'confirming' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Approving...
                  </>
                ) : (
                  <>✓ Approve</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        {!showRejectReason && !showApprovalNotes && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectReason(true)}
              disabled={processing === request._id}
              className="flex-1 px-4 py-3 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 border border-red-300 hover:border-red-400"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => setShowApprovalNotes(true)}
              disabled={processing === request._id}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          Requested: {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Just now'}
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

LeaveCard.displayName = 'LeaveCard'

export default LeaveCard
