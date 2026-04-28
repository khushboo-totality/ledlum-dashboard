'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ZONES, getZonePath } from '@/lib/zones'
import LedlumLogo from './LedlumLogo'

export const ROLE_STYLES: Record<string, string> = {
  admin:  'bg-primary/10 text-primary border border-primary/20',
  editor: 'bg-blue-50 text-blue-700 border border-blue-200',
  viewer: 'bg-gray/80 text-gray-text border border-gray-mid',
  guest:  'bg-gray/80 text-gray-text border border-gray-mid',
}

export const AVATAR_STYLES: Record<string, string> = {
  admin:  'bg-primary text-white',
  editor: 'bg-blue-600 text-white',
  viewer: 'bg-gray-dark text-white',
  guest:  'bg-gray-dark text-white',
}

export default function ZoneChooser() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const selectZone = (zoneId: string) => {
    router.push(`/zone/${getZonePath(zoneId)}`)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray flex flex-col">
      <header className="bg-white border-b border-gray h-16 flex items-center justify-between px-8 sticky top-0 z-40">
        <LedlumLogo className="h-8 w-auto" />

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 border border-gray rounded-full px-3 py-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-bai ${AVATAR_STYLES[user.role] ?? 'bg-primary text-white'}`}>
                  {user.initials}
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-semibold font-bai text-foreground">{user.name}</span>
                  {user.company && (
                    <span className="text-[10px] text-gray-dark font-pop ml-1.5">· {user.company}</span>
                  )}
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide font-pop ${ROLE_STYLES[user.role] ?? ROLE_STYLES.viewer}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-gray-text hover:text-primary font-pop transition-colors flex items-center gap-1.5 border border-gray rounded-lg px-3 py-1.5"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="text-sm font-semibold text-primary hover:text-primary/80 font-pop transition-colors flex items-center gap-1.5 border border-primary/30 rounded-lg px-3 py-1.5"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-8 py-12 max-w-5xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-2xl font-bold font-bai text-foreground mb-1.5">Select a Zone</h1>
          <p className="text-sm text-gray-dark font-pop">Choose a zone to browse its product catalogue.</p>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {ZONES.map(zone => (
            <button
              key={zone.id}
              onClick={() => selectZone(zone.id)}
              className="group bg-white border border-gray rounded-xl px-5 py-6 text-left hover:border-primary hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span className="block text-sm font-bold font-bai text-foreground group-hover:text-primary transition-colors">
                {zone.label}
              </span>
              <span className="block text-xs text-gray-dark font-pop mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Browse →
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
