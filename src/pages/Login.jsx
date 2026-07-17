import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { User, Key, ArrowRight } from 'lucide-react'

const demoCredentials = [
  { role: 'Requester', email: 'faculty@campuserve.com', desc: 'Raise requests' },
  { role: 'Admin', email: 'admin@campuserve.com', desc: 'Approve & assign' },
  { role: 'Manager', email: 'manager@campuserve.com', desc: 'Estimate & invoice' },
  { role: 'Technician', email: 'tech@campuserve.com', desc: 'Update & log work' },
  { role: 'Accounts', email: 'accounts@campuserve.com', desc: 'Record payments' }
]

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      showError('Required Fields', 'Please enter your email and password')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post('/api/auth', { email, password })
      if (res.success && res.user) {
        const authData = {
          isAuthenticated: true,
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
          department: res.user.department,
          phoneNumber: res.user.phoneNumber,
          eSignature: res.user.eSignature
        }
        localStorage.setItem('auth', JSON.stringify(authData))
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userRole', res.user.role)
        localStorage.setItem('userId', res.user.id)
        
        window.dispatchEvent(new Event('authStateChanged'))
        showSuccess('Welcome Back!', `Logged in successfully as ${res.user.name}`)
        navigate('/dashboard')
      } else {
        showError('Login Failed', res.error || 'Invalid credentials')
      }
    } catch (err) {
      showError('Authentication Error', err.message || 'Server error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredentials = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('campus123')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 relative">
      
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card-purple p-8 rounded-2xl relative z-10 border border-violet-500/20">
        
        {/* Brand */}
        <div className="text-center mb-8">
          <h2 className="font-display font-extrabold text-3xl tracking-tight text-white">
            Welcome to <span className="wave-text">CampusServe</span>
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Log in to manage campus service and maintenance operations
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                <User size={16} />
              </span>
              <input
                type="email"
                placeholder="you@campuserve.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                <Key size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full purple-glow-btn py-3 font-semibold text-sm flex items-center justify-center space-x-2 text-white transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Secure Log In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Credentials Autocomplete Widget */}
        <div className="mt-8 pt-6 border-t border-violet-950/40">
          <span className="block text-xs font-bold text-violet-400 tracking-wider uppercase mb-3">
            Quick Testing Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            {demoCredentials.map((cred) => (
              <button
                key={cred.role}
                onClick={() => fillCredentials(cred.email)}
                className="text-left p-2.5 rounded-lg bg-slate-950/40 hover:bg-violet-950/30 border border-violet-950/40 hover:border-violet-900/50 transition-all group"
              >
                <div className="text-xs font-bold text-violet-300 group-hover:text-violet-200">{cred.role}</div>
                <div className="text-[10px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">{cred.email}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-semibold underline transition-all">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
