'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { User, Role, Permissions } from '@/types'
import { GUEST_USER, getPermissions, validateLogin } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  permissions: Permissions
  login: (username: string, password: string) => boolean
  loginAsGuest: () => void
  logout: () => void
  can: (action: keyof Permissions) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)
const NULL_PERMS: Permissions = {
  create: false, edit: false, delete: false,
  cart: false, share: false, download: false,
}
const AUTH_KEY = 'ledlum_auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY)
      if (saved) setUser(JSON.parse(saved) as User)
    } catch {}
    setLoading(false)
  }, [])

  const permissions = user ? getPermissions(user.role as Role) : NULL_PERMS

  const login = useCallback((username: string, password: string) => {
    const u = validateLogin(username, password)
    if (!u) return false
    setUser(u)
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(u)) } catch {}
    return true
  }, [])

  const loginAsGuest = useCallback(() => {
    setUser(GUEST_USER)
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(GUEST_USER)) } catch {}
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try { localStorage.removeItem(AUTH_KEY) } catch {}
  }, [])

  const can = useCallback((action: keyof Permissions) => permissions[action], [permissions])

  return (
    <AuthContext.Provider value={{ user, loading, permissions, login, loginAsGuest, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}