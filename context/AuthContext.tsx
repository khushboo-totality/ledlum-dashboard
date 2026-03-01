'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { User, Role, Permissions } from '@/types'
import { GUEST_USER, getPermissions, validateLogin } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  permissions: Permissions
  login: (username: string, password: string) => boolean
  loginAsGuest: () => void
  logout: () => void
  can: (action: keyof Permissions) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)
const NULL_PERMS: Permissions = { create: false, edit: false, delete: false, cart: false }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const permissions = user ? getPermissions(user.role as Role) : NULL_PERMS

  const login = useCallback((username: string, password: string) => {
    const u = validateLogin(username, password)
    if (!u) return false
    setUser(u)
    return true
  }, [])

  const loginAsGuest = useCallback(() => setUser(GUEST_USER), [])
  const logout       = useCallback(() => setUser(null), [])
  const can          = useCallback((action: keyof Permissions) => permissions[action], [permissions])

  return (
    <AuthContext.Provider value={{ user, permissions, login, loginAsGuest, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
