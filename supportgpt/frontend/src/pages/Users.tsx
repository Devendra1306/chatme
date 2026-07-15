import { useEffect, useState } from 'react'
import { usersApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import {
  RiTeamLine,
  RiDeleteBin6Line,
  RiShieldUserLine,
  RiUserLine,
  RiSearchLine,
} from 'react-icons/ri'

interface UserItem {
  id: string
  _id?: string
  name: string
  email: string
  role: 'admin' | 'user'
  avatar?: string
  createdAt?: string
  created_at?: string
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    usersApi.getUsers()
      .then((res) => {
        const items = res.data?.users ?? res.data ?? []
        setUsers(Array.isArray(items) ? items.map((u: UserItem) => ({ ...u, id: u.id ?? u._id })) : [])
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      toast.error("You can't change your own role")
      return
    }
    setUpdatingId(userId)
    try {
      await usersApi.updateRole(userId, newRole)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as 'admin' | 'user' } : u))
      toast.success('User role updated')
    } catch {
      toast.error('Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      toast.error("You can't delete your own account")
      return
    }
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setDeletingId(userId)
    try {
      await usersApi.deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    return (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  })

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <RiTeamLine className="text-emerald-500" />
            Users
          </h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                  {search ? 'No users found matching your search' : 'No users found'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const date = user.createdAt ?? user.created_at
                const isCurrentUser = user.id === currentUser?.id

                return (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${isCurrentUser ? 'bg-emerald-50/30' : ''}`}>
                    {/* Avatar + Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {user.name}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-xs text-slate-400">(you)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>

                    {/* Role badge + select */}
                    <td className="px-5 py-4">
                      {isCurrentUser ? (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          user.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.role === 'admin' ? <RiShieldUserLine /> : <RiUserLine />}
                          {user.role}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingId === user.id}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer ${
                            user.role === 'admin'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={deletingId === user.id}
                          className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          <RiDeleteBin6Line />
                          {deletingId === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
