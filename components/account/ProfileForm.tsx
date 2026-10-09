'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { authFetch } from '@/lib/supabaseClient'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

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
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

/** Profile: account info + editable phone, GST, billing address. Admins can
 * also edit their own name, company and email (email also changes sign-in). */
export default function ProfileForm() {
  const { toast } = useToast()
  const { refreshUser } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  const [name, setName]       = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [gst, setGst]         = useState('')
  const [address, setAddress] = useState('')

  const fill = (p: Profile) => {
    setProfile(p)
    setName(p.name); setCompany(p.company ?? ''); setEmail(p.email)
    setPhone(p.phone ?? ''); setGst(p.gstNumber ?? ''); setAddress(p.billingAddress ?? '')
  }

  useEffect(() => {
    authFetch('/api/my/profile')
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not load your profile')
        fill(data)
      })
      .catch(err => setError(err.message))
  }, [])

  const isAdmin    = profile?.role === 'admin'
  const gstValue   = gst.trim().toUpperCase()
  const gstInvalid = gstValue !== '' && !GST_PATTERN.test(gstValue)
  const emailValue = email.trim().toLowerCase()
  const emailInvalid = isAdmin && !EMAIL_PATTERN.test(emailValue)
  const nameInvalid  = isAdmin && !name.trim()
  const emailChanged = !!profile && emailValue !== profile.email.toLowerCase()

  const changes: Record<string, string> = {}
  if (profile) {
    if (phone.trim() !== (profile.phone ?? '')) changes.phone = phone.trim()
    if (gstValue !== (profile.gstNumber ?? '')) changes.gstNumber = gstValue
    if (address.trim() !== (profile.billingAddress ?? '')) changes.billingAddress = address.trim()
    if (isAdmin) {
      if (name.trim() !== profile.name) changes.name = name.trim()
      if (company.trim() !== (profile.company ?? '')) changes.company = company.trim()
      if (emailChanged) changes.email = emailValue
    }
  }
  const dirty = Object.keys(changes).length > 0
  const invalid = gstInvalid || emailInvalid || nameInvalid

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (invalid || !dirty) return
    if (changes.email && !confirm(`Change your sign-in email to ${changes.email}? You'll use it to sign in and receive password-reset emails.`)) return
    setSaving(true); setError('')
    try {
      const res  = await authFetch('/api/my/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not save'); return }
      fill(data)
      await refreshUser()   // name/initials shown in the header & side panel
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
  const badCls   = 'border-red-400 focus:border-red-400 focus:ring-red-100'
  const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-dark font-pop'

  return (
    <form onSubmit={save} className="space-y-4">
      {/* Account */}
      <div className="rounded-2xl border border-gray-mid bg-white p-5 shadow-card">
        <h3 className="mb-3 text-sm font-bold font-bai text-foreground">Account</h3>

        {isAdmin && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={100}
                className={`${inputCls} ${nameInvalid ? badCls : ''}`} />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} maxLength={150}
                placeholder="e.g. LEDLUM Lighting" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Email <span className="normal-case font-normal">(sign-in &amp; password reset)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={`${inputCls} ${emailInvalid ? badCls : ''}`} />
              {emailInvalid && <p className="mt-1 text-[11px] text-red-500 font-pop">Enter a valid email address</p>}
              {emailChanged && !emailInvalid && (
                <p className="mt-1 text-[11px] text-amber-700 font-pop">You&apos;ll sign in with this email after saving.</p>
              )}
            </div>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm font-pop sm:grid-cols-2">
          {([
            ...(!isAdmin ? [['Name', profile.name], ['Company', profile.company || '—'], ['Email', profile.email]] as const : []),
            ['Username', `@${profile.username}`],
            ['Role', profile.role],
            ['Member since', fmtDate(profile.createdAt)],
            ['Last sign-in', fmtDate(profile.lastLoginAt)],
          ] as const).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-gray-dark">{k}</dt>
              <dd className={`break-words font-semibold text-foreground ${k === 'Role' ? 'capitalize' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>
        {!isAdmin && (
          <p className="mt-3 text-[11px] text-gray-dark font-pop">To change your name, company or email, contact your LEDLUM representative.</p>
        )}
      </div>

      {/* Contact & billing */}
      <div className="space-y-3 rounded-2xl border border-gray-mid bg-white p-5 shadow-card">
        <h3 className="text-sm font-bold font-bai text-foreground">Contact &amp; billing</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>GST number</label>
            <input type="text" value={gst} onChange={e => setGst(e.target.value)} maxLength={15} placeholder="e.g. 33ABCDE1234F1Z5"
              className={`${inputCls} uppercase placeholder:normal-case ${gstInvalid ? badCls : ''}`} />
            {gstInvalid && <p className="mt-1 text-[11px] text-red-500 font-pop">GST number should be 15 characters, like 33ABCDE1234F1Z5</p>}
          </div>
        </div>
        <div>
          <label className={labelCls}>Billing address</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} maxLength={1000}
            placeholder="Company name, street, city, state, PIN" className={`${inputCls} resize-none`} />
        </div>
      </div>

      {error && <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-pop">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={!dirty || invalid || saving}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold font-bai text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
