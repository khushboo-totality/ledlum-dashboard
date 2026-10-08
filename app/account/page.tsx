'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import LedlumLogo from '@/components/LedlumLogo'
import PageSpinner from '@/components/PageSpinner'
import CartDrawer from '@/components/CartDrawer'
import ToastContainer from '@/components/ToastContainer'
import MyQuotes from '@/components/account/MyQuotes'
import ProfileForm from '@/components/account/ProfileForm'
import ChangePassword from '@/components/account/ChangePassword'

type Tab = 'quotes' | 'profile' | 'password'

function AccountInner() {
  const { user, loading, logout, can } = useAuth()
  const { total, openCart } = useCart()
  const router = useRouter()
  const params = useSearchParams()

  const tabs: { id: Tab; label: string }[] = [
    ...(can('cart') ? [{ id: 'quotes' as Tab, label: 'My Quotes' }] : []),
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
  ]
  const requested = params.get('tab') as Tab | null
  const tab: Tab = tabs.some(t => t.id === requested) ? requested! : tabs[0].id
  const setTab = (t: Tab) => router.replace(`/account?tab=${t}`, { scroll: false })

  // Guests and signed-out visitors have no account page.
  useEffect(() => {
    if (!loading && (!user || user.role === 'guest')) router.replace('/')
  }, [loading, user, router])

  if (loading || !user || user.role === 'guest') return <PageSpinner />

  return (
    <div className="min-h-screen app-shell">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/80 px-4 py-3 shadow-header sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to catalogue"><LedlumLogo className="h-10 w-auto" /></Link>
          <div className="hidden h-8 w-px bg-gray-mid sm:block" />
          <Link href="/" className="text-sm font-semibold font-bai text-gray-text hover:text-primary">← Catalogue</Link>
        </div>
        <div className="flex items-center gap-2">
          {can('cart') && (
            <button onClick={openCart}
              className="relative flex items-center gap-2 rounded-xl border border-gray-mid bg-white/80 px-3.5 py-2 text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="hidden sm:inline">Quote</span>
              {total > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {total > 99 ? '99+' : total}
                </span>
              )}
            </button>
          )}
          <button onClick={() => { logout(); router.replace('/') }}
            className="flex items-center gap-1.5 rounded-xl border border-gray-mid bg-white/80 px-3 py-2 text-sm font-semibold text-gray-text hover:border-primary hover:text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white font-bai">
            {user.initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold font-bai text-foreground">My Account</h1>
            <p className="truncate text-sm text-gray-text font-pop">{user.name}{user.company ? ` · ${user.company}` : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-[#ece8e0] p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold font-bai transition-all ${
                tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-gray-text hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'quotes' && <MyQuotes />}
        {tab === 'profile' && <ProfileForm />}
        {tab === 'password' && <ChangePassword />}
      </main>

      {can('cart') && <CartDrawer />}
      <ToastContainer />
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <AccountInner />
    </Suspense>
  )
}
