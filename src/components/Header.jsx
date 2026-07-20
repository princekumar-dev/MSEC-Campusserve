import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, ClipboardList, LogOut, Menu, PlusCircle, X, ShoppingCart, Building2, Truck, QrCode, ClipboardCheck } from 'lucide-react'
import { getAuthOrNull } from '../utils/auth'
import Settings from './Settings'
import apiClient from '../utils/apiClient'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
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

  // Fetch notification count
  useEffect(() => {
    if (!user || !user.token) return
    const fetchCount = () => {
      apiClient.get('/api/notifications?action=count').then(res => {
        if (res.success) setNotifCount(res.unreadCount || 0)
      }).catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [user])

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

  const linkClass = (path) => {
    const active = location.pathname === path || (path === '/requests' && location.pathname.startsWith('/requests/') && location.pathname !== '/requests/new')
    return active ? 'nav-link-premium active' : 'nav-link-premium'
  }

  const navigation = user && (
    <>
      {/* Dashboard - all roles */}
      <Link className={linkClass('/dashboard')} to="/dashboard">Dashboard</Link>
      
      {/* Requester / HOD / Staff */}
      {['requester', 'hod', 'staff'].includes(user.role) && (
        <>
          <Link className={linkClass('/requests')} to="/requests">My Requests</Link>
          <Link className={linkClass('/requests/new')} to="/requests/new">Submit Request</Link>
        </>
      )}

      {/* Admin - limited to approval/monitoring */}
      {user.role === 'admin' && (
        <>
          <Link className={linkClass('/requests')} to="/requests">Requests</Link>
          <Link className={linkClass('/vendors')} to="/vendors">Vendors</Link>
          <Link className={linkClass('/purchase-orders')} to="/purchase-orders">POs</Link>
          <Link className={linkClass('/deliveries')} to="/deliveries">Deliveries</Link>
          <Link className={linkClass('/grn')} to="/grn">GRN</Link>
          <Link className={linkClass('/reports')} to="/reports">Reports</Link>
          <Link className={linkClass('/admin/users')} to="/admin/users">Users</Link>
          <Link className={linkClass('/admin/audit')} to="/admin/audit">Audit</Link>
        </>
      )}

      {/* Super Admin - full access */}
      {user.role === 'super_admin' && (
        <>
          <Link className={linkClass('/requests')} to="/requests">Requests</Link>
          <Link className={linkClass('/vendors')} to="/vendors">Vendors</Link>
          <Link className={linkClass('/purchase-orders')} to="/purchase-orders">POs</Link>
          <Link className={linkClass('/deliveries')} to="/deliveries">Deliveries</Link>
          <Link className={linkClass('/gate')} to="/gate">Gate</Link>
          <Link className={linkClass('/grn')} to="/grn">GRN</Link>
          <Link className={linkClass('/reports')} to="/reports">Reports</Link>
          <Link className={linkClass('/admin/users')} to="/admin/users">Users</Link>
          <Link className={linkClass('/admin/audit')} to="/admin/audit">Audit</Link>
        </>
      )}

      {/* Manager */}
      {user.role === 'manager' && (
        <>
          <Link className={linkClass('/requests')} to="/requests">Requests</Link>
          <Link className={linkClass('/vendors')} to="/vendors">Vendors</Link>
          <Link className={linkClass('/manager/quotations')} to="/manager/quotations">Quotations</Link>
          <Link className={linkClass('/purchase-orders')} to="/purchase-orders">POs</Link>
          <Link className={linkClass('/deliveries')} to="/deliveries">Deliveries</Link>
          <Link className={linkClass('/grn')} to="/grn">GRN</Link>
          <Link className={linkClass('/reports')} to="/reports">Reports</Link>
        </>
      )}

      {/* Gate Security */}
      {user.role === 'gate' && (
        <>
          <Link className={linkClass('/gate')} to="/gate">Scan</Link>
          <Link className={linkClass('/gate/vehicles')} to="/gate/vehicles">Vehicles</Link>
          <Link className={linkClass('/gate/history')} to="/gate/history">History</Link>
        </>
      )}

      {/* Receiving Officer */}
      {user.role === 'receiving_officer' && (
        <>
          <Link className={linkClass('/deliveries')} to="/deliveries">Deliveries</Link>
          <Link className={linkClass('/grn')} to="/grn">GRN</Link>
          <Link className={linkClass('/receiving/damaged')} to="/receiving/damaged">Damaged</Link>
        </>
      )}

      {/* Vendor */}
      {user.role === 'vendor' && (
        <>
          <Link className={linkClass('/purchase-orders')} to="/purchase-orders">My POs</Link>
          <Link className={linkClass('/deliveries')} to="/deliveries">Deliveries</Link>
          <Link className={linkClass('/vendor/invoices')} to="/vendor/invoices">Invoices</Link>
          <Link className={linkClass('/vendor/payments')} to="/vendor/payments">Payments</Link>
        </>
      )}

      {/* Accounts */}
      {user.role === 'accounts' && (
        <>
          <Link className={linkClass('/accounts/payments')} to="/accounts/payments">Payments</Link>
          <Link className={linkClass('/grn')} to="/grn">GRN</Link>
          <Link className={linkClass('/reports')} to="/reports">Reports</Link>
        </>
      )}

      {/* Technician */}
      {user.role === 'technician' && (
        <Link className={linkClass('/requests')} to="/requests">My Work Orders</Link>
      )}
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
              <img src="/images/mseclogo.png" alt="CampusServe Logo" className="h-full w-full object-contain" />
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
              <div className="relative flex flex-shrink-0 items-center gap-1 lg:gap-2" ref={dropdownRef}>
                <button className="relative hidden h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[#f0f2f5] lg:flex lg:h-10 lg:w-10" aria-label="Notifications">
                  <Bell className="h-5 w-5 text-[#60758a] transition-colors hover:text-violet-600" />
                  {notifCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-4 w-4 flex items-center justify-center rounded-full border border-white bg-violet-600 text-[8px] font-black text-white">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                  {notifCount === 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-violet-600" />}
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
            <Link to="/login" className="btn-premium h-9 min-w-[60px] justify-center px-3 text-xs lg:h-10 lg:min-w-[70px] lg:px-4 lg:text-sm">Login</Link>
          )}
      </div>

      <div className={`${isAuthPage ? 'hidden' : 'flex'} items-center gap-1 lg:hidden`}>
        {user && <button className="relative flex flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-[#111418] transition-colors duration-200 hover:bg-violet-50 sm:p-2" aria-label="Notifications"><Bell className="h-5 w-5 sm:h-6 sm:w-6" /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-600" /></button>}
        <button onClick={() => user ? setIsSettingsOpen(true) : setIsMobileMenuOpen((value) => !value)} className="flex flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-[#111418] transition-colors duration-200 hover:bg-violet-50 sm:p-2" aria-label={user ? 'Open settings' : 'Toggle navigation menu'}>
          {isMobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
        </button>
      </div>

      {user && isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] mx-1 overflow-hidden rounded-2xl premium-card p-4 shadow-glass-lg lg:hidden">
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
