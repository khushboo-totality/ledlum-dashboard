'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import LedlumLogo from './LedlumLogo'

export type AdminSection = 'products' | 'partners'

const NAV: { id: AdminSection; label: string; icon: ReactNode }[] = [
  {
    id: 'products',
    label: 'Products',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'partners',
    label: 'Partners',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

/** Lets headers inside the shell (e.g. Header) show a hamburger that opens
 * the sidebar on small screens, without threading props through CatalogPage. */
const AdminShellContext = createContext<{ openSidebar: () => void } | null>(null)
export const useAdminShell = () => useContext(AdminShellContext)

interface AdminShellProps {
  section: AdminSection
  onSection: (s: AdminSection) => void
  children: ReactNode
}

export default function AdminShell({ section, onSection, children }: AdminShellProps) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const sidebar = (
    <div className="flex h-full flex-col bg-white border-r border-gray-mid">
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray px-5">
        <LedlumLogo className="h-9 w-auto" />
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="lg:hidden w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-dark font-pop">Admin</p>
        <ul className="space-y-1">
          {NAV.map(item => {
            const active = item.id === section
            return (
              <li key={item.id}>
                <button
                  onClick={() => { onSection(item.id); setMobileOpen(false); window.scrollTo({ top: 0 }) }}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold font-bai transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-text hover:bg-primary/8 hover:text-primary'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {user && (
        <div className="flex-shrink-0 border-t border-gray p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white font-bai">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground font-bai">{user.name}</p>
              <p className="truncate text-[10px] uppercase text-primary font-pop">{user.role}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="tap-target flex h-9 w-9 items-center justify-center rounded-lg border border-gray-mid text-gray-text transition-colors hover:border-primary hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <AdminShellContext.Provider value={{ openSidebar: () => setMobileOpen(true) }}>
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 lg:block">
        {sidebar}
      </aside>

      {/* Mobile: slide-in drawer */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[61] w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        {children}
      </div>
    </AdminShellContext.Provider>
  )
}

/** Hamburger for headers rendered inside AdminShell — hidden on desktop
 * where the sidebar is always visible, and renders nothing outside the shell. */
export function AdminMenuButton() {
  const shell = useAdminShell()
  if (!shell) return null
  return (
    <button
      onClick={shell.openSidebar}
      aria-label="Open menu"
      className="tap-target flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-mid bg-white/80 text-gray-text transition-colors hover:border-primary hover:text-primary lg:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  )
}
