import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { RiRobot2Line, RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiErrorWarningLine } from 'react-icons/ri'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Simple client-side validation check
  const validateEmail = (val: string) => {
    setEmail(val)
    if (!val) {
      setEmailError('Email is required')
    } else if (!/^\S+@\S+\.\S+$/.test(val)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear and re-run simple checks
    if (!email) {
      setEmailError('Email is required')
      toast.error('Please enter your email')
      return
    }
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    if (emailError) {
      toast.error('Please resolve validation errors')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast.success('Signed in successfully!')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error detail:', err)
      const errorResponse = err.response?.data
      
      // Grab backend message
      const msg = errorResponse?.message || errorResponse?.error || 'Invalid email or password'
      
      // Toast the specific backend message
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Animated Brand Logo Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl mb-4 shadow-xl shadow-emerald-500/25 cursor-pointer"
          >
            <RiRobot2Line className="text-white text-3xl" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            ChatMe
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">AI-Powered Customer Support</p>
        </motion.div>

        {/* Glassmorphic Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl shadow-2xl p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
            <p className="text-slate-400 text-sm">Sign in to your workspace to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email address
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-950/50 border ${
                    emailError ? 'border-red-500/80 focus:ring-red-500/20' : 'border-slate-800 focus:ring-emerald-500/20'
                  } rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:border-emerald-500/80 transition-all`}
                  autoComplete="email"
                />
              </div>
              <AnimatePresence>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
                  >
                    <RiErrorWarningLine /> {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/50 border border-slate-800 focus:ring-emerald-500/20 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:border-emerald-500/80 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-emerald-800 disabled:to-teal-800 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all text-sm mt-6 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Create Account Link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
