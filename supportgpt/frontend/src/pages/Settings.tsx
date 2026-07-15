import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import {
  RiUserLine,
  RiMailLine,
  RiLockPasswordLine,
  RiSaveLine,
  RiImageLine,
  RiEyeLine,
  RiEyeOffLine,
} from 'react-icons/ri'

export default function Settings() {
  const { user, refreshUser } = useAuth()

  // Profile state
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [avatar, setAvatar] = useState(user?.avatar ?? '')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setProfileLoading(true)
    try {
      await authApi.updateProfile({ name, email, avatar })
      await refreshUser()
      toast.success('Profile updated successfully')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update profile'
      toast.error(msg)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setPasswordLoading(true)
    try {
      await authApi.changePassword(oldPassword, newPassword)
      toast.success('Password changed successfully')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to change password'
      toast.error(msg)
    } finally {
      setPasswordLoading(false)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
          <RiUserLine className="text-emerald-500" />
          Profile Information
        </h2>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" onError={() => setAvatar('')} />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
              user?.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Avatar URL (optional)</label>
            <div className="relative">
              <RiImageLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {profileLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <RiSaveLine />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
          <RiLockPasswordLine className="text-emerald-500" />
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Your current password"
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#163050] disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {passwordLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Changing...
              </>
            ) : (
              <>
                <RiLockPasswordLine />
                Change Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
