import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import { AlertProvider } from './components/AlertContext'
import { getAuthOrNull } from './utils/auth'

const clearStoredAuth = () => {
  try {
    localStorage.removeItem('auth')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    window.dispatchEvent(new Event('authStateChanged'))
  } catch (e) { }
}

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CreateRequest = lazy(() => import('./pages/CreateRequest'))
const Requests = lazy(() => import('./pages/Requests'))
const RequestDetails = lazy(() => import('./pages/RequestDetails'))
const Reports = lazy(() => import('./pages/Reports'))
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Root route handler
const RootRedirect = () => {
  const parsed = getAuthOrNull()
  if (!parsed || !parsed.isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to="/dashboard" replace />
}

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const parsed = getAuthOrNull()
  if (!parsed || !parsed.isAuthenticated) {
    clearStoredAuth()
    return <Navigate to="/login" replace />
  }
  return children
}

// Redirect if already logged in
const RedirectIfAuthenticated = ({ children }) => {
  const parsed = getAuthOrNull()
  if (parsed && parsed.isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AppContent() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  // A modal or interrupted navigation can leave an inline scroll lock behind.
  // Pages use normal window scrolling, so always release that lock on route changes.
  useEffect(() => {
    document.documentElement.style.removeProperty('overflow')
    document.documentElement.style.removeProperty('overflow-y')
    document.documentElement.style.removeProperty('height')
    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('overflow-y')
    document.body.style.removeProperty('height')
    document.body.classList.remove('overflow-hidden', 'no-scroll', 'modal-open')
  }, [location.pathname])

  useEffect(() => {
    if (!isAuthPage) return
    const authScroller = document.querySelector('body.auth-page .layout-container')
    if (authScroller) authScroller.scrollTop = 0
  }, [isAuthPage, location.pathname])

  useEffect(() => {
    const handleWheel = (event) => {
      if (!event.deltaY || event.ctrlKey) return

      // Leave independently scrollable panels, tables and modals alone.
      let node = event.target instanceof Element ? event.target : null
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node)
        const canScroll = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight
        if (canScroll) return
        node = node.parentElement
      }

      const before = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const hasRoom = event.deltaY > 0 ? before < maxScroll : before > 0
      if (!hasRoom) return

      // Edge/trackpad fallback: intervene only if the browser did not perform
      // the native window scroll by the next animation frame.
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - before) < 1) {
          window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' })
        }
      })
    }

    window.addEventListener('wheel', handleWheel, { passive: true, capture: true })
    return () => window.removeEventListener('wheel', handleWheel, { capture: true })
  }, [])

  useEffect(() => {
    if (!isAuthPage) {
      document.body.style.backgroundImage = 'none'
      document.documentElement.style.backgroundImage = 'none'
      document.body.classList.remove('auth-page')
      document.documentElement.classList.remove('auth-page')
    } else {
      document.body.classList.add('auth-page')
      document.documentElement.classList.add('auth-page')
      document.body.style.background = ''
      document.documentElement.style.background = ''

      let backgroundImage = "url('/images/campus.jpeg')"
      const imageSet = "image-set(url('/images/campus.avif') type('image/avif') 1x, url('/images/campus.webp') type('image/webp') 1x, url('/images/campus.jpeg') 1x)"
      if (typeof CSS !== 'undefined' && CSS.supports?.('background-image', imageSet)) backgroundImage = imageSet
      document.body.style.backgroundImage = backgroundImage
      document.documentElement.style.backgroundImage = backgroundImage
      document.documentElement.style.backgroundSize = 'cover'
      document.documentElement.style.backgroundPosition = 'center'
      document.documentElement.style.backgroundAttachment = 'fixed'
      document.documentElement.style.backgroundRepeat = 'no-repeat'
    }
    return () => {
      document.body.classList.remove('auth-page')
      document.documentElement.classList.remove('auth-page')
      document.body.style.backgroundImage = 'none'
      document.documentElement.style.backgroundImage = 'none'
      document.documentElement.style.backgroundSize = ''
      document.documentElement.style.backgroundPosition = ''
      document.documentElement.style.backgroundAttachment = ''
      document.documentElement.style.backgroundRepeat = ''
    }
  }, [isAuthPage])

  return (
    <>
      <div
        className={`flex w-full flex-col ${isAuthPage ? 'relative auth-wrapper' : ''}`}
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
          minHeight: '100vh'
        }}
      >
        {isAuthPage && <div className="pointer-events-none fixed inset-0 z-0 bg-black/40" />}
        <div className={`layout-container flex min-h-screen flex-col max-w-full ${isAuthPage ? 'relative z-10' : 'bg-[#FAF7F0] text-slate-800'}`}>
          <Header />
          <main className="flex w-full flex-1 justify-center">
            <div className={`layout-content-container flex w-full max-w-7xl flex-col px-4 py-6 ${!isAuthPage ? 'pb-24 md:pb-6' : ''}`}>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
                  <Route path="/requests/new" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
                  <Route path="/requests/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  
                  <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
                  <Route path="/signup" element={<RedirectIfAuthenticated><SignUp /></RedirectIfAuthenticated>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      {!isAuthPage && <BottomNav />}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AlertProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AlertProvider>
    </ErrorBoundary>
  )
}

export default App
