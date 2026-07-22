import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiRobot2Line, 
  RiMailLine, 
  RiLockPasswordLine, 
  RiUserLine, 
  RiEyeLine, 
  RiEyeOffLine, 
  RiCheckboxCircleLine, 
  RiCloseCircleLine,
  RiErrorWarningLine
} from 'react-icons/ri'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Password criteria states
  const [criteria, setCriteria] = useState({
    length: false,
    upperLower: false,
    number: false,
    symbol: false,
  })

  // Evaluate password strength criteria in real-time
  useEffect(() => {
    setCriteria({
      length: password.length >= 8,
      upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    })
  }, [password])

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
    
    if (!name || !email || !password || !confirm) {
      toast.error('Please fill in all fields')
      return
    }
    if (emailError) {
      toast.error('Please resolve validation errors')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: any) {
      console.error('Registration error detail:', err)
      const errorResponse = err.response?.data
      const msg = errorResponse?.message || errorResponse?.error || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Calculate percentage of met criteria for the indicator bar
  const metCount = Object.values(criteria).filter(Boolean).length
  const strengthPercent = metCount * 25
  const strengthColor = 
    metCount <= 1 ? 'bg-red-500' : 
    metCount === 2 ? 'bg-orange-500' : 
    metCount === 3 ? 'bg-yellow-500' : 'bg-emerald-500'

  const strengthLabel = 
    password.length === 0 ? '' :
    metCount <= 1 ? 'Weak' : 
    metCount === 2 ? 'Fair' : 
    metCount === 3 ? 'Good' : 'Strong'

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative w-full max-w-md z-10 my-8">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <motion.div 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl mb-4 shadow-xl shadow-emerald-500/25 cursor-pointer"
          >
            <RiRobot2Line className="text-white text-3xl" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ChatMe</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Create your workspace account</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl shadow-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Full name
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:ring-emerald-500/20 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:border-emerald-500/80 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
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
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border ${
                    emailError ? 'border-red-500/80 focus:ring-red-500/20' : 'border-slate-800 focus:ring-emerald-500/20'
                  } rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:border-emerald-500/80 transition-all`}
                  required
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

            {/* Password */}
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
                  placeholder="Enter password (min 8 chars)"
                  className="w-full pl-11 pr-11 py-2.5 bg-slate-950/50 border border-slate-800 focus:ring-emerald-500/20 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:border-emerald-500/80 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                </button>
              </div>

              {/* Password Strength Indicator Bar */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Strength:</span>
                    <span className={`font-semibold ${
                      metCount <= 1 ? 'text-red-400' : 
                      metCount === 2 ? 'text-orange-400' : 
                      metCount === 3 ? 'text-yellow-400' : 'text-emerald-400'
                    }`}>{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${strengthPercent}%` }}
                      className={`h-full ${strengthColor} transition-all duration-300`}
                    />
                  </div>

                  {/* Password Conditions Checklist */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {criteria.length ? (
                        <RiCheckboxCircleLine className="text-emerald-400 text-sm flex-shrink-0" />
                      ) : (
                        <RiCloseCircleLine className="text-slate-600 text-sm flex-shrink-0" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {criteria.upperLower ? (
                        <RiCheckboxCircleLine className="text-emerald-400 text-sm flex-shrink-0" />
                      ) : (
                        <RiCloseCircleLine className="text-slate-600 text-sm flex-shrink-0" />
                      )}
                      <span>Aa & Zz letters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {criteria.number ? (
                        <RiCheckboxCircleLine className="text-emerald-400 text-sm flex-shrink-0" />
                      ) : (
                        <RiCloseCircleLine className="text-slate-600 text-sm flex-shrink-0" />
                      )}
                      <span>At least 1 number</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {criteria.symbol ? (
                        <RiCheckboxCircleLine className="text-emerald-400 text-sm flex-shrink-0" />
                      ) : (
                        <RiCloseCircleLine className="text-slate-600 text-sm flex-shrink-0" />
                      )}
                      <span>At least 1 symbol</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Confirm password
              </label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border ${
                    confirm && password !== confirm ? 'border-red-500/80 focus:ring-red-500/20' : 'border-slate-800 focus:ring-emerald-500/20'
                  } rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:border-emerald-500/80 transition-all`}
                  required
                />
              </div>
              {confirm && password !== confirm && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <RiErrorWarningLine /> Passwords do not match
                </p>
              )}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
