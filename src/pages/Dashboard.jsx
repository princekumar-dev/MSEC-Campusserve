import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { getAuthOrNull } from '../utils/auth'
import { ClipboardList, PlusCircle, AlertCircle, CheckCircle2, IndianRupee, Wrench, FileCheck, Search } from 'lucide-react'

function Dashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingAdmin: 0,
    activeWork: 0,
    pendingInvoicing: 0,
    pendingPayment: 0,
    closed: 0,
    totalExpenses: 0,
    totalQuotations: 0
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { showError } = useAlert()
  const auth = getAuthOrNull()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await apiClient.get('/api/reports')
        if (statsRes.success) {
          setStats(statsRes.stats)
        }

        const requestsRes = await apiClient.get('/api/requests')
        if (requestsRes.success) {
          setRecentRequests(requestsRes.data.slice(0, 5))
        }
      } catch (err) {
        showError('Fetch Error', 'Failed to retrieve dashboard summaries')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [showError])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/requests?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  const renderQuickActions = () => {
    switch (auth.role) {
      case 'requester':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/requests/new" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-violet-50 rounded-xl text-violet-600">
                <PlusCircle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">New Service Request</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Submit a new maintenance ticket</p>
              </div>
            </Link>
            <Link to="/requests" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-violet-55 rounded-xl text-violet-600">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Track Requests</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Monitor the status of your tickets</p>
              </div>
            </Link>
          </div>
        )
      case 'admin':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/requests?status=SUBMITTED" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Review Requests</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{stats.pendingAdmin} pending approval</p>
              </div>
            </Link>
            <Link to="/requests?status=QUOTATION_SUBMITTED" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-violet-50 rounded-xl text-violet-600">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Review Quotations</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Approve cost estimates</p>
              </div>
            </Link>
            <Link to="/requests?status=INVOICE_SUBMITTED" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Review Invoices</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Approve final billings</p>
              </div>
            </Link>
          </div>
        )
      case 'manager':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/requests?status=APPROVED" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-violet-50 rounded-xl text-violet-600">
                <Wrench size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Unassigned Tasks</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Assign technicians & build estimations</p>
              </div>
            </Link>
            <Link to="/requests" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Active Inspections</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Monitor assigned active requests</p>
              </div>
            </Link>
          </div>
        )
      case 'technician':
        return (
          <div className="grid grid-cols-1 gap-4">
            <Link to="/requests" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left max-w-md mx-auto w-full">
              <div className="p-3.5 bg-violet-50 rounded-xl text-violet-600">
                <Wrench size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">My Work Orders</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Accept jobs, log updates, & record materials</p>
              </div>
            </Link>
          </div>
        )
      case 'accounts':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/requests?status=PAYMENT_PENDING" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
                <IndianRupee size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Record Payments</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{stats.pendingPayment} invoices awaiting settlement</p>
              </div>
            </Link>
            <Link to="/reports" className="bg-white p-5 rounded-xl flex items-center space-x-4 border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-left">
              <div className="p-3.5 bg-violet-50 rounded-xl text-violet-600">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Financial Overview</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">View campus cost distribution statistics</p>
              </div>
            </Link>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Banner Section (Matches the MSEC Connect Screenshot layout) */}
      <div 
        className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-lg bg-cover bg-center"
        style={{ backgroundImage: "url('/images/campus.jpeg')" }}
      >
        {/* Dark Violet-Indigo overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/20 flex flex-col items-center justify-center px-6 text-center">
          
          <h1 className="font-display font-extrabold text-white text-3xl sm:text-4xl md:text-5xl leading-tight max-w-3xl drop-shadow-md">
            Find the Perfect Service for Your Needs
          </h1>
          
          <p className="text-slate-200 text-sm sm:text-base max-w-2xl mt-4 drop-shadow">
            Submit service requests, schedule inspections, authorize estimations, and track maintenance operations in real-time across Meenakshi Sundararajan Engineering College.
          </p>

          {/* Search bar inside the hero card */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-xl mt-8 relative">
            <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-xl border border-slate-200 focus-within:ring-2 focus-within:ring-violet-500 transition-all">
              <Search size={18} className="text-slate-400 ml-4 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search requests by number, asset, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-slate-800 placeholder-slate-500 text-sm px-3 py-1.5 w-full focus:outline-none"
              />
              <button 
                type="submit" 
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-6 rounded-full transition-all flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* SLA tracker / Service Log Pill below Hero Banner */}
      <div className="flex justify-center">
        <div className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1 text-[11px] font-bold text-violet-600">
          <span className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-pulse"></span>
          <span>Search-ready maintenance log catalog</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Requests</span>
            <ClipboardList size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{stats.totalRequests}</div>
          <span className="text-[9px] text-slate-500 mt-1 block">Logged all-time</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Work</span>
            <Wrench size={16} className="text-violet-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{stats.activeWork}</div>
          <span className="text-[9px] text-slate-500 mt-1 block">In progress</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Awaiting Payment</span>
            <IndianRupee size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{stats.pendingPayment}</div>
          <span className="text-[9px] text-slate-500 mt-1 block">Pending invoices</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Closed</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{stats.closed}</div>
          <span className="text-[9px] text-slate-500 mt-1 block">Completed & paid</span>
        </div>
      </div>

      {/* Operations Center Quick Actions */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Operations Center</h2>
        {renderQuickActions()}
      </div>

      {/* Active Service Requests Section Heading */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-extrabold text-slate-800">Featured Service Tickets</h2>
          <Link to="/requests" className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-all underline">
            View All Logs
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Req Number</th>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No requests found. Click 'New Service Request' above to create one.
                  </td>
                </tr>
              ) : (
                recentRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-55/30 transition-all">
                    <td className="py-4 font-mono text-xs text-violet-600 font-bold">{req.requestNumber}</td>
                    <td className="py-4 font-semibold text-slate-800">{req.title}</td>
                    <td className="py-4 text-slate-500 text-xs">{req.category}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        req.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        req.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        req.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-150 px-2.5 py-1 rounded">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
