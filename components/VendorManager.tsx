'use client'

import { useState, useEffect, useCallback } from 'react'

interface VendorRecord {
  username: string
  password: string
  name: string
  company: string
  email: string
  initials: string
  createdAt: string
}

interface VendorManagerProps {
  isOpen: boolean
  onClose: () => void
}

const AVATAR_COLORS = ['#9a8c66', '#7a6e4e', '#b5a882', '#8a7d56', '#c4b896']

export default function VendorManager({ isOpen, onClose }: VendorManagerProps) {
  const [vendors, setVendors]   = useState<VendorRecord[]>([])
  const [loading, setLoading]   = useState(false)
  const [view, setView]         = useState<'list' | 'create'>('list')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [company, setCompany]   = useState('')
  const [email, setEmail]       = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/vendors')
      const data = await res.json()
      setVendors(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) { fetchVendors(); setView('list') }
  }, [isOpen, fetchVendors])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const resetForm = () => {
    setUsername(''); setPassword(''); setName(''); setCompany(''); setEmail(''); setError('')
  }

  const handleCreate = async () => {
    if (!username || !password || !name || !company || !email) {
      setError('All fields are required'); return
    }
    setCreating(true); setError('')
    try {
      const res  = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, company, email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create vendor'); return }
      await fetchVendors()
      resetForm()
      setView('list')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (vendorUsername: string) => {
    if (!confirm(`Delete vendor "${vendorUsername}"? They will immediately lose access.`)) return
    await fetch(`/api/vendors/${vendorUsername}`, { method: 'DELETE' })
    await fetchVendors()
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const inputCls =
    'w-full border border-gray-mid rounded-lg px-4 py-2.5 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white'

  // ── KEY FIX: render nothing at all when closed ──
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop — clicks close the modal */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />

      {/* Modal — centred, above backdrop, stops click propagation */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none">
        <div
          className="bg-white rounded-2xl w-full max-w-2xl shadow-modal pointer-events-auto flex flex-col max-h-[85vh] overflow-hidden animate-fade-in"
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
                Vendor Management
              </h2>
              <p className="text-xs text-gray-text font-pop mt-0.5">
                {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} · Admin only
              </p>
            </div>
            <div className="flex items-center gap-2">
              {view === 'list' && (
                <button
                  onClick={() => { setView('create'); resetForm() }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold font-bai transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Vendor
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* LIST VIEW */}
            {view === 'list' && (
              <div className="p-7">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : vendors.length === 0 ? (
                  <div className="text-center py-16">
                    <svg className="opacity-10 mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <p className="text-gray-dark font-bai text-sm">No vendors yet</p>
                    <p className="text-gray-dark text-xs font-pop mt-1">Create your first vendor account above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendors.map((v, i) => (
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
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide font-pop bg-primary/10 text-primary border border-primary/20">
                              vendor
                            </span>
                          </div>
                          <p className="text-xs text-gray-text font-pop truncate">{v.company}</p>
                          <p className="text-xs text-gray-dark font-pop">{v.email}</p>
                        </div>

                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-xs font-mono text-foreground font-semibold">@{v.username}</p>
                          <p className="text-[10px] text-gray-dark font-pop mt-0.5">Created {fmt(v.createdAt)}</p>
                        </div>

                        <button
                          onClick={() => handleDelete(v.username)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary flex-shrink-0"
                          title="Delete vendor"
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

            {/* CREATE VIEW */}
            {view === 'create' && (
              <div className="p-7 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                      Vendor Name <span className="text-primary">*</span>
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
                    placeholder="orders@vendor.com" className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                      Password <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Set a secure password"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-dark hover:text-foreground transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {showPass ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

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
                    Create Vendor
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
