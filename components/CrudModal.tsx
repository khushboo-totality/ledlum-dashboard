'use client'

import { useState, useEffect } from 'react'
import type { Product, ProductFormData } from '@/types'
import { ZONES, getZoneById } from '@/lib/zones'

interface CrudModalProps {
  mode: 'create' | 'edit' | null
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  onClose: () => void
  currentZone?: string
}

export default function CrudModal({ mode, product, onSubmit, onClose, currentZone }: CrudModalProps) {
  const [codes, setCodes]     = useState('')
  const [cat, setCat]         = useState('Floor')
  const [imgLink, setImg]     = useState('')
  const [zone, setZone]       = useState(currentZone || 'zone-a')
  const [loading, setLoading] = useState(false)
  const isOpen = mode !== null

  useEffect(() => {
    if (mode === 'edit' && product) {
      setCodes(product.Codes); setCat(product.Category)
      setImg(product.ImageLink); setZone(product.zone)
    } else if (mode === 'create') {
      setCodes(''); setCat('Floor'); setImg('')
      setZone(currentZone || 'zone-a')
    }
  }, [mode, product, currentZone])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleSubmit = async () => {
    if (!codes.trim()) return
    setLoading(true)
    try {
      await onSubmit({ Codes: codes.trim(), Category: cat.trim() || 'Uncategorized', ImageLink: imgLink.trim(), zone })
      onClose()
    } finally { setLoading(false) }
  }

  const inputCls = "w-full border border-gray-mid rounded-lg px-4 py-2.5 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"

  const zoneLabel = getZoneById(currentZone || '')?.label

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 transition-all duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-2xl w-full max-w-md shadow-modal transition-all duration-200 overflow-hidden ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.97]'}`}>
        {/* Red top bar */}
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />

        {/* Header */}
        <div className="px-7 pt-6 pb-4 flex items-start justify-between border-b border-gray">
          <div>
            <h3 className="text-xl font-bold font-bai text-foreground">
              {mode === 'create' ? 'Add New Product' : 'Edit Product'}
            </h3>
            <p className="text-xs text-gray-text font-pop mt-0.5">
              {mode === 'create'
                ? zoneLabel ? `Adding to ${zoneLabel}` : 'Fill in the details below'
                : `Editing ${product?.Codes} · ${getZoneById(product?.zone || '')?.label ?? ''}`
              }
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm">
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="px-7 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
              Product Code <span className="text-primary">*</span>
            </label>
            <input type="text" value={codes} onChange={e => setCodes(e.target.value)}
              placeholder="e.g. LB-999" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Category</label>
            <input type="text" value={cat} onChange={e => setCat(e.target.value)}
              placeholder="e.g. Floor, Wall, Ceiling" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Image Link</label>
            <input type="text" value={imgLink} onChange={e => setImg(e.target.value)}
              placeholder="https:// or Google Drive URL" className={inputCls} />
          </div>

          {/* Zone selector — shows when no zone active OR editing */}
          {(!currentZone || mode === 'edit') && (
            <div>
              <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Zone</label>
              <div className="relative">
                <select value={zone} onChange={e => setZone(e.target.value)}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                  {ZONES.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}
        </div>

        {/* Zone badge — show current zone when creating in a specific zone */}
        {mode === 'create' && currentZone && (
          <div className="px-7 pb-2">
            <div className="flex items-center gap-2 text-xs text-primary font-pop bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Will be added to <strong className="ml-1">{getZoneById(currentZone)?.label}</strong>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-7 py-4 bg-gray border-t border-gray-mid flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground hover:text-foreground transition-colors bg-white">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!codes.trim() || loading}
            className="px-6 py-2.5 bg-primary hover:bg-secondary disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors">
            {loading ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
