import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
} from 'react-icons/ri'

const navItems = [
  { to: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { to: '/chat/new', icon: RiChatAiLine, label: 'Chat' },
  { to: '/documents', icon: RiFileTextLine, label: 'Documents' },
  { to: '/upload', icon: RiUploadCloud2Line, label: 'Upload' },
  { to: '/analytics', icon: RiBarChartBoxLine, label: 'Analytics' },
  { to: '/settings', icon: RiSettings3Line, label: 'Settings' },
]

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#1e3a5f] flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <RiRobot2Line className="text-white text-xl" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">ChatMe</div>
            <div className="text-blue-200 text-xs">AI Customer Support</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <RiTeamLine className="text-lg flex-shrink-0" />
              Users
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    <RiShieldUserLine className="text-xs" />
                    Admin
                  </span>
                ) : (
                  <span className="text-xs text-blue-300">User</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-blue-200 hover:text-white text-sm w-full px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <RiLogoutBoxLine />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  )
}
