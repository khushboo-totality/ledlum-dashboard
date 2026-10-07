'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LedlumLogo from '@/components/LedlumLogo'

const MIN_LENGTH = 8

interface LinkInfo {
  email: string
  name: string
  username: string
  purpose: 'invite' | 'reset'
}

// Landing page for partner invite and password-reset emails.
function SetPassword() {
  const router = useRouter()
  const { adoptSession } = useAuth()
  const token = useSearchParams().get('token') || ''

  const [info, setInfo]           = useState<LinkInfo | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    fetch(`/api/auth/set-password?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Invalid link')
        setInfo(data)
      })
      .catch(err => setLinkError(err.message))
  }, [token])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_LENGTH) { setError(`Password must be at least ${MIN_LENGTH} characters.`); return }
    if (password !== confirm)         { setError("Passwords don't match."); return }
    setSaving(true); setError('')
    try {
      const res  = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not set password')
      if (data.access_token) {
        const err = await adoptSession(data)
        if (err) throw new Error(err)
      }
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set password')
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-white rounded-2xl px-5 py-4 text-sm font-bai text-foreground placeholder:text-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-primary/20 transition-all border-0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary p-6 font-bai">
      <div className="w-full max-w-md rounded-3xl bg-[#f2f0ec] p-8 shadow-2xl sm:p-10">
        <LedlumLogo className="w-36 mb-7" />

        {linkError ? (
          <>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Link not valid</h1>
            <p className="text-sm text-red-500 font-pop mb-4">{linkError}.</p>
            <p className="text-sm text-gray-400 font-pop mb-6">
              Use &ldquo;Forgot password?&rdquo; on the sign-in page to get a new link, or ask your LEDLUM contact to resend your invite.
            </p>
            <button
              onClick={() => router.replace('/')}
              className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-4 rounded-2xl text-sm tracking-wide transition-colors"
            >
              Go to sign in
            </button>
          </>
        ) : !info ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-foreground mb-1 leading-tight">
              {info.purpose === 'invite' ? `Welcome, ${info.name}` : 'Choose a new password'}
            </h1>
            <p className="text-sm text-gray-400 font-pop mb-7">
              {info.purpose === 'invite' ? 'Choose a password to activate your account. ' : ''}
              You&apos;ll sign in as <span className="font-semibold text-foreground">{info.username}</span> ({info.email}).
            </p>

            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={`Password (min ${MIN_LENGTH} characters)`}
                  autoComplete="new-password"
                  autoFocus
                  className={inputCls + ' pr-16'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                className={inputCls}
              />

              {error && <p className="text-red-500 text-xs font-pop bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-extrabold py-4 rounded-2xl text-sm tracking-wide transition-colors"
              >
                {saving ? 'Saving…' : info.purpose === 'invite' ? 'Activate account' : 'Save password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPassword />
    </Suspense>
  )
}
