import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/GlassCard'
import toast from 'react-hot-toast'
import {
  RiUser3Line,
  RiLockPasswordLine,
  RiNotification3Line,
  RiPaletteLine,
  RiKeyLine,
  RiShieldCheckLine,
  RiSave3Line,
} from 'react-icons/ri'

const sections = [
  { id: 'profile',       icon: RiUser3Line,         label: 'Profile'       },
  { id: 'security',      icon: RiLockPasswordLine,  label: 'Security'      },
  { id: 'notifications', icon: RiNotification3Line, label: 'Notifications' },
  { id: 'appearance',    icon: RiPaletteLine,       label: 'Appearance'    },
  { id: 'api',           icon: RiKeyLine,           label: 'API Keys'      },
  { id: 'advanced',      icon: RiShieldCheckLine,   label: 'Advanced'      },
]

export default function Settings() {
  const { user } = useAuth()
  const [active, setActive] = useState('profile')
  const [name, setName] = useState(user?.name ?? '')
  const [email] = useState(user?.email ?? '')

  const handleSave = () => {
    toast.success('Settings saved')
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f0f0ff', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 14, color: '#6d6b98' }}>Manage your workspace preferences and account</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>

        {/* Sidebar tabs */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard hover={false} style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActive(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, border: 'none',
                  background: active === id ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: active === id ? '#e0e0f8' : '#9896bb',
                  fontSize: 13, fontWeight: active === id ? 600 : 500,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  position: 'relative', overflow: 'hidden',
                  borderLeft: active === id ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon style={{ fontSize: 16, flexShrink: 0, color: active === id ? '#818cf8' : 'inherit' }} />
                {label}
              </motion.button>
            ))}
          </GlassCard>
        </motion.div>

        {/* Content panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard hover={false} style={{ padding: '28px 32px' }}>
                {active === 'profile' && (
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', marginBottom: 4 }}>Profile Settings</h2>
                    <p style={{ fontSize: 13, color: '#6d6b98', marginBottom: 28 }}>Update your name and personal information</p>

                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 800, color: '#fff',
                        boxShadow: '0 0 20px rgba(99,102,241,0.4)',
                      }}>
                        {name ? name[0].toUpperCase() : '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff' }}>{name || 'Your Name'}</div>
                        <div style={{ fontSize: 12, color: '#6d6b98' }}>{email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { label: 'Full Name', value: name, setter: setName, placeholder: 'Enter your name' },
                        { label: 'Email Address', value: email, setter: null, placeholder: 'Email', readonly: true },
                      ].map(({ label, value, setter, placeholder, readonly }) => (
                        <div key={label}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#9896bb', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                            {label.toUpperCase()}
                          </label>
                          <input
                            value={value}
                            onChange={e => setter?.(e.target.value)}
                            placeholder={placeholder}
                            readOnly={readonly}
                            style={{
                              width: '100%', padding: '11px 14px',
                              background: readonly ? 'rgba(99,102,241,0.05)' : 'rgba(13,13,26,0.72)',
                              border: `1px solid rgba(99,102,241,${readonly ? '0.08' : '0.18'})`,
                              borderRadius: 10, color: readonly ? '#6d6b98' : '#f0f0ff',
                              fontSize: 14, outline: 'none', fontFamily: 'inherit',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSave}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        marginTop: 24, padding: '10px 24px',
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        border: 'none', borderRadius: 10,
                        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <RiSave3Line /> Save Changes
                    </motion.button>
                  </div>
                )}

                {active === 'security' && (
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', marginBottom: 4 }}>Security</h2>
                    <p style={{ fontSize: 13, color: '#6d6b98', marginBottom: 28 }}>Manage your password and account security</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {['Current Password', 'New Password', 'Confirm Password'].map(label => (
                        <div key={label}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#9896bb', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>
                            {label.toUpperCase()}
                          </label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            style={{
                              width: '100%', padding: '11px 14px',
                              background: 'rgba(13,13,26,0.72)',
                              border: '1px solid rgba(99,102,241,0.18)',
                              borderRadius: 10, color: '#f0f0ff',
                              fontSize: 14, outline: 'none', fontFamily: 'inherit',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => toast.success('Password updated')}
                      style={{
                        marginTop: 24, padding: '10px 24px',
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        border: 'none', borderRadius: 10,
                        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <RiLockPasswordLine /> Update Password
                    </motion.button>
                  </div>
                )}

                {active === 'appearance' && (
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', marginBottom: 4 }}>Appearance</h2>
                    <p style={{ fontSize: 13, color: '#6d6b98', marginBottom: 28 }}>Choose your visual preferences</p>
                    <div style={{ display: 'flex', gap: 14 }}>
                      {['Dark (Default)', 'Darker', 'AMOLED'].map(theme => (
                        <motion.div
                          key={theme}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toast('Theme: ' + theme)}
                          style={{
                            padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                            background: theme === 'Dark (Default)' ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.06)',
                            border: `1px solid ${theme === 'Dark (Default)' ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.12)'}`,
                            fontSize: 13, fontWeight: 600,
                            color: theme === 'Dark (Default)' ? '#e0e0f8' : '#9896bb',
                            textAlign: 'center',
                          }}
                        >
                          {theme}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {(active === 'notifications' || active === 'api' || active === 'advanced') && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, opacity: 0.2 }}>🚧</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#4d4b72' }}>Coming Soon</div>
                    <div style={{ fontSize: 13, color: '#2e2c52' }}>This section is under development</div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
