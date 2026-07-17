import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { getAuthOrNull } from '../utils/auth'
import { Search, PlusCircle, SlidersHorizontal } from 'lucide-react'

const statuses = [
  'ALL', 'DRAFT', 'SUBMITTED', 'ASSIGNED_TO_MANAGER', 'QUOTATION_IN_PROGRESS', 
  'QUOTATION_SUBMITTED', 'QUOTATION_APPROVED', 'WORK_ORDER_CREATED', 
  'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'TECHNICIAN_COMPLETED', 
  'SERVICE_VERIFIED', 'PAYMENT_PENDING', 'CLOSED', 'CANCELLED'
]

function Requests() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'ALL')
  const [selectedPriority, setSelectedPriority] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const { showError } = useAlert()
  const auth = getAuthOrNull()

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
        } else {
          showError('Load Error', res.error || 'Failed to fetch request logs')
        }
      } catch (err) {
        showError('Network Error', err.message || 'Server error loading logs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequests()
  }, [selectedStatus, selectedPriority, showError])

  // Client side search filter
  const filteredRequests = requests.filter(req => {
    const titleMatch = req.title.toLowerCase().includes(searchQuery.toLowerCase())
    const numMatch = req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const requesterMatch = req.requesterName.toLowerCase().includes(searchQuery.toLowerCase())
    const locationMatch = req.location.toLowerCase().includes(searchQuery.toLowerCase())
    return titleMatch || numMatch || requesterMatch || locationMatch
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-display font-black text-2xl tracking-tight text-slate-800">Requests Log</h1>
          <p className="text-xs text-slate-500 mt-1">Manage and track service request workflows across the campus</p>
        </div>

        {auth.role === 'requester' && (
          <Link to="/requests/new" className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg flex items-center justify-center space-x-2 self-start transition-all shadow-sm shadow-violet-600/10">
            <PlusCircle size={15} />
            <span>Create Request</span>
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        
        {/* Search */}
        <div className="relative lg:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by request number, title, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-4 text-slate-800 placeholder-slate-400 text-xs focus:bg-white focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
          />
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2">
          <SlidersHorizontal size={14} className="text-violet-600 hidden sm:block" />
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setSearchParams({ status: e.target.value })
            }}
            className="w-full bg-slate-100 border-none rounded-lg py-2 px-3 text-slate-700 text-xs focus:bg-white focus:ring-1 focus:ring-violet-500 focus:outline-none"
          >
            {statuses.map(st => (
              <option key={st} value={st} className="bg-white text-slate-700">
                {st === 'ALL' ? 'All Statuses' : st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-lg py-2 px-3 text-slate-700 text-xs focus:bg-white focus:ring-1 focus:ring-violet-500 focus:outline-none"
          >
            <option value="ALL" className="bg-white text-slate-700">All Priorities</option>
            <option value="LOW" className="bg-white text-slate-700">LOW</option>
            <option value="MEDIUM" className="bg-white text-slate-700">MEDIUM</option>
            <option value="HIGH" className="bg-white text-slate-700">HIGH</option>
            <option value="EMERGENCY" className="bg-white text-slate-700">EMERGENCY</option>
          </select>
        </div>

      </div>

      {/* Requests Logs Table */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No requests matched your filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Req Number</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Requester</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-55/30 transition-all">
                    <td className="py-4 font-mono text-xs text-violet-600 font-bold">{req.requestNumber}</td>
                    <td className="py-4 font-semibold text-slate-800">
                      <div>{req.title}</div>
                      <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block capitalize">{req.category}</span>
                    </td>
                    <td className="py-4 text-slate-500 text-xs">{req.location}</td>
                    <td className="py-4 text-slate-500 text-xs">
                      <div className="font-semibold text-slate-700">{req.requesterName}</div>
                      <div className="text-[10px] text-slate-400">{req.requesterEmail}</div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        req.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        req.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        req.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-bold text-violet-750 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link 
                        to={`/requests/${req._id}`} 
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-1.5 px-4 rounded-lg shadow-sm transition-all"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default Requests
