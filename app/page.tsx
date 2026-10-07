'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import CatalogPage from '@/components/CatalogPage'
import PageSpinner from '@/components/PageSpinner'
import AdminShell, { AdminMenuButton, type AdminSection } from '@/components/AdminShell'
import PartnerManager from '@/components/PartnerManager'

function PageInner() {
  const { user, loading: authLoading } = useAuth()
  const [hydrated, setHydrated] = useState(false)
  const [section, setSection] = useState<AdminSection>('products')

  // Mark hydrated after mount to avoid SSR/client mismatch
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Before hydration, or before we know if a session was restored — show a
  // spinner instead of a blank flash (and instead of flashing AuthScreen).
  if (!hydrated || authLoading) return <PageSpinner />

  if (!user) return <AuthScreen />

  // Go straight to the catalogue after login (no browse chooser step)
  if (user.role !== 'admin') return <CatalogPage initialMode="product" />

  // Admins get a sidebar with separate sections. The catalogue stays mounted
  // (just hidden) while on another section so its filters/scroll position
  // survive switching back.
  return (
    <AdminShell section={section} onSection={setSection}>
      <div className={section === 'products' ? '' : 'hidden'}>
        <CatalogPage initialMode="product" />
      </div>

      {section === 'partners' && (
        <div className="min-h-screen app-shell">
          <header className="glass-panel sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-white/80 px-4 py-3 shadow-header sm:px-6 lg:px-8">
            <AdminMenuButton />
            <div>
              <p className="text-sm font-extrabold text-foreground font-bai">Partners</p>
              <p className="text-[11px] font-pop text-gray-dark">Create and manage partner accounts</p>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <PartnerManager isOpen inline onClose={() => setSection('products')} />
            </div>
          </main>
        </div>
      )}
    </AdminShell>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-dark font-bai">Loading…</span>
        </div>
      </div>
    }>
      <PageInner />
    </Suspense>
  )
}
