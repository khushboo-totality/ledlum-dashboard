'use client'

import { useState, type FormEvent } from 'react'
import { authFetch } from '@/lib/supabaseClient'
import { useToast } from '@/context/ToastContext'

const MIN_LENGTH = 8

/** My Account → Password: change password while signed in. */
export default function ChangePassword() {
  const { toast } = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow]       = useState(false)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!current) { setError('Enter your current password.'); return }
    if (next.length < MIN_LENGTH) { setError(`New password must be at least ${MIN_LENGTH} characters.`); return }
    if (next !== confirm) { setError("New passwords don't match."); return }
    setSaving(true); setError('')
    try {
      const res  = await authFetch('/api/my/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not change password'); return }
      setCurrent(''); setNext(''); setConfirm('')
      toast('Password changed', 'success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-mid bg-white px-3 py-2.5 text-sm font-bai text-foreground outline-none placeholder:text-gray-dark focus:border-primary focus:ring-2 focus:ring-primary/10'
  const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-dark font-pop'
  const type = show ? 'text' : 'password'

  return (
    <form onSubmit={submit} className="max-w-md space-y-3 rounded-2xl border border-gray-mid bg-white p-5 shadow-card">
      <h3 className="text-sm font-bold font-bai text-foreground">Change password</h3>
      <div>
        <label className={labelCls}>Current password</label>
        <input type={type} value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>New password</label>
        <input type={type} value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password"
          placeholder={`At least ${MIN_LENGTH} characters`} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Confirm new password</label>
        <input type={type} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" className={inputCls} />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-text font-pop">
        <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} className="h-3.5 w-3.5" />
        Show passwords
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 font-pop">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold font-bai text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  )
}
