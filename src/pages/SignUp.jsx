import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAlert } from '../components/AlertContext'
import apiClient from '../utils/apiClient'
import { User, Mail, Lock, Phone, Landmark, Briefcase } from 'lucide-react'

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'requester',
    department: 'CSE',
    phoneNumber: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    const { name, email, password, confirmPassword, role, department, phoneNumber } = formData

    if (!name || !email || !password || !confirmPassword || !role || !department) {
      showError('Form Incomplete', 'Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      showError('Password Mismatch', 'The passwords you entered do not match')
      return
    }

    if (password.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post('/api/users', {
        name,
        email,
        password,
        role,
        department,
        phoneNumber
      })

      if (res.success) {
        showSuccess('Account Created!', 'You can now log in with your credentials.')
        navigate('/login')
      } else {
        showError('Registration Failed', res.error || 'Could not register user')
      }
    } catch (err) {
      showError('Sign Up Error', err.message || 'Server error occurred during sign up')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 relative">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg glass-card-purple p-8 rounded-2xl relative z-10 border border-violet-500/20">
        <div className="text-center mb-8">
          <h2 className="font-display font-extrabold text-3xl tracking-tight text-white">
            Create <span className="wave-text">CampusServe</span> Account
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Sign up to access and execute maintenance operations
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="john.doe@college.edu"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
                User Role *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                  <Briefcase size={16} />
                </span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all appearance-none"
                >
                  <option className="bg-slate-950 text-slate-300" value="requester">Requester (Faculty/Staff)</option>
                  <option className="bg-slate-950 text-slate-300" value="manager">Service Manager</option>
                  <option className="bg-slate-950 text-slate-300" value="technician">Technician</option>
                  <option className="bg-slate-950 text-slate-300" value="accounts">Accounts Officer</option>
                  <option className="bg-slate-950 text-slate-300" value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
                Department *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                  <Landmark size={16} />
                </span>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all appearance-none"
                >
                  <option className="bg-slate-950 text-slate-300" value="CSE">CSE</option>
                  <option className="bg-slate-950 text-slate-300" value="ECE">ECE</option>
                  <option className="bg-slate-950 text-slate-300" value="MECH">MECH</option>
                  <option className="bg-slate-950 text-slate-300" value="CIVIL">CIVIL</option>
                  <option className="bg-slate-950 text-slate-300" value="IT">IT</option>
                  <option className="bg-slate-950 text-slate-300" value="ADMIN">ADMIN</option>
                  <option className="bg-slate-950 text-slate-300" value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                <Phone size={16} />
              </span>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+91-XXXXXXXXXX"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
                Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-violet-400/70">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/60 border border-violet-950/60 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full purple-glow-btn py-3 mt-2 font-semibold text-sm flex items-center justify-center space-x-2 text-white transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold underline transition-all">
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp
