'use client'

import { useState, useEffect } from 'react'
import type { Product, ProductFormData } from '@/types'
import { useZones } from '@/context/ZonesContext'

interface CrudModalProps {
  mode: 'create' | 'edit' | null
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  onClose: () => void
  currentZone?: string
}

const toList = (s: string) => s.split(',').map(v => v.trim()).filter(Boolean)
const fromList = (l?: string[]) => (l ?? []).join(', ')

export default function CrudModal({ mode, product, onSubmit, onClose, currentZone }: CrudModalProps) {
  const { zones, getZoneById } = useZones()

  const [step, setStep]             = useState<'zone' | 'details'>('zone')
  const [codes, setCodes]           = useState('')
  const [cat, setCat]               = useState('')
  const [imgLink, setImg]           = useState('')
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [specsOpen, setSpecsOpen]   = useState(false)

  // Real-schema specification fields (all optional)
  const [family, setFamily]                 = useState('')
  const [collection, setCollection]         = useState('')
  const [productType, setProductType]       = useState('')
  const [heroDescription, setHeroDescription] = useState('')
  const [galleryImages, setGalleryImages]   = useState('')
  const [watts, setWatts]                   = useState('')
  const [dimensions, setDimensions]         = useState('')
  const [cutoutSize, setCutoutSize]         = useState('')
  const [bodyColors, setBodyColors]         = useState('')
  const [cct, setCct]                       = useState('')
  const [beamAngle, setBeamAngle]           = useState('')
  const [ipRating, setIpRating]             = useState('')
  const [ledChip, setLedChip]               = useState('')
  const [luminous, setLuminous]             = useState('')
  const [cri, setCri]                       = useState('')
  const [website, setWebsite]               = useState('')

  const [loading, setLoading] = useState(false)
  const isOpen = mode !== null

  // Edit mode skips zone step; create with specific zone also skips
  const skipZoneStep = mode === 'edit' || !!currentZone

  useEffect(() => {
    if (mode === 'edit' && product) {
      setCodes(product.model ?? product.Codes)
      setCat(product.Category)
      setImg(product.hero_image ?? product.ImageLink ?? '')
      setSelectedZones(product.zones?.length ? product.zones : product.zone ? [product.zone] : [])
      setFamily(product.family ?? '')
      setCollection(product.collection ?? '')
      setProductType(product.product_type ?? '')
      setHeroDescription(product.hero_description ?? '')
      setGalleryImages(fromList(product.gallery_images))
      setWatts(product.watts ?? '')
      setDimensions(product.Dimensions ?? '')
      setCutoutSize(product.cutout_size ?? '')
      setBodyColors(fromList(product.body_colors))
      setCct(fromList(product.cct))
      setBeamAngle(product.beam_angle ?? product.BeamAngle ?? '')
      setIpRating(product.ip_rating ?? '')
      setLedChip(product.led_chip ?? '')
      setLuminous(product.luminous ?? '')
      setCri(product.cri ?? '')
      setWebsite(product.website ?? '')
      setSpecsOpen(false)
      setStep('details')
    } else if (mode === 'create') {
      setCodes(''); setCat(''); setImg('')
      setFamily(''); setCollection(''); setProductType('')
      setHeroDescription(''); setGalleryImages(''); setWatts(''); setDimensions('')
      setCutoutSize(''); setBodyColors(''); setCct(''); setBeamAngle('')
      setIpRating(''); setLedChip(''); setLuminous(''); setCri(''); setWebsite('')
      setSpecsOpen(false)
      if (currentZone) {
        setSelectedZones([currentZone])
        setStep('details')
      } else {
        setSelectedZones([])
        setStep('zone')  // Admin creating from All Zones → pick zone(s) first
      }
    }
  }, [mode, product, currentZone])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const toggleZone = (id: string) => {
    setSelectedZones(prev => prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id])
  }

  const handleSubmit = async () => {
    if (!codes.trim() || selectedZones.length === 0) return
    setLoading(true)
    try {
      await onSubmit({
        Codes: codes.trim(),
        Category: cat.trim() || 'Uncategorized',
        ImageLink: imgLink.trim(),
        zones: selectedZones,
        family: family.trim() || undefined,
        collection: collection || undefined,
        product_type: productType.trim() || undefined,
        hero_description: heroDescription.trim() || undefined,
        gallery_images: toList(galleryImages),
        watts: watts.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        cutout_size: cutoutSize.trim() || undefined,
        body_colors: toList(bodyColors),
        cct: toList(cct),
        beam_angle: beamAngle.trim() || undefined,
        ip_rating: ipRating.trim() || undefined,
        led_chip: ledChip.trim() || undefined,
        luminous: luminous.trim() || undefined,
        cri: cri.trim() || undefined,
        website: website.trim() || undefined,
      })
      onClose()
    } finally { setLoading(false) }
  }

  const inputCls = "w-full border border-gray-mid rounded-xl px-4 py-3 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
  const specInputCls = "w-full border border-gray-mid rounded-lg px-3 py-2 text-xs font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
  const specLabelCls = "block text-[10px] font-semibold font-pop text-gray-dark uppercase tracking-wide mb-1"

  const selectedZoneLabels = selectedZones.map(id => getZoneById(id)?.label ?? id).join(', ')

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-5 transition-all duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl transition-all duration-200 overflow-hidden max-h-[90vh] flex flex-col ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.97]'}`}>
        <div className="h-1 bg-gradient-to-r from-primary to-primary-dark flex-shrink-0" />

        {/* Header */}
        <div className="px-7 pt-6 pb-4 flex items-start justify-between border-b border-gray flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold font-bai text-foreground">
              {mode === 'create' ? 'Add New Product' : 'Edit Product'}
            </h3>
            <p className="text-xs text-gray-text font-pop mt-0.5">
              {mode === 'create' && !skipZoneStep && step === 'zone' && 'Step 1 — Select zone(s)'}
              {mode === 'create' && !skipZoneStep && step === 'details' && `Step 2 — Product details · ${selectedZoneLabels}`}
              {mode === 'create' && skipZoneStep && selectedZoneLabels && `Adding to ${selectedZoneLabels}`}
              {mode === 'edit' && `Editing ${product?.Codes} · ${selectedZoneLabels || '—'}`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm flex-shrink-0">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* ── STEP 1: Zone picker (multi-select) ── */}
          {step === 'zone' && (
            <div className="px-7 py-5">
              <p className="text-xs text-gray-dark font-pop mb-4">
                Choose one or more zones this product belongs to.
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {zones.map(z => (
                  <button
                    key={z.id}
                    onClick={() => toggleZone(z.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedZones.includes(z.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-mid hover:border-primary/40 hover:bg-gray text-foreground'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedZones.includes(z.id) ? 'bg-primary' : 'bg-gray-mid'}`} />
                    <span className="text-sm font-semibold font-bai truncate">{z.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep('details')}
                  disabled={selectedZones.length === 0}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors"
                >
                  Continue {selectedZones.length > 0 ? `(${selectedZones.length} zone${selectedZones.length === 1 ? '' : 's'})` : ''}
                </button>
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
                  <span className="text-xs text-primary font-pop truncate">
                    Zone{selectedZones.length === 1 ? '' : 's'}: <strong className="font-semibold">{selectedZoneLabels}</strong>
                  </span>
                  {!skipZoneStep && (
                    <button
                      onClick={() => setStep('zone')}
                      className="ml-auto flex-shrink-0 text-[10px] text-primary/70 font-pop hover:text-primary underline"
                    >
                      Change
                    </button>
                  )}
                </div>
              )}

              <div className="px-7 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">
                    Model / Product Code <span className="text-primary">*</span>
                  </label>
                  <input type="text" value={codes} onChange={e => setCodes(e.target.value)}
                    placeholder="e.g. LLF-RD-12W" className={inputCls} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Indoor / Outdoor</label>
                    <div className="relative">
                      <select value={collection} onChange={e => setCollection(e.target.value)}
                        className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                        <option value="">—</option>
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Category</label>
                    <input type="text" value={cat} onChange={e => setCat(e.target.value)}
                      placeholder="e.g. Pole Light Fixtures" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Hero Image URL</label>
                  <input type="text" value={imgLink} onChange={e => setImg(e.target.value)}
                    placeholder="https:// or Google Drive URL" className={inputCls} />
                </div>

                {/* Edit mode: multi-select zones */}
                {mode === 'edit' && (
                  <div>
                    <label className="block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5">Zones</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {zones.map(z => (
                        <button
                          type="button"
                          key={z.id}
                          onClick={() => toggleZone(z.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                            selectedZones.includes(z.id)
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-gray-mid hover:border-primary/40 text-foreground'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedZones.includes(z.id) ? 'bg-primary' : 'bg-gray-mid'}`} />
                          <span className="text-xs font-semibold font-bai truncate">{z.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible specifications */}
                <div>
                  <button
                    type="button"
                    onClick={() => setSpecsOpen(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold font-pop text-primary hover:text-primary-dark"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                      className={`transition-transform ${specsOpen ? 'rotate-90' : ''}`}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    {specsOpen ? 'Hide specifications' : 'Add specifications (optional)'}
                  </button>

                  {specsOpen && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div><label className={specLabelCls}>Family</label>
                        <input type="text" value={family} onChange={e => setFamily(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>Product Type</label>
                        <input type="text" value={productType} onChange={e => setProductType(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>Watts</label>
                        <input type="text" value={watts} onChange={e => setWatts(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>Dimensions</label>
                        <input type="text" value={dimensions} onChange={e => setDimensions(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>Cutout Size</label>
                        <input type="text" value={cutoutSize} onChange={e => setCutoutSize(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>Beam Angle</label>
                        <input type="text" value={beamAngle} onChange={e => setBeamAngle(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>IP Rating</label>
                        <input type="text" value={ipRating} onChange={e => setIpRating(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>LED Chip</label>
                        <input type="text" value={ledChip} onChange={e => setLedChip(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>Luminous Flux</label>
                        <input type="text" value={luminous} onChange={e => setLuminous(e.target.value)} className={specInputCls} /></div>
                      <div><label className={specLabelCls}>CRI</label>
                        <input type="text" value={cri} onChange={e => setCri(e.target.value)} className={specInputCls} /></div>
                      <div className="col-span-2"><label className={specLabelCls}>Body Colors (comma-separated)</label>
                        <input type="text" value={bodyColors} onChange={e => setBodyColors(e.target.value)} placeholder="White, Matt Black" className={specInputCls} /></div>
                      <div className="col-span-2"><label className={specLabelCls}>CCT (comma-separated)</label>
                        <input type="text" value={cct} onChange={e => setCct(e.target.value)} placeholder="3000K, 4000K" className={specInputCls} /></div>
                      <div className="col-span-2"><label className={specLabelCls}>Gallery Images (comma-separated URLs)</label>
                        <input type="text" value={galleryImages} onChange={e => setGalleryImages(e.target.value)} className={specInputCls} /></div>
                      <div className="col-span-2"><label className={specLabelCls}>Description</label>
                        <textarea value={heroDescription} onChange={e => setHeroDescription(e.target.value)} rows={2} className={`${specInputCls} resize-none`} /></div>
                      <div className="col-span-2"><label className={specLabelCls}>Website</label>
                        <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className={specInputCls} /></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-7 py-4 bg-gray border-t border-gray-mid flex justify-end gap-3 flex-shrink-0">
                <button onClick={onClose}
                  className="px-5 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground hover:text-foreground transition-colors bg-white">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={!codes.trim() || selectedZones.length === 0 || loading}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors">
                  {loading ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
