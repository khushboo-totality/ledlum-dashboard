'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { authFetch } from '@/lib/supabaseClient'

interface PartnerRecord {
  username: string
  name: string
  company: string
  email: string
  initials: string
  createdAt: string
  createdBy: string | null
  invitedAt: string | null
  lastLoginAt: string | null
  passwordChangedAt: string | null
}

interface ActivityRow {
  id: number
  event: string
  details: Record<string, unknown>
  actor: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

/** Result banner after creating a partner / resending an invite. */
interface InviteNotice {
  username: string
  email: string
  sent: boolean
  error?: string
  inviteLink?: string
}

const EVENT_LABELS: Record<string, string> = {
  account_created:         'Account created',
  invite_sent:             'Invite email sent',
  invite_resent:           'Invite re-sent',
  invite_accepted:         'Accepted invite (set password)',
  password_reset_requested:'Requested password reset',
  password_reset:          'Reset password',
  invite_failed:           'Invite email failed',
  account_deleted:         'Account deleted',
  login:                   'Signed in',
  login_failed:            'Failed sign-in attempt',
  logout:                  'Signed out',
  password_changed:        'Changed password',
  password_change_skipped: 'Skipped password change',
  product_viewed:          'Viewed product',
  quote_item_added:        'Added to quote',
  quote_item_removed:      'Removed from quote',
  quote_sent:              'Sent quote request',
  quote_failed:            'Quote request failed to send',
  profile_updated:         'Updated profile',
  settings_updated:        'Changed settings',
  quote_copied:            'Copied quote',
  boq_downloaded:          'Downloaded BOQ PDF',
}

/** One-line summary of an event's details for the history list. */
function describeDetails(row: ActivityRow): string {
  const d = row.details ?? {}
  if (typeof d.productCode === 'string') {
    return d.quantity ? `${d.productCode} × ${d.quantity}` : d.productCode
  }
  if (Array.isArray(d.items)) {
    const items = d.items as { productCode: string; quantity: number }[]
    return items.map(i => `${i.productCode} × ${i.quantity}`).join(', ')
  }
  if (typeof d.error === 'string') return d.error
  if (typeof d.reason === 'string') return d.reason
  if (typeof d.email === 'string') return d.email
  return ''
}

interface PartnerManagerProps {
  isOpen: boolean
  onClose: () => void
  /** Render as an in-page section (admin sidebar "Partners") instead of a
   * portaled modal — no backdrop, no close button, no Escape handler. */
  inline?: boolean
}

const AVATAR_COLORS = ['#9a8c66', '#7a6e4e', '#b5a882', '#8a7d56', '#c4b896']

export default function PartnerManager({ isOpen, onClose, inline = false }: PartnerManagerProps) {
  const [partners, setPartners]   = useState<PartnerRecord[]>([])
  const [loading, setLoading]   = useState(false)
  const [view, setView]         = useState<'list' | 'create' | 'history'>('list')
  const [notice, setNotice]     = useState<InviteNotice | null>(null)
  const [resending, setResending] = useState<string | null>(null)
  const [historyFor, setHistoryFor] = useState<PartnerRecord | null>(null)
  const [history, setHistory]   = useState<ActivityRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [username, setUsername] = useState('')
  const [name, setName]         = useState('')
  const [company, setCompany]   = useState('')
  const [email, setEmail]       = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)

  const fetchPartners = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await authFetch('/api/partners')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load partners'); setPartners([]); return }
      setPartners(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) { fetchPartners(); setView('list') }
  }, [isOpen, fetchPartners])

  useEffect(() => {
    if (inline) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, inline])

  const resetForm = () => {
    setUsername(''); setName(''); setCompany(''); setEmail(''); setError('')
  }

  const handleCreate = async () => {
    if (!username || !name || !company || !email) {
      setError('Name, company, email and username are required'); return
    }
    setCreating(true); setError('')
    try {
      const res  = await authFetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, company, email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create partner'); return }
      setCopied(false)
      setNotice({
        username: data.partner.username, email: data.partner.email,
        sent: data.inviteSent, error: data.inviteError ?? undefined, inviteLink: data.inviteLink,
      })
      await fetchPartners()
      resetForm()
      setView('list')
    } finally {
      setCreating(false)
    }
  }

  const handleResend = async (p: PartnerRecord) => {
    if (!confirm(`Email ${p.name} a new link to set their password?`)) return
    setResending(p.username)
    try {
      const res  = await authFetch(`/api/partners/${encodeURIComponent(p.username)}/resend-invite`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(data.error ?? 'Failed to resend invite'); return }
      setCopied(false)
      setNotice({
        username: p.username, email: p.email,
        sent: data.inviteSent, error: data.inviteError ?? undefined, inviteLink: data.inviteLink,
      })
      await fetchPartners()
    } finally {
      setResending(null)
    }
  }

  const loadHistory = async (username: string) => {
    setHistoryLoading(true)
    try {
      const res  = await authFetch(`/api/activity?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      if (res.ok) setHistory(data)
      else setError(data.error ?? 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const openHistory = async (p: PartnerRecord) => {
    setHistoryFor(p); setView('history'); setHistory([])
    await loadHistory(p.username)
  }

  // Re-fetch the partner list (statuses, last login) and, on the history
  // view, that partner's activity — without reloading the page.
  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = async () => {
    setRefreshing(true); setError('')
    try {
      const res  = await authFetch('/api/partners')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load partners'); return }
      setPartners(data)
      if (view === 'history' && historyFor) {
        const updated = (data as PartnerRecord[]).find(p => p.username === historyFor.username)
        if (updated) setHistoryFor(updated)
        await loadHistory(historyFor.username)
      }
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (partnerUsername: string) => {
    if (!confirm(`Delete partner "${partnerUsername}"? They will immediately lose access.`)) return
    const res = await authFetch(`/api/partners/${encodeURIComponent(partnerUsername)}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Failed to delete partner')
    }
    await fetchPartners()
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtTime = (d: string) =>
    new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const inputCls =
    'w-full border border-gray-mid rounded-lg px-4 py-2.5 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white'

  // ── KEY FIX: render nothing at all when closed ──
  if (!isOpen) return null

  const card = (
        <div
          className={inline
            ? 'bg-white rounded-2xl w-full shadow-card border border-white/80 flex flex-col overflow-hidden'
            : 'bg-white rounded-2xl w-full max-w-2xl shadow-modal pointer-events-auto flex flex-col max-h-[85vh] overflow-hidden animate-fade-in'}
          onClick={e => e.stopPropagation()}
        >
          {/* Gold top bar */}
          <div className="h-1 bg-gradient-to-r from-primary to-primary-dark rounded-t-2xl flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold font-bai text-foreground flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Partner Management
              </h2>
              <p className="text-xs text-gray-text font-pop mt-0.5">
                {partners.length} partner{partners.length !== 1 ? 's' : ''} · Admin only
              </p>
            </div>
            <div className="flex items-center gap-2">
              {view !== 'create' && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  title="Refresh"
                  aria-label="Refresh"
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary disabled:opacity-60 transition-colors"
                >
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                    className={refreshing ? 'animate-spin' : ''}
                  >
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
              {view === 'list' && (
                <button
                  onClick={() => { setView('create'); resetForm() }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold font-bai transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Partner
                </button>
              )}
              {!inline && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* LIST VIEW */}
            {view === 'list' && (
              <div className="p-7">
                {error && (
                  <p className="mb-4 text-sm text-primary font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>
                )}
                {notice && (
                  <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-pop ${
                    notice.sent ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {notice.sent ? (
                          <p>Invite sent to <strong>{notice.email}</strong>. They&apos;ll choose their password from the link in the email.</p>
                        ) : (
                          <>
                            <p>
                              Account <strong>@{notice.username}</strong> is ready, but the invite email could not be sent
                              {notice.error ? <> ({notice.error})</> : null}. Send them this invite link yourself (valid 7 days):
                            </p>
                            {notice.inviteLink && (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  readOnly
                                  value={notice.inviteLink}
                                  onFocus={e => e.currentTarget.select()}
                                  className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1 font-mono text-xs text-foreground"
                                />
                                <button
                                  onClick={() => { navigator.clipboard.writeText(notice.inviteLink!); setCopied(true) }}
                                  className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700"
                                >
                                  {copied ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <button onClick={() => setNotice(null)} className="text-xs opacity-60 hover:opacity-100" aria-label="Dismiss">✕</button>
                    </div>
                  </div>
                )}
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : partners.length === 0 ? (
                  <div className="text-center py-16">
                    <svg className="opacity-10 mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <p className="text-gray-dark font-bai text-sm">No partners yet</p>
                    <p className="text-gray-dark text-xs font-pop mt-1">Create your first partner account above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partners.map((v, i) => (
                      <div
                        key={v.username}
                        className="flex items-center gap-4 bg-gray rounded-xl px-5 py-4 border border-gray-mid hover:border-primary/30 transition-colors group"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold font-bai flex-shrink-0"
                          style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                        >
                          {v.initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm font-bai text-foreground">{v.name}</span>
                            {v.passwordChangedAt || v.lastLoginAt ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide font-pop bg-green-50 text-green-700 border border-green-200">
                                active
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide font-pop bg-amber-50 text-amber-700 border border-amber-200">
                                {v.invitedAt ? 'invited' : 'invite not sent'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-text font-pop truncate">{v.company}</p>
                          <p className="text-xs text-gray-dark font-pop">{v.email}</p>
                        </div>

                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-xs font-mono text-foreground font-semibold">@{v.username}</p>
                          <p className="text-[10px] text-gray-dark font-pop mt-0.5">Created {fmt(v.createdAt)}</p>
                          <p className="text-[10px] text-gray-dark font-pop">
                            {v.lastLoginAt ? `Last login ${fmtTime(v.lastLoginAt)}` : 'Never signed in'}
                          </p>
                        </div>

                        <button
                          onClick={() => openHistory(v)}
                          className="w-8 h-8 rounded-full border border-gray-mid flex items-center justify-center text-gray-text hover:bg-primary hover:text-white hover:border-primary transition-colors flex-shrink-0"
                          title="View history"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </button>

                        <button
                          onClick={() => handleResend(v)}
                          disabled={resending === v.username}
                          className="w-8 h-8 rounded-full border border-gray-mid flex items-center justify-center text-gray-text hover:bg-primary hover:text-white hover:border-primary disabled:opacity-50 transition-colors flex-shrink-0"
                          title="Resend invite (new set-password link)"
                        >
                          {resending === v.username ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                              <polyline points="22,6 12,13 2,6"/>
                            </svg>
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(v.username)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary flex-shrink-0"
                          title="Delete partner"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HISTORY VIEW */}
            {view === 'history' && historyFor && (
              <div className="p-7">
                <button
                  onClick={() => { setView('list'); setHistoryFor(null); setError('') }}
                  className="mb-4 text-xs font-semibold font-bai text-gray-text hover:text-primary"
                >
                  ← All partners
                </button>

                <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-gray-mid bg-gray px-5 py-4 text-xs font-pop sm:grid-cols-3">
                  <div><p className="text-gray-dark">Partner</p><p className="font-semibold text-foreground">{historyFor.name}</p></div>
                  <div><p className="text-gray-dark">Company</p><p className="font-semibold text-foreground">{historyFor.company}</p></div>
                  <div><p className="text-gray-dark">Username</p><p className="font-mono font-semibold text-foreground">@{historyFor.username}</p></div>
                  <div><p className="text-gray-dark">Email</p><p className="font-semibold text-foreground break-all">{historyFor.email}</p></div>
                  <div><p className="text-gray-dark">Created</p><p className="font-semibold text-foreground">{fmtTime(historyFor.createdAt)}{historyFor.createdBy ? ` by ${historyFor.createdBy}` : ''}</p></div>
                  <div><p className="text-gray-dark">Last login</p><p className="font-semibold text-foreground">{historyFor.lastLoginAt ? fmtTime(historyFor.lastLoginAt) : 'Never'}</p></div>
                  <div><p className="text-gray-dark">Password</p><p className="font-semibold text-foreground">
                    {historyFor.passwordChangedAt ? `Set ${fmtTime(historyFor.passwordChangedAt)}` : 'Not set yet (invite pending)'}
                  </p></div>
                </div>

                {error && (
                  <p className="mb-4 text-sm text-primary font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>
                )}

                {historyLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-dark font-bai">No activity recorded yet</p>
                ) : (
                  <ol className="relative border-l border-gray-mid ml-2 space-y-4">
                    {history.map(row => {
                      const detail = describeDetails(row)
                      const isAdminAction = row.actor && row.actor !== historyFor.username
                      return (
                        <li key={row.id} className="ml-5">
                          <span className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                            row.event === 'login_failed' || row.event === 'invite_failed' || row.event === 'account_deleted'
                              ? 'bg-red-400' : 'bg-primary'
                          }`} />
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <p className="text-sm font-semibold font-bai text-foreground">
                              {EVENT_LABELS[row.event] ?? row.event}
                            </p>
                            <time className="text-[11px] text-gray-dark font-pop">{fmtTime(row.created_at)}</time>
                          </div>
                          {detail && <p className="mt-0.5 text-xs text-gray-text font-pop break-words">{detail}</p>}
                          <p className="mt-0.5 text-[10px] text-gray-dark font-pop">
                            {isAdminAction ? `by ${row.actor}` : null}
                            {isAdminAction && row.ip ? ' · ' : null}
                            {row.ip ? `IP ${row.ip}` : null}
                          </p>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            )}

            {/* CREATE VIEW */}
            {view === 'create' && (
              <div className="p-7 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                      Partner Name <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Acme Lighting" className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                      Company <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text" value={company} onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Acme Lighting Co." className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="orders@partner.com" className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                    Username <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="e.g. acmelighting"
                    className={inputCls}
                  />
                </div>

                <p className="text-xs text-gray-dark font-pop">
                  An invite email is sent to the address above with a link (valid 7 days) for them to choose
                  their own password and activate the account.
                </p>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-primary font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                {name && username && (
                  <div className="bg-secondary/40 border border-primary/15 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-gray-dark uppercase tracking-widest font-pop mb-2">Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold font-bai">
                        {name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-sm font-bai text-foreground">{name}</p>
                        <p className="text-xs text-gray-text font-pop">{company || '—'} · @{username}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer — create view only */}
          {view === 'create' && (
            <div className="px-7 py-4 border-t border-gray bg-gray flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => { setView('list'); resetForm() }}
                className="px-5 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground hover:text-foreground transition-colors bg-white"
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Create &amp; Send Invite
                  </>
                )}
              </button>
            </div>
          )}
        </div>
  )

  if (inline) return card

  return createPortal(
    <>
      {/* Backdrop — clicks close the modal */}
      <div
        className="fixed inset-0 z-[70] bg-black/40"
        onClick={onClose}
      />

      {/* Modal — centred, above backdrop */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-5 pointer-events-none">
        {card}
      </div>
    </>,
    document.body
  )
}
