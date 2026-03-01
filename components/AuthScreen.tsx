'use client'

import { useState, KeyboardEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import LedlumLogo from './LedlumLogo'

type AuthTab = 'admin' | 'vendor' | 'guest'

export default function AuthScreen() {
  const { login, loginAsGuest } = useAuth()
  const [tab, setTab]           = useState<AuthTab>('guest')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleLogin = () => {
    const ok = login(username.trim(), password)
    if (!ok) {
      setError('Invalid username or password.')
      setTimeout(() => setError(''), 3000)
    }
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') handleLogin() }

  const inputCls = "w-full border border-gray-mid rounded-lg px-4 py-3 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"

  return (
    <div className="fixed inset-0 z-50 flex font-bai">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[45%] bg-primary flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-secondary/40" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-black/10" />
        <LedlumLogo white className="w-44 relative z-10" />
        <div className="relative z-10">
          <h2 className="text-white text-5xl font-bold leading-tight mb-4">Product<br />Catalog</h2>
          <p className="text-white/60 text-base font-pop font-light leading-relaxed max-w-xs">
            Manage lighting products and place quote requests — all in one place.
          </p>
          {/* Role badges */}
          {/* <div className="flex flex-col gap-2 mt-8">
            {[
              { role: 'Admin',  desc: 'Full catalog management',      color: 'bg-white/20' },
              { role: 'Vendor', desc: 'Browse products & send quotes', color: 'bg-amber-400/30' },
              { role: 'Viewer', desc: 'Read-only access',             color: 'bg-white/10' },
            ].map(r => (
              <div key={r.role} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${r.color}`}>
                <span className="text-white/90 text-sm font-semibold w-16">{r.role}</span>
                <span className="text-white/50 text-xs font-pop">{r.desc}</span>
              </div>
            ))}
          </div> */}
        </div>
        <p className="text-white/30 text-xs font-pop relative z-10">© {new Date().getFullYear()} LEDLUM. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8"><LedlumLogo className="w-32" /></div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Sign in</h1>
          <p className="text-gray-text text-sm font-pop mb-7">Access the LEDLUM product catalog</p>

          {/* Tabs */}
          <div className="flex bg-gray rounded-lg p-1 mb-6 border border-gray-mid">
            {([
              { key: 'vendor', label: '🛒 Vendor' },
              { key: 'admin',  label: '⚙️ Admin'  },
              { key: 'guest',  label: '👁 View'   },
            ] as { key: AuthTab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2 text-sm rounded-md font-semibold transition-all font-bai ${tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-gray-text hover:text-foreground'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab !== 'guest' ? (
            <div className="space-y-4">
              {tab === 'vendor' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-2">
                  <p className="text-xs font-semibold text-amber-700 font-pop">Vendor Access</p>
                  <p className="text-xs text-amber-600 font-pop mt-0.5">Browse all products and send quote requests by email.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-foreground tracking-wide uppercase mb-1.5 font-pop">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={onKey}
                  placeholder={tab === 'vendor' ? 'e.g. vendor1' : 'e.g. admin'}
                  autoComplete="username" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground tracking-wide uppercase mb-1.5 font-pop">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKey}
                  placeholder="Enter password" autoComplete="current-password" className={inputCls} />
              </div>
              {error && <p className="text-primary text-sm font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={handleLogin}
                className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-lg font-bai text-base tracking-wide transition-colors mt-2">
                Sign In →
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-gray border border-gray-mid rounded-lg p-4 mb-5">
                <p className="text-sm text-gray-text font-pop leading-relaxed">Browse all products without an account. View-only — no editing or quotes.</p>
              </div>
              <button onClick={loginAsGuest}
                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3.5 rounded-lg font-bai text-base tracking-wide transition-all">
                Browse as Guest →
              </button>
            </div>
          )}

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-gray rounded-lg border border-gray-mid">
            <p className="text-xs font-semibold text-gray-dark uppercase tracking-wide mb-3 font-pop">Demo Credentials</p>
            <div className="space-y-2">
              {[
                { user: 'vendor1', pass: 'vendor123', label: 'Vendor — Quote access',   color: 'text-amber-600' },
                { user: 'vendor2', pass: 'vendor456', label: 'Vendor 2',                color: 'text-amber-600' },
                { user: 'admin',   pass: 'admin123',  label: 'Admin — Full access',     color: 'text-primary'   },
                { user: 'editor',  pass: 'edit123',   label: 'Editor — Create & Edit',  color: 'text-blue-600'  },
                { user: 'viewer',  pass: 'view123',   label: 'Viewer — Read only',      color: 'text-gray-dark' },
              ].map(r => (
                <div key={r.user} className="flex items-center gap-2 text-xs font-pop">
                  <span className={`font-semibold w-16 ${r.color}`}>{r.user}</span>
                  <span className="text-gray-dark">/ {r.pass}</span>
                  <span className="ml-auto text-gray-dark truncate">· {r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
