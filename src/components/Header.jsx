import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Bell, LogOut, Search, ChevronDown, ClipboardList } from 'lucide-react'
import { getAuthOrNull } from '../utils/auth'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleAuthChange = () => {
      const auth = getAuthOrNull()
      setUser(auth && auth.isAuthenticated ? auth : null)
    }

    handleAuthChange()
    window.addEventListener('authStateChanged', handleAuthChange)
    return () => window.removeEventListener('authStateChanged', handleAuthChange)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      window.dispatchEvent(new Event('authStateChanged'))
      navigate('/login')
    } catch (e) {}
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/requests?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (isAuthPage) {
    return (
      <header className="w-full py-6 flex justify-center items-center z-10 bg-transparent">
        <div className="flex items-center space-x-3 bg-slate-900/60 px-6 py-3 rounded-2xl backdrop-blur-md border border-violet-900/20">
          <img src="/images/mseclogo.png" alt="MSEC Logo" className="h-10 w-10 object-contain" />
          <span className="font-display font-black text-2xl tracking-wider text-white">
            MSEC <span className="text-violet-400">CampusServe</span>
          </span>
        </div>
      </header>
    )
  }

  return (
    <div className="px-4 pt-4 w-full max-w-7xl mx-auto z-50">
      <header className="bg-white border border-slate-200/50 rounded-2xl sm:rounded-3xl shadow-sm px-6 py-3 flex items-center justify-between">
        
        {/* Left Brand Area */}
        <Link to="/dashboard" className="flex items-center space-x-3 flex-shrink-0">
          <img src="/images/mseclogo.png" alt="MSEC Logo" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-800">
            MSEC <span className="text-violet-600 font-black">CampusServe</span>
          </span>
        </Link>

        {/* Middle Navigation Area */}
        {user && (
          <nav className="hidden lg:flex items-center space-x-6 mx-4">
            <Link 
              to="/dashboard" 
              className={`text-xs font-bold uppercase tracking-wider transition-all ${
                location.pathname === '/dashboard' 
                  ? 'text-slate-850 font-black border-b-2 border-violet-600 pb-1' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              Dashboard
            </Link>

            <Link 
              to="/requests" 
              className={`text-xs font-bold uppercase tracking-wider transition-all ${
                location.pathname === '/requests' && !location.pathname.endsWith('/new')
                  ? 'text-slate-850 font-black border-b-2 border-violet-600 pb-1' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              Requests
            </Link>

            {user.role === 'requester' && (
              <Link 
                to="/requests/new" 
                className={`text-xs font-bold uppercase tracking-wider transition-all ${
                  location.pathname === '/requests/new'
                    ? 'text-slate-850 font-black border-b-2 border-violet-600 pb-1' 
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Submit Request
              </Link>
            )}

            <Link 
              to="/reports" 
              className={`text-xs font-bold uppercase tracking-wider transition-all ${
                location.pathname === '/reports' 
                  ? 'text-slate-850 font-black border-b-2 border-violet-600 pb-1' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              Reports
            </Link>
          </nav>
        )}

        {/* Right Controls Area */}
        {user ? (
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            {/* Header Search Input */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <Search size={14} className="absolute left-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200/60 rounded-full py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 w-48 focus:w-60 focus:bg-white focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all font-medium"
              />
            </form>

            {/* Notification Bell */}
            <button className="p-2 text-slate-500 hover:text-violet-600 rounded-full hover:bg-slate-50 transition-all relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-violet-600 rounded-full"></span>
            </button>

            {/* User Profile Dropdown Button */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200/50"
              >
                <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black text-xs">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-700 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.email}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 text-left">
                    <div className="text-xs font-bold text-slate-800">{user.name}</div>
                    <div className="text-[10px] text-slate-450 uppercase mt-0.5">{user.role}</div>
                  </div>
                  
                  {user.role === 'requester' && (
                    <Link
                      to="/requests/new"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-xs font-semibold text-slate-750 hover:bg-violet-50 hover:text-violet-750 text-left transition-all"
                    >
                      <PlusCircle size={14} />
                      <span>Submit Request</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      handleLogout()
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left transition-all"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          <Link to="/login" className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2 px-5 rounded-full transition-all">
            Login
          </Link>
        )}

      </header>
    </div>
  )
}

export default Header