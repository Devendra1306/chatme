import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  avatar?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('sg_token'))
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await authApi.getProfile()
      setUser(res.data.user ?? res.data)
    } catch {
      setUser(null)
      setToken(null)
      localStorage.removeItem('sg_token')
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem('sg_token')
    if (storedToken) {
      setToken(storedToken)
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('sg_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const register = async (name: string, email: string, password: string) => {
    await authApi.register(name, email, password)
  }

  const logout = () => {
    localStorage.removeItem('sg_token')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
