import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import CursorGlow from '../components/CursorGlow'
import AtmosphereBackground from '../components/AtmosphereBackground'
import {
  RiDashboardLine,
  RiChatAiLine,
  RiFileTextLine,
  RiUploadCloud2Line,
  RiBarChartBoxLine,
  RiSettings3Line,
  RiTeamLine,
  RiLogoutBoxLine,
  RiRobot2Line,
  RiShieldUserLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from 'react-icons/ri'

const navItems = [
  { to: '/dashboard',  icon: RiDashboardLine,    label: 'Dashboard'  },
  { to: '/chat/new',   icon: RiChatAiLine,        label: 'Chat'       },
  { to: '/documents',  icon: RiFileTextLine,      label: 'Documents'  },
  { to: '/upload',     icon: RiUploadCloud2Line,  label: 'Upload'     },
  { to: '/analytics',  icon: RiBarChartBoxLine,   label: 'Analytics'  },
  { to: '/settings',   icon: RiSettings3Line,     label: 'Settings'   },
]

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const SIDEBAR_W = collapsed ? 72 : 240

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)', position: 'relative' }}>
      <CursorGlow />

      {/* ─── Sidebar ─── */}
      <motion.aside
        animate={{ width: SIDEBAR_W }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          flexShrink: 0,
          height: '100%',
          background: 'rgba(7,7,17,0.90)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(99,102,241,0.12)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar inner glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 200,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: collapsed ? '20px 14px' : '20px 20px',
          borderBottom: '1px solid rgba(99,102,241,0.10)',
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ boxShadow: ['0 0 12px rgba(99,102,241,0.5)', '0 0 24px rgba(99,102,241,0.8)', '0 0 12px rgba(99,102,241,0.5)'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <RiRobot2Line style={{ color: '#fff', fontSize: 18 }} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff', lineHeight: 1.2 }}>ChatMe</div>
                <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 500, letterSpacing: '0.04em' }}>AI WORKSPACE</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: collapsed ? '10px 18px' : '10px 14px',
                    borderRadius: 10,
                    position: 'relative',
                    color: isActive ? '#f0f0ff' : '#9896bb',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14,
                    transition: 'color 0.15s',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 10,
                        background: 'rgba(99,102,241,0.18)',
                        border: '1px solid rgba(99,102,241,0.30)',
                        boxShadow: '0 0 16px rgba(99,102,241,0.12)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon style={{ fontSize: 18, flexShrink: 0, position: 'relative', color: isActive ? '#818cf8' : 'inherit' }} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'relative', whiteSpace: 'nowrap' }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink to="/users" style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: collapsed ? '10px 18px' : '10px 14px',
                    borderRadius: 10, position: 'relative',
                    color: isActive ? '#f0f0ff' : '#9896bb',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14, cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 10,
                        background: 'rgba(99,102,241,0.18)',
                        border: '1px solid rgba(99,102,241,0.30)',
                      }}
                    />
                  )}
                  <RiTeamLine style={{ fontSize: 18, flexShrink: 0, position: 'relative' }} />
                  {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative' }}>Users</motion.span>}
                </motion.div>
              )}
            </NavLink>
          )}
        </nav>

        {/* Collapse toggle */}
        <motion.button
          whileHover={{ background: 'rgba(99,102,241,0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCollapsed(c => !c)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 8px 4px', padding: '10px', borderRadius: 10,
            border: '1px solid rgba(99,102,241,0.12)',
            background: 'transparent', color: '#9896bb', cursor: 'pointer',
            fontSize: 18,
          }}
        >
          {collapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
        </motion.button>

        {/* User footer */}
        <div style={{
          borderTop: '1px solid rgba(99,102,241,0.10)',
          padding: collapsed ? '12px 8px' : '12px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 12px rgba(99,102,241,0.4)',
            }}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                : initials}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ minWidth: 0, flex: 1 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name}
                  </div>
                  {isAdmin && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                      background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                      padding: '1px 6px', borderRadius: 99,
                    }}>
                      <RiShieldUserLine /> ADMIN
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { logout(); navigate('/login') }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: '8px 10px', borderRadius: 8,
              border: 'none', background: 'transparent',
              color: '#9896bb', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'color 0.15s, background 0.15s', width: '100%',
            }}
          >
            <RiLogoutBoxLine style={{ fontSize: 16, flexShrink: 0 }} />
            {!collapsed && <span>Sign out</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* ─── Main content area ─── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Atmosphere behind content */}
        <AtmosphereBackground opacity={0.65} />
        <main style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
