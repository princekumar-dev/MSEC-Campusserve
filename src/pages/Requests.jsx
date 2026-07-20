import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { getAuthOrNull } from '../utils/auth'
import { formatDistanceToNow } from 'date-fns'
import { Search, PlusCircle, ChevronRight, X, ChevronLeft, Filter, ClipboardList, ArrowRight } from 'lucide-react'
import { PageHeader } from '../components/ui'

const ALL_STATUSES = [
  'ALL', 'DRAFT', 'SUBMITTED', 'UNDER_ADMIN_REVIEW', 'CLARIFICATION_REQUIRED',
  'REJECTED', 'APPROVED', 'ASSIGNED_TO_MANAGER', 'UNDER_INSPECTION',
  'QUOTATION_IN_PROGRESS', 'QUOTATION_SUBMITTED', 'QUOTATION_APPROVED',
  'WORK_ORDER_CREATED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'PAUSED',
  'TECHNICIAN_COMPLETED', 'SERVICE_VERIFIED', 'PAYMENT_PENDING', 'CLOSED', 'CANCELLED'
]

const QUICK_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending Review', value: 'SUBMITTED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Quotation', value: 'QUOTATION_SUBMITTED' },
  { label: 'Payment', value: 'PAYMENT_PENDING' },
  { label: 'Closed', value: 'CLOSED' },
]

const ITEMS_PER_PAGE = 15

function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

function Requests() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'ALL')
  const [selectedPriority, setSelectedPriority] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const { showError } = useAlert()
  const auth = getAuthOrNull()
  const searchRef = useRef(null)

  const debouncedSearch = useCallback(
    debounce((val) => {
      setSearchQuery(val)
      setCurrentPage(1)
    }, 300),
    []
  )

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      try {
        const queryParams = {}
        if (selectedStatus !== 'ALL') queryParams.status = selectedStatus
        if (selectedPriority !== 'ALL') queryParams.priority = selectedPriority
        const res = await apiClient.get('/api/requests', { params: queryParams })
        if (res.success) {
          setRequests(res.data)
          const counts = {}
          res.data.forEach(r => {
            counts[r.status] = (counts[r.status] || 0) + 1
          })
          counts['ALL'] = res.data.length
          setStatusCounts(counts)
        } else {
          showError('Load Error', res.error || 'Failed to fetch requests')
        }
      } catch (err) {
        showError('Network Error', err.message || 'Server error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRequests()
  }, [selectedStatus, selectedPriority, showError])

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const q = searchQuery.toLowerCase()
      if (!q) return true
      return (
        req.title?.toLowerCase().includes(q) ||
        req.requestNumber?.toLowerCase().includes(q) ||
        req.requesterName?.toLowerCase().includes(q) ||
        req.location?.toLowerCase().includes(q) ||
        req.category?.toLowerCase().includes(q)
      )
    })
  }, [requests, searchQuery])

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => { setCurrentPage(1) }, [searchQuery, selectedStatus, selectedPriority])

  const handleStatusFilter = (status) => {
    setSelectedStatus(status)
    if (status === 'ALL') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', status)
    }
    setSearchParams(searchParams)
  }

  const getPriorityBorder = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return 'border-l-rose-500'
      case 'HIGH': return 'border-l-amber-500'
      case 'MEDIUM': return 'border-l-blue-500'
      default: return 'border-l-slate-300'
    }
  }

  return (
    <div className="space-y-6 page-enter">

      <PageHeader
        title="Requests"
        subtitle={`${filteredRequests.length} requests found`}
        action={auth?.role === 'requester' ? (
          <Link to="/requests/new" className="btn-premium">
            <PlusCircle size={15} />
            <span>Create Request</span>
          </Link>
        ) : null}
      />

      {/* Quick Filter Chips */}
      <div className="mobile-edge-scroll flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => handleStatusFilter(f.value)}
            className={`filter-chip flex-shrink-0 ${selectedStatus === f.value ? 'active' : ''}`}
          >
            {f.label}
            {statusCounts[f.value] !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                selectedStatus === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {statusCounts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Advanced Filters */}
      <div className="premium-card">
        <div className="flex min-w-0 items-center gap-2 p-3 sm:gap-3 sm:p-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by number, title, location, requester..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                debouncedSearch(e.target.value)
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-9 text-slate-800 placeholder-slate-400 text-xs focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSearchQuery('')
                  searchRef.current?.focus()
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
              showFilters || selectedPriority !== 'ALL'
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filters</span>
            {selectedPriority !== 'ALL' && (
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</span>
              <div className="flex gap-1.5">
                {['ALL', 'EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                  <button
                    key={p}
                    onClick={() => { setSelectedPriority(p); setCurrentPage(1) }}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      selectedPriority === p
                        ? p === 'EMERGENCY' ? 'bg-rose-500 text-white' :
                          p === 'HIGH' ? 'bg-amber-500 text-white' :
                          p === 'MEDIUM' ? 'bg-blue-500 text-white' :
                          p === 'LOW' ? 'bg-slate-500 text-white' :
                          'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {p === 'ALL' ? 'All' : p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="premium-card overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-6 sm:py-16">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 sm:h-16 sm:w-16">
              <ClipboardList size={28} className="text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-600 mb-1">
              {searchQuery ? 'No matching requests' : 'No requests yet'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? `No requests match "${searchQuery}". Try adjusting your search or filters.`
                : 'Create your first service request to get started.'
              }
            </p>
            {auth?.role === 'requester' && !searchQuery && (
              <Link to="/requests/new" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all">
                <PlusCircle size={14} /> Create Request
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 sm:hidden">
              {paginatedRequests.map((req) => (
                <Link
                  key={req._id}
                  to={`/requests/${req._id}`}
                  className={`block min-w-0 rounded-xl border border-slate-100 border-l-4 bg-white p-4 shadow-sm ${getPriorityBorder(req.priority)}`}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-bold text-violet-600">{req.requestNumber}</p>
                      <h3 className="mt-1 break-words text-sm font-bold leading-snug text-slate-800">{req.title}</h3>
                    </div>
                    <ChevronRight size={18} className="mt-1 flex-shrink-0 text-slate-400" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      req.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700' :
                      req.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                      req.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{req.priority}</span>
                    <span className={`status-badge status-${req.status.toLowerCase()}`}>
                      {req.status.replace(/_/g, ' ')}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {req.updatedAt ? formatDistanceToNow(new Date(req.updatedAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="requests-table-scroll hidden overflow-x-auto sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6">Number</th>
                    <th className="py-3 px-2">Subject</th>
                    <th className="py-3 px-2 hidden lg:table-cell">Location</th>
                    <th className="py-3 px-2 hidden sm:table-cell">Requester</th>
                    <th className="py-3 px-2">Priority</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 hidden md:table-cell">Updated</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedRequests.map((req) => (
                    <tr key={req._id} className={`table-row-hover border-l-3 ${getPriorityBorder(req.priority)}`}>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-violet-600 font-bold">{req.requestNumber}</span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="font-semibold text-slate-800 text-xs">{req.title}</div>
                        <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded mt-1 inline-block capitalize border border-slate-100">{req.category}</span>
                      </td>
                      <td className="py-4 px-2 hidden lg:table-cell text-slate-500 text-xs">{req.location}</td>
                      <td className="py-4 px-2 hidden sm:table-cell">
                        <div className="text-xs font-semibold text-slate-700">{req.requesterName}</div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          req.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700' :
                          req.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                          req.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`status-badge status-${req.status.toLowerCase()}`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-2 hidden md:table-cell text-xs text-slate-400">
                        {req.updatedAt ? formatDistanceToNow(new Date(req.updatedAt), { addSuffix: true }) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/requests/${req._id}`}
                          className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-all group"
                        >
                          View <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span className="text-xs text-slate-400 font-semibold">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)} of {filteredRequests.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page
                    if (totalPages <= 5) page = i + 1
                    else if (currentPage <= 3) page = i + 1
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                    else page = currentPage - 2 + i
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Requests
