import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, PlusCircle, BarChart3 } from 'lucide-react'
import { getAuthOrNull } from '../utils/auth'

function BottomNav() {
  const location = useLocation()
  const auth = getAuthOrNull()
  
  if (!auth || !auth.isAuthenticated) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-blue-950/40 px-6 py-2 flex items-center justify-around">
      <Link 
        to="/dashboard" 
        className={`flex flex-col items-center space-y-0.5 ${
          location.pathname === '/dashboard' ? 'text-violet-400 font-semibold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard size={20} />
        <span className="text-[10px]">Dashboard</span>
      </Link>

      <Link 
        to="/requests" 
        className={`flex flex-col items-center space-y-0.5 ${
          location.pathname === '/requests' && !location.pathname.endsWith('/new') ? 'text-violet-400 font-semibold' : 'text-slate-500'
        }`}
      >
        <ClipboardList size={20} />
        <span className="text-[10px]">Requests</span>
      </Link>

      {auth.role === 'requester' && (
        <Link 
          to="/requests/new" 
          className={`flex flex-col items-center space-y-0.5 ${
            location.pathname === '/requests/new' ? 'text-violet-400 font-semibold' : 'text-slate-500'
          }`}
        >
          <PlusCircle size={20} />
          <span className="text-[10px]">Create</span>
        </Link>
      )}

      <Link 
        to="/reports" 
        className={`flex flex-col items-center space-y-0.5 ${
          location.pathname === '/reports' ? 'text-violet-400 font-semibold' : 'text-slate-500'
        }`}
      >
        <BarChart3 size={20} />
        <span className="text-[10px]">Reports</span>
      </Link>
    </div>
  )
}

export default BottomNav
