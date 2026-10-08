'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { authFetch } from '@/lib/supabaseClient'
import { useToast } from '@/context/ToastContext'

interface Profile {
  username: string
  name: string
  company: string | null
  email: string
  role: string
  createdAt: string
  lastLoginAt: string | null
  phone: string | null
  gstNumber: string | null
  billingAddress: string | null
}

const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

/** My Account → Profile: account info (read-only) + editable phone, GST, billing address. */
export default function ProfileForm() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  const [phone, setPhone]     = useState('')
  const [gst, setGst]         = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    authFetch('/api/my/profile')
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not load your profile')
        setProfile(data)
        setPhone(data.phone ?? ''); setGst(data.gstNumber ?? ''); setAddress(data.billingAddress ?? '')
      })
      .catch(err => setError(err.message))
  }, [])

  const gstValue   = gst.trim().toUpperCase()
  const gstInvalid = gstValue !== '' && !GST_PATTERN.test(gstValue)
  const dirty = !!profile && (
    phone.trim() !== (profile.phone ?? '') || gstValue !== (profile.gstNumber ?? '') || address.trim() !== (profile.billingAddress ?? '')
  )

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (gstInvalid || !dirty) return
    setSaving(true); setError('')
    try {
      const res  = await authFetch('/api/my/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), gstNumber: gstValue, billingAddress: address.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not save'); return }
      setProfile(data)
      setPhone(data.phone ?? ''); setGst(data.gstNumber ?? ''); setAddress(data.billingAddress ?? '')
      toast('Profile updated', 'success')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return error
      ? <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-pop">{error}</p>
      : <div className="flex justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  }

  const inputCls = 'w-full rounded-lg border border-gray-mid bg-white px-3 py-2.5 text-sm font-bai text-foreground outline-none placeholder:text-gray-dark focus:border-primary focus:ring-2 focus:ring-primary/10'
  const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-dark font-pop'

  return (
    <div className="space-y-4">
      {/* Account (managed by LEDLUM) */}
      <div className="rounded-2xl border border-gray-mid bg-white p-5 shadow-card">
        <h3 className="mb-3 text-sm font-bold font-bai text-foreground">Account</h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm font-pop sm:grid-cols-2">
          {([
            ['Name', profile.name],
            ['Company', profile.company || '—'],
            ['Email', profile.email],
            ['Username', `@${profile.username}`],
            ['Member since', fmtDate(profile.createdAt)],
            ['Last sign-in', fmtDate(profile.lastLoginAt)],
          ] as const).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-gray-dark">{k}</dt>
              <dd className="break-words font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-gray-dark font-pop">To change your name, company or email, contact your LEDLUM representative.</p>
      </div>

      {/* Editable contact & billing details */}
      <form onSubmit={save} className="rounded-2xl border border-gray-mid bg-white p-5 shadow-card space-y-3">
        <h3 className="text-sm font-bold font-bai text-foreground">Contact &amp; billing</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>GST number</label>
            <input type="text" value={gst} onChange={e => setGst(e.target.value)} maxLength={15} placeholder="e.g. 33ABCDE1234F1Z5"
              className={`${inputCls} uppercase placeholder:normal-case ${gstInvalid ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`} />
            {gstInvalid && <p className="mt-1 text-[11px] text-red-500 font-pop">GST number should be 15 characters, like 33ABCDE1234F1Z5</p>}
          </div>
        </div>
        <div>
          <label className={labelCls}>Billing address</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} maxLength={1000}
            placeholder="Company name, street, city, state, PIN" className={`${inputCls} resize-none`} />
        </div>

        {error && <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-pop">{error}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={!dirty || gstInvalid || saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold font-bai text-white hover:bg-primary-dark disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
