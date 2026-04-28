'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ZONES, getZoneByPath, getZonePath } from '@/lib/zones'
import LedlumLogo from './LedlumLogo'
import { useAuth } from '@/context/AuthContext'
import { AVATAR_STYLES, ROLE_STYLES } from './ZoneChooser'

export default function ZoneNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const segments   = pathname.split('/').filter(Boolean)
  const activeZone = segments[0] === 'zone' && segments[1]
    ? (getZoneByPath(segments[1])?.id ?? '')
    : ''

  const navigate = (zoneId: string) => {
    router.push(zoneId ? `/zone/${getZonePath(zoneId)}` : '/zone')
  }

  return (
    <>
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
                onClick={logout}
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

      <div className="bg-white border-b border-gray sticky top-16 z-30">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          <button
            onClick={() => navigate('')}
            className={`flex-shrink-0 px-5 py-3.5 text-sm font-semibold font-bai border-b-2 transition-all whitespace-nowrap ${
              !activeZone
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-text hover:text-foreground hover:border-gray-mid'
            }`}
          >
            All Zones
          </button>

          <div className="w-px h-5 bg-gray-mid flex-shrink-0 mx-1" />

          {ZONES.map(zone => (
            <button
              key={zone.id}
              onClick={() => navigate(zone.id)}
              className={`flex-shrink-0 px-5 py-3.5 text-sm font-semibold font-bai border-b-2 transition-all whitespace-nowrap group relative ${
                activeZone === zone.id
                  ? 'border-primary text-primary bg-primary/3'
                  : 'border-transparent text-gray-text hover:text-foreground hover:border-gray-mid'
              }`}
            >
              {zone.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
