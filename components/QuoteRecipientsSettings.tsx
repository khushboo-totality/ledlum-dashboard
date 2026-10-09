'use client'

import { useEffect, useState } from 'react'
import { authFetch } from '@/lib/supabaseClient'
import { useToast } from '@/context/ToastContext'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fmtTime = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Admin → Settings → Quote recipients: who receives partner quote requests. */
export default function QuoteRecipientsSettings() {
  const { toast } = useToast()
  const [saved, setSaved]     = useState<string[]>([])
  const [list, setList]       = useState<string[]>([])
  const [max, setMax]         = useState(10)
  const [meta, setMeta]       = useState<{ updatedAt: string | null; updatedBy: string | null } | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    authFetch('/api/settings')
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not load settings')
        setSaved(data.quoteRecipients); setList(data.quoteRecipients)
        setMax(data.maxQuoteRecipients ?? 10); setMeta(data.quoteRecipientsMeta ?? null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const candidate = newEmail.trim().toLowerCase()
  const candidateInvalid = candidate !== '' && !EMAIL_PATTERN.test(candidate)
  const duplicate = list.includes(candidate)
  const dirty = JSON.stringify(list) !== JSON.stringify(saved)

  const add = () => {
    if (!candidate || candidateInvalid || duplicate || list.length >= max) return
    setList(l => [...l, candidate]); setNewEmail('')
  }
  const remove = (email: string) => setList(l => l.filter(e => e !== email))
  const move = (i: number, dir: -1 | 1) => setList(l => {
    const j = i + dir
    if (j < 0 || j >= l.length) return l
    const next = [...l]; [next[i], next[j]] = [next[j], next[i]]
    return next
  })

  const save = async () => {
    setSaving(true); setError('')
    try {
      const res  = await authFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteRecipients: list }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not save'); return }
      setSaved(data.quoteRecipients); setList(data.quoteRecipients); setMeta(data.quoteRecipientsMeta ?? null)
      toast('Quote recipients saved', 'success')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-bai text-foreground outline-none placeholder:text-gray-dark focus:ring-2'

  return (
    <div className="space-y-4 rounded-2xl border border-gray-mid bg-white p-5 shadow-card">
      <div>
        <h3 className="text-sm font-bold font-bai text-foreground">Quote recipients</h3>
        <p className="mt-0.5 text-xs text-gray-text font-pop">
          Every partner &ldquo;Send Quote Request&rdquo; is emailed to these addresses. The first one is used as the
          reply-to on the partner&apos;s confirmation email.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <>
          <ul className="divide-y divide-gray rounded-xl border border-gray-mid">
            {list.length === 0 && (
              <li className="px-4 py-3 text-sm text-red-500 font-pop">Add at least one address — quote requests need somewhere to go.</li>
            )}
            {list.map((email, i) => (
              <li key={email} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                    className="h-4 w-5 text-[9px] leading-none text-gray-dark hover:text-primary disabled:opacity-25">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === list.length - 1} title="Move down"
                    className="h-4 w-5 text-[9px] leading-none text-gray-dark hover:text-primary disabled:opacity-25">▼</button>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold font-bai text-foreground">{email}</span>
                {i === 0 && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary font-pop">Reply-to</span>
                )}
                <button onClick={() => remove(email)} title="Remove"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-white">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </li>
            ))}
          </ul>

          <div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
                placeholder="Add an email, e.g. sales@ledlumlighting.com"
                disabled={list.length >= max}
                className={`${inputCls} ${candidateInvalid ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-mid focus:border-primary focus:ring-primary/10'}`}
              />
              <button onClick={add} disabled={!candidate || candidateInvalid || duplicate || list.length >= max}
                className="flex-shrink-0 rounded-lg border border-primary/30 px-4 text-sm font-bold font-bai text-primary hover:bg-primary/5 disabled:opacity-40">
                Add
              </button>
            </div>
            {candidateInvalid && <p className="mt-1 text-[11px] text-red-500 font-pop">Enter a valid email address</p>}
            {duplicate && <p className="mt-1 text-[11px] text-amber-700 font-pop">Already in the list</p>}
            {list.length >= max && <p className="mt-1 text-[11px] text-gray-dark font-pop">Maximum {max} recipients</p>}
          </div>

          {error && <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-pop">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-gray-dark font-pop">
              {meta?.updatedAt ? `Last changed ${fmtTime(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ''}` : ''}
            </p>
            <div className="flex gap-2">
              {dirty && (
                <button onClick={() => { setList(saved); setError('') }} disabled={saving}
                  className="rounded-lg border border-gray-mid px-4 py-2 text-sm font-semibold font-bai text-gray-text hover:border-foreground">
                  Undo
                </button>
              )}
              <button onClick={save} disabled={!dirty || list.length === 0 || saving}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-bold font-bai text-white hover:bg-primary-dark disabled:opacity-50">
                {saving ? 'Saving…' : 'Save recipients'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
