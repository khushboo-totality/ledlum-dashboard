'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { User, Role, Permissions } from '@/types'
import { GUEST_USER, getPermissions } from '@/lib/auth'
import { supabase, authFetch } from '@/lib/supabaseClient'

interface AuthContextType {
  user: User | null
  loading: boolean
  permissions: Permissions
  /** Resolves to an error message, or null on success. */
  login: (identifier: string, password: string) => Promise<string | null>
  loginAsGuest: () => void
  logout: () => void
  /** Adopts session tokens issued by a server route (login / set-password).
   * Resolves to an error message, or null on success. */
  adoptSession: (tokens: { access_token: string; refresh_token: string }) => Promise<string | null>
  can: (action: keyof Permissions) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)
const NULL_PERMS: Permissions = {
  create: false, edit: false, delete: false,
  cart: false, share: false, download: false,
}
// Guest view has no Supabase account — just a local flag.
const GUEST_KEY = 'ledlum_guest'

async function loadProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('ledlum_profiles')
    .select('username, email, role, name, company, initials')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return {
    username: data.username,
    email:    data.email,
    role:     data.role as Role,
    name:     data.name,
    company:  data.company ?? undefined,
    initials: data.initials,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore the Supabase session (or guest flag) on mount, and follow
  // sign-in/sign-out/token-expiry from then on.
  useEffect(() => {
    let cancelled = false

    const apply = async (userId: string | null) => {
      if (userId) {
        const profile = await loadProfile(userId)
        if (cancelled) return
        if (!profile) {
          // Auth user with no profile row — not allowed into the dashboard.
          await supabase.auth.signOut()
          setUser(null)
        } else {
          setUser(profile)
        }
      } else {
        let guest = false
        try { guest = localStorage.getItem(GUEST_KEY) === '1' } catch {}
        setUser(guest ? GUEST_USER : null)
      }
      if (!cancelled) setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id ?? null))

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Defer: calling Supabase inside this callback can deadlock.
        setTimeout(() => apply(session?.user.id ?? null), 0)
      }
    })

    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  const permissions = user ? getPermissions(user.role as Role) : NULL_PERMS

  const adoptSession = useCallback(async (tokens: { access_token: string; refresh_token: string }) => {
    const { data: sess, error } = await supabase.auth.setSession(tokens)
    if (error || !sess.user) return 'Could not start session. Please try again.'

    const profile = await loadProfile(sess.user.id)
    if (!profile) {
      await supabase.auth.signOut()
      return 'This account has no dashboard access.'
    }
    try { localStorage.removeItem(GUEST_KEY) } catch {}
    setUser(profile)
    return null
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const data = await res.json()
      if (!res.ok) return data.error ?? 'Invalid username or password.'
      return await adoptSession(data)
    } catch {
      return 'Network error. Please try again.'
    }
  }, [adoptSession])

  const loginAsGuest = useCallback(() => {
    try { localStorage.setItem(GUEST_KEY, '1') } catch {}
    setUser(GUEST_USER)
  }, [])

  const logout = useCallback(async () => {
    try { localStorage.removeItem(GUEST_KEY) } catch {}
    setUser(null)
    // Log while the session token is still valid, then end it.
    await authFetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'logout' }),
    }).catch(() => {})
    supabase.auth.signOut()
  }, [])

  const can = useCallback((action: keyof Permissions) => permissions[action], [permissions])

  return (
    <AuthContext.Provider value={{ user, loading, permissions, login, loginAsGuest, logout, adoptSession, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
