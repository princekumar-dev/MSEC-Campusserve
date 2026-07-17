import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, ClipboardList, LogOut, Menu, PlusCircle, Search, X } from 'lucide-react'
import { getAuthOrNull } from '../utils/auth'
import Settings from './Settings'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleAuthChange = () => {
      const auth = getAuthOrNull()
      setUser(auth?.isAuthenticated ? auth : null)
    }
    handleAuthChange()
    window.addEventListener('authStateChanged', handleAuthChange)
    return () => window.removeEventListener('authStateChanged', handleAuthChange)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setShowDropdown(false)
    setIsSettingsOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    ;['auth', 'isLoggedIn', 'userEmail', 'userRole', 'userId'].forEach((key) => localStorage.removeItem(key))
    window.dispatchEvent(new Event('authStateChanged'))
    navigate('/login')
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (query) navigate(`/requests?search=${encodeURIComponent(query)}`)
  }

  const linkClass = (path) => {
    const active = location.pathname === path || (path === '/requests' && location.pathname.startsWith('/requests/') && location.pathname !== '/requests/new')
    return active
      ? 'text-sm font-bold leading-normal text-black'
      : 'text-sm font-medium leading-normal text-[#111418] transition-all duration-200 hover:font-bold hover:text-violet-700'
  }

  const navigation = user && (
    <>
      <Link className={linkClass('/dashboard')} to="/dashboard">Dashboard</Link>
      <Link className={linkClass('/requests')} to="/requests">Requests</Link>
      {user.role === 'requester' && <Link className={linkClass('/requests/new')} to="/requests/new">Submit Request</Link>}
      <Link className={linkClass('/reports')} to="/reports">Reports</Link>
    </>
  )

  return (
    <header
      className="glass-card campusserve-header sticky top-0 z-50 mx-2 mt-2 flex items-center justify-between whitespace-nowrap px-3 py-3 sm:mx-3 sm:mt-3 sm:px-4 sm:py-4 md:mx-4 md:mt-4 md:px-6 lg:px-8 xl:px-10"
      onMouseEnter={() => document.body.classList.add('header-hover-active')}
      onMouseLeave={() => document.body.classList.remove('header-hover-active')}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          <Link to={user ? '/dashboard' : '/'} className="flex flex-shrink-0 items-center gap-2 md:gap-3">
            <span className="size-9 sm:size-10 md:size-10">
              <img src="/images/mseclogo.png" alt="MSEC Logo" className="h-full w-full object-contain" />
            </span>
            <h2 className="whitespace-nowrap text-base font-bold leading-tight tracking-[-0.015em] sm:text-lg md:text-xl">
              <span className="text-[#111418]">MSEC</span> <span className="wave-text-violet">CampusServe</span>
            </h2>
          </Link>
          <nav className="hidden min-w-0 flex-shrink items-center gap-4 lg:flex xl:gap-5 2xl:gap-6">{navigation}</nav>
      </div>

      <div className={`${isAuthPage ? 'hidden' : 'hidden lg:flex'} flex-shrink-0 items-center gap-2 lg:gap-3 xl:gap-4`}>
          {user ? (
            <>
              <form onSubmit={handleSearchSubmit} className="relative !h-9 w-40 lg:!h-10 lg:w-48 xl:w-64">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#60758a] lg:h-5 lg:w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search requests, locations..."
                  className="form-input relative z-0 h-full w-full rounded-lg border border-white/10 bg-white/30 pl-9 pr-3 text-xs font-normal leading-normal text-[#111418] outline-none backdrop-blur-sm placeholder:text-[#60758a] focus:outline-0 focus:ring-0 lg:rounded-xl lg:pl-10 lg:text-sm"
                />
              </form>
              <div className="relative flex flex-shrink-0 items-center gap-1 lg:gap-2" ref={dropdownRef}>
                <button className="relative hidden h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[#f0f2f5] lg:flex lg:h-10 lg:w-10" aria-label="Notifications">
                  <Bell className="h-5 w-5 text-[#60758a] transition-colors hover:text-violet-600" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-violet-600" />
                </button>
                <button onClick={() => setIsSettingsOpen((value) => !value)} className="group flex h-9 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-[#f0f2f5] lg:h-10 lg:px-3" title="Settings">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-bold text-white lg:h-8 lg:w-8 lg:text-sm">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs font-medium text-[#111418] group-hover:text-violet-600 xl:inline lg:max-w-[150px]">{user.email}</span>
                  <ChevronDown className={`h-3 w-3 text-[#60758a] transition-transform lg:h-4 lg:w-4 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="flex h-9 min-w-[60px] items-center justify-center overflow-hidden rounded-lg bg-violet-600 px-3 text-xs font-bold leading-normal tracking-[0.015em] text-white transition-all duration-200 hover:bg-violet-700 lg:h-10 lg:min-w-[70px] lg:rounded-xl lg:px-4 lg:text-sm">Login</Link>
          )}
      </div>

      <div className={`${isAuthPage ? 'hidden' : 'flex'} items-center gap-1 lg:hidden`}>
        {user && <button className="relative flex flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-[#111418] transition-colors duration-200 hover:bg-violet-50 sm:p-2" aria-label="Notifications"><Bell className="h-5 w-5 sm:h-6 sm:w-6" /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-600" /></button>}
        <button onClick={() => user ? setIsSettingsOpen(true) : setIsMobileMenuOpen((value) => !value)} className="flex flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-[#111418] transition-colors duration-200 hover:bg-violet-50 sm:p-2" aria-label={user ? 'Open settings' : 'Toggle navigation menu'}>
          {isMobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
        </button>
      </div>

      {user && isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] mx-1 overflow-hidden rounded-2xl border border-violet-100 bg-white/95 p-4 shadow-2xl shadow-violet-950/10 backdrop-blur-xl lg:hidden">
          <form onSubmit={handleSearchSubmit} className="relative mb-3 lg:hidden">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search requests" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" />
          </form>
          <nav className="flex flex-col gap-1 [&>a]:rounded-xl [&>a]:px-3 [&>a]:py-2.5">{navigation}</nav>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 sm:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">{(user.name || user.email || 'U').charAt(0).toUpperCase()}</span>
              <span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-800">{user.email}</span><span className="block text-[10px] capitalize text-violet-600">{user.role}</span></span>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2.5 text-rose-600 hover:bg-rose-50" aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </div>
      )}

      {user && isSettingsOpen && (
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          userEmail={user.email}
          userRole={user.role}
          isMobile={typeof window !== 'undefined' && window.innerWidth < 1024}
        />
      )}
    </header>
  )
}

export default Header
