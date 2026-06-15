'use client'

import { useState, KeyboardEvent, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import LedlumLogo from './LedlumLogo'
import Image from 'next/image'

type AuthTab = 'admin' | 'vendor' | 'guest'

const CAROUSEL_IMAGES = [
  { src: '/home-bg.png',    alt: 'LEDLUM lighting ambiance'    },
  { src: '/home-bg1.jpeg',  alt: 'Architectural lighting'      },
  { src: '/home-bg2.jpeg',  alt: 'Interior product showcase'   },
  { src: '/home-bg3.jpeg',  alt: 'Outdoor lighting collection' },
]

export default function AuthScreen() {
  const { login, loginAsGuest } = useAuth()
  const [tab, setTab]           = useState<AuthTab>('guest')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [current, setCurrent]   = useState(0)
  const [fading, setFading]     = useState(false)

  // Auto-advance every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent(i => (i + 1) % CAROUSEL_IMAGES.length)
        setFading(false)
      }, 400)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const goTo = (idx: number) => {
    if (idx === current) return
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 400)
  }

  const handleLogin = () => {
    const ok = login(username.trim(), password)
    if (!ok) {
      setError('Invalid username or password.')
      setTimeout(() => setError(''), 3000)
    }
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') handleLogin() }

  const inputCls = `
    w-full bg-white rounded-2xl px-5 py-4 text-sm font-bai text-foreground
    placeholder:text-gray-400 outline-none shadow-sm
    focus:ring-2 focus:ring-primary/20 transition-all border-0
  `

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary p-6 font-bai">

      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: '560px' }}>

        {/* LEFT — form panel */}
        <div className="flex-1 bg-[#f2f0ec] flex items-center justify-center p-12 overflow-y-auto">
          <div className="w-full max-w-[360px]">

            <LedlumLogo className="w-28 mb-8" />

            <h1 className="text-3xl font-extrabold text-foreground mb-1 leading-tight">
              Create account
            </h1>
            <p className="text-sm text-gray-400 font-pop mb-8">
              Let's get started with your LEDLUM catalog
            </p>

            {/* Tabs */}
            <div className="flex bg-[#e8e4de] rounded-xl p-1 mb-6 gap-1">
              {([
                { key: 'vendor', label: 'Vendor'     },
                { key: 'guest',  label: 'Guest View' },
                { key: 'admin',  label: 'Admin'      },
              ] as { key: AuthTab; label: string }[]).map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setUsername(''); setPassword(''); setError('') }}
                  className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all font-bai ${
                    tab === t.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-400 hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Guest */}
            {tab === 'guest' && (
              <div>
                <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm">
                  <p className="text-sm text-gray-400 font-pop leading-relaxed">
                    Browse all products without an account.<br />
                    View-only — no editing or quotes.
                  </p>
                </div>
                <button
                  onClick={loginAsGuest}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-4 rounded-2xl font-bai text-sm tracking-wide transition-colors"
                >
                  Browse as Guest
                </button>
              </div>
            )}

            {/* Vendor / Admin */}
            {tab !== 'guest' && (
              <div className="space-y-3">

                {tab === 'vendor' && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl px-4 py-3 mb-1">
                    <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wide">Vendor Access</p>
                    <p className="text-xs text-amber-600 mt-0.5">Browse products &amp; send quote requests.</p>
                  </div>
                )}

                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={tab === 'vendor' ? 'Username (e.g. vendor1)' : 'Username (e.g. admin)'}
                  autoComplete="username"
                  className={inputCls}
                />

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Password"
                    autoComplete="current-password"
                    className={inputCls + ' pr-12'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/>
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-pop bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
                )}

                <button
                  onClick={handleLogin}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-4 rounded-2xl font-bai text-sm tracking-wide transition-colors"
                >
                  Sign in
                </button>

                <p className="text-center text-xs text-gray-400 font-pop pt-1">
                  Already have an account?{' '}
                  <span className="text-primary font-bold cursor-pointer hover:underline">Login</span>
                </p>

                <div className="flex gap-3 justify-center pt-2">
                  <button className="p-2 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
  <svg
    className="w-8 h-8"
    viewBox="0 0 24 24"
    fill="none"
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="5"
      stroke="url(#ig-gradient)"
      strokeWidth="2"
    />
    <circle
      cx="12"
      cy="12"
      r="4"
      stroke="url(#ig-gradient)"
      strokeWidth="2"
    />
    <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig-gradient)" />

    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f58529" />
        <stop offset="25%" stopColor="#dd2a7b" />
        <stop offset="50%" stopColor="#8134af" />
        <stop offset="75%" stopColor="#515bd4" />
        <stop offset="100%" stopColor="#feda77" />
      </linearGradient>
    </defs>
  </svg>
</button>
                  <button className="p-2 bg-[#0A66C2] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
  <svg
    className="w-8 h-8"
    viewBox="0 0 24 24"
    fill="white"
  >
    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6 1.11 6 0 4.88 0 3.5 0 2.12 1.11 1 2.49 1 3.87 1 4.98 2.12 4.98 3.5zM.5 8h4v12h-4V8zm7 0h3.8v1.7h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V20h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V20h-4V8z"/>
  </svg>
</button>
                  <button className="p-2 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* RIGHT — carousel panel */}
        <div className="hidden lg:block w-[52%] relative overflow-hidden">

          {/* Images — all stacked, opacity transition */}
          {CAROUSEL_IMAGES.map((img, idx) => (
            <div
              key={img.src}
              className="absolute inset-0 transition-opacity duration-500 ease-in-out"
              style={{ opacity: idx === current && !fading ? 1 : idx === current ? 0 : 0 }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover object-center"
                priority={idx === 0}
              />
            </div>
          ))}

          {/* Subtle dark gradient at bottom for dots readability */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent z-10" />

          {/* Dot indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {CAROUSEL_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`transition-all duration-300 rounded-full bg-white ${
                  idx === current
                    ? 'w-6 h-2 opacity-100'
                    : 'w-2 h-2 opacity-50 hover:opacity-75'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </div>
  )
}