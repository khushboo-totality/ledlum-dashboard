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
                  <button className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button className="p-3 bg-[#1c1a17] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </button>
                  <button className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
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