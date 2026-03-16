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
  const [step, setStep]       = useState<'zone' | 'details'>('zone')
  const [codes, setCodes]     = useState('')
  const [cat, setCat]         = useState('')
  const [imgLink, setImg]     = useState('')
  const [zone, setZone]       = useState(currentZone || '')
  const [loading, setLoading] = useState(false)
  const isOpen = mode !== null

  // Edit mode skips zone step; create with specific zone also skips
  const skipZoneStep = mode === 'edit' || !!currentZone

  useEffect(() => {
    if (mode === 'edit' && product) {
      setCodes(product.Codes)
      setCat(product.Category)
      setImg(product.ImageLink ?? '')
      setZone(product.zone ?? currentZone ?? '')
      setStep('details')
    } else if (mode === 'create') {
      setCodes(''); setCat(''); setImg('')
      if (currentZone) {
        setZone(currentZone)
        setStep('details')
      } else {
        setZone('')
        setStep('zone')  // Admin creating from All Zones → pick zone first
      }
    }
  }, [mode, product, currentZone])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleSubmit = async () => {
    if (!codes.trim() || !zone) return
    setLoading(true)
    try {
      await onSubmit({
        Codes: codes.trim(),
        Category: cat.trim() || 'Uncategorized',
        ImageLink: imgLink.trim(),
        zone,
      })
      onClose()
    } finally { setLoading(false) }
  }

  const inputCls = "w-full border border-gray-mid rounded-xl px-4 py-3 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"

  const selectedZoneLabel = getZoneById(zone)?.label

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-5 transition-all duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-2xl w-full max-w-md shadow-2xl transition-all duration-200 overflow-hidden ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.97]'}`}>
        <div className="h-1 bg-gradient-to-r from-primary to-primary-dark" />

        {/* Header */}
        <div className="px-7 pt-6 pb-4 flex items-start justify-between border-b border-gray">
          <div>
            <h3 className="text-xl font-bold font-bai text-foreground">
              {mode === 'create' ? 'Add New Product' : 'Edit Product'}
            </h3>
            <p className="text-xs text-gray-text font-pop mt-0.5">
              {mode === 'create' && !skipZoneStep && step === 'zone' && 'Step 1 — Select a zone'}
              {mode === 'create' && !skipZoneStep && step === 'details' && `Step 2 — Product details · ${selectedZoneLabel}`}
              {mode === 'create' && skipZoneStep && selectedZoneLabel && `Adding to ${selectedZoneLabel}`}
              {mode === 'edit' && `Editing ${product?.Codes} · ${getZoneById(product?.zone || '')?.label ?? ''}`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm">
            ✕
          </button>
        </div>

        {/* ── STEP 1: Zone picker (admin creating from all-zones view) ── */}
        {step === 'zone' && (
          <div className="px-7 py-5">
            <p className="text-xs text-gray-dark font-pop mb-4">
              Choose which zone this product belongs to before adding details.
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {ZONES.map(z => (
                <button
                  key={z.id}
                  onClick={() => { setZone(z.id); setStep('details') }}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    zone === z.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-mid hover:border-primary/40 hover:bg-gray text-foreground'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${zone === z.id ? 'bg-primary' : 'bg-gray-mid'}`} />
                  <span className="text-sm font-semibold font-bai truncate">{z.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 / EDIT: Product details ── */}
        {step === 'details' && (
          <>
            {/* Zone banner */}
            {mode === 'create' && (
              <div className="mx-7 mt-5 flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span className="text-xs text-primary font-pop">
                  Zone: <strong className="font-semibold">{selectedZoneLabel}</strong>
                </span>
                {!skipZoneStep && (
                  <button
                    onClick={() => setStep('zone')}
                    className="ml-auto text-[10px] text-primary/70 font-pop hover:text-primary underline"
                  >
                    Change
                  </button>
                )}
              </div>
            )}

            <div className="px-7 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                  Product Code <span className="text-primary">*</span>
                </label>
                <input type="text" value={codes} onChange={e => setCodes(e.target.value)}
                  placeholder="e.g. LLF-RD-12W" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Category</label>
                <input type="text" value={cat} onChange={e => setCat(e.target.value)}
                  placeholder="e.g. Downlights, Track Lights, Strip" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Image Link</label>
                <input type="text" value={imgLink} onChange={e => setImg(e.target.value)}
                  placeholder="https:// or Google Drive URL" className={inputCls} />
              </div>

              {/* Edit mode: show zone selector */}
              {mode === 'edit' && (
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

            <div className="px-7 py-4 bg-gray border-t border-gray-mid flex justify-end gap-3">
              <button onClick={onClose}
                className="px-5 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground hover:text-foreground transition-colors bg-white">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!codes.trim() || !zone || loading}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors">
                {loading ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
