'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import type { Product, ProductPermutation, CartSelection } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { getImageUrl } from '@/lib/auth'
import { useZones } from '@/context/ZonesContext'
import { getProductDetail } from '@/lib/productDetails'
import { type BoqRow, type BoqMeta, SAMPLE_META } from '@/boq/BOQDocument'
import { toCartProductSpecs, formatExtraSpecs } from '@/lib/cartSpecs'
import { downloadBoqPdf } from '@/lib/exportBoqPdf'

interface Props {
  product: Product | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  browseMode?: 'zone' | 'product'
  productCategory?: string
  productSubcategory?: string
  productTypeName?: string
  activeZone?: string
}

// ── Config key labels ─────────────────────────────────────────────────
const CONFIG_LABELS: Record<string, string> = {
  voltage: 'Voltage', watts: 'Wattage', dimensions: 'Dimensions',
  bodyColors: 'Body Color', beamAngles: 'Beam Angle', ipRating: 'IP Rating',
  cutoutSizes: 'Cutout Size', ledChip: 'LED Chip', luminous: 'Luminous Flux',
  cri: 'CRI', models: 'Model',
}
// Keys that map to permutation field names
const PERM_KEY: Record<string, string> = {
  voltage: 'voltage', watts: 'watts', dimensions: 'dimensions',
  bodyColors: 'bodyColor', beamAngles: 'beamAngles', ipRating: 'ipRating',
  cutoutSizes: 'cutoutSizes', ledChip: 'ledChip', luminous: 'luminous',
  cri: 'cri', models: 'models',
}

function isValidPermutation(permutations: ProductPermutation[], sel: CartSelection): boolean {
  if (permutations.length === 0) return true
  return permutations.some(p =>
    Object.entries(sel).every(([k, v]) => !v || p[k] === v)
  )
}

export default function ProductDetail({ product, onClose, onEdit, onDelete, browseMode = 'zone', productCategory, productSubcategory, productTypeName, activeZone }: Props) {
  const { can, user } = useAuth()
  const { addItem, openCart } = useCart()
  const { toast } = useToast()
  const { getZoneById } = useZones()

  const [open, setOpen]             = useState(false)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [selection, setSelection]   = useState<CartSelection>({})
  const [qty, setQty]               = useState(1)
  const [activeTab, setActiveTab]   = useState<'overview' | 'config' | 'gallery'>('overview')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const detail = product ? getProductDetail(product.Codes) : null

  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxSrc(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxSrc])

  // Reset when product changes
  useEffect(() => {
    if (product) {
      setGalleryIdx(0)
      setSelection({})
      setQty(1)
      setActiveTab('overview')
      requestAnimationFrame(() => setOpen(true))
      document.body.style.overflow = 'hidden'
    } else {
      setOpen(false)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [product])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Auto-select first valid value for each config key
  useEffect(() => {
    if (!detail) return

    const auto: CartSelection = {}

    Object.entries(detail.config ?? {}).forEach(([key, vals]) => {
      if (key === 'cct' || !Array.isArray(vals) || vals.length !== 1) return
      auto[PERM_KEY[key] ?? key] = vals[0] as string
    })
    setSelection(auto)
  }, [detail])

  const isValid = useMemo(() => {
    if (!detail) return true
    return isValidPermutation(detail.permutations ?? [], selection)
  }, [detail, selection])

  const allConfigSelected = useMemo(() => {
    if (!detail) return true
    const permKeys = detail.permutations && detail.permutations.length > 0
      ? Object.keys(detail.permutations[0])
      : []
    return permKeys.every(k => selection[k])
  }, [detail, selection])

  const handleSelect = (permKey: string, val: string) => {
    setSelection(prev => ({ ...prev, [permKey]: val === prev[permKey] ? '' : val }))
  }

  const handleShare = async (name: string, code: string) => {
    const url = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(code)}`
    const text = `${name} (${code}) — LEDLUM Product Catalogue`
    if (navigator.share) {
      try { await navigator.share({ title: name, text, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast('Product link copied to clipboard', 'success')
    }
  }

  const handlePrint = async (name: string, prod: typeof product) => {
    if (!prod || downloadingPdf) return
    const z = getZoneById(prod.zone ?? '')?.label ?? prod.zone ?? ''

    // Single-row BOQ — BOQDocument hides any column with no data across all
    // rows, so only the specs this product actually has get shown.
    const row: BoqRow = {
      slNo: 1,
      description: name || prod.Codes,
      image: prod.imageUrl || prod.ImageLink || undefined,
      type: prod.Category ?? '—',
      code: prod.Codes,
      watt: prod.Wattage ?? prod.watts ?? '—',
      beam: prod.BeamAngle ?? prod.beam_angle ?? '—',
      cct: prod.ColourTemp ?? (prod.cct?.length ? prod.cct.join('/') : '—'),
      auto: '—',
      color: prod.Finish ?? (prod.body_colors?.length ? prod.body_colors.join('/') : '—'),
      family: prod.family ?? undefined,
      collection: prod.collection,
      ipRating: prod.ip_rating ?? undefined,
      ledChip: prod.led_chip ?? undefined,
      cri: prod.cri ?? undefined,
      luminous: prod.luminous ?? undefined,
      specifications: formatExtraSpecs(prod.extra_specs),
      qty: 1,
      unit: "NO'S",
      mrp: 0,
      disc: 0,
      net: 0,
      total: 0,
    }

    const meta: BoqMeta = {
      ...SAMPLE_META,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      preparedBy: user?.name ?? SAMPLE_META.preparedBy,
      dealerName: user?.company ?? user?.name ?? SAMPLE_META.dealerName,
      projectName: `Product Data Sheet — ${z || SAMPLE_META.projectName}`,
    }

    setDownloadingPdf(true)
    try {
      await downloadBoqPdf(meta, [row], `${prod.Codes}-datasheet.pdf`)
    } catch (err) {
      console.error('[ProductDetail] PDF export failed:', err)
      toast('Failed to generate PDF', 'error')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    const heroImg = detail?.productAbout?.image || getImageUrl(product.ImageLink ?? "") || ''
    addItem({
      productCode:        product.Codes,
      productName:        detail?.productAbout?.name ?? product.Codes,
      productImage:       heroImg,
      zone:               product.zone ?? activeZone ?? '',
      browseMode:         browseMode,
      productCategory:    browseMode === 'product' ? productCategory : undefined,
      productSubcategory: browseMode === 'product' ? productSubcategory : undefined,
      productTypeName:    browseMode === 'product' ? productTypeName : undefined,
      productSpecs:       toCartProductSpecs(product),
      selection,
      quantity:           qty,
    })
    toast(`${product.Codes} added to quote`, 'success')
  }

  if (!product && !open) return null

  const imgUrl    = product ? getImageUrl(product.ImageLink ?? '') : null
  const fmt       = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const zone      = getZoneById(product?.zone ?? '')

  // Prefer the product's real Supabase image(s) over the static demo
  // gallery in productDetails.ts (placeholder-only, e.g. LLO-006's
  // "placehold.co" images) — only fall back to the mock gallery when the
  // real product has no image of its own.
  const realGallery = product?.gallery_images?.length ? product.gallery_images : (imgUrl ? [imgUrl] : [])
  const galleries    = realGallery.length ? realGallery : (detail?.gallery ?? [])

  const category    = detail?.productAbout?.category ?? product?.Category ?? ''
  const title       = detail?.productAbout?.name ?? product?.Codes ?? ''
  const description = detail?.productAbout?.description ?? product?.hero_description ?? ''
  const hasConfig   = !!(detail?.config && Object.keys(detail.config).length > 0)

  // Unified spec table — prefers the mock's config values (the 3 demo
  // products in productDetails.ts) but falls back to the product's real
  // Supabase fields for everything else, so every product — mock or real —
  // gets the same rich Overview tab instead of two different layouts.
  const specRows: { k: string; v: string }[] = []
  const addSpec = (k: string, v?: string | null) => { if (v) specRows.push({ k, v }) }
  addSpec('Category',       category)
  addSpec('Wattage',        detail?.config?.watts?.join(', ')       ?? product?.watts)
  addSpec('Luminous',       detail?.config?.luminous?.join(', ')    ?? product?.luminous)
  addSpec('CRI',            detail?.config?.cri?.join(', ')         ?? product?.cri)
  addSpec('IP Rating',      detail?.config?.ipRating?.join(', ')    ?? product?.ip_rating)
  addSpec('Voltage',        detail?.config?.voltage?.join(', '))
  addSpec('LED Chip',       detail?.config?.ledChip?.join(', ')     ?? product?.led_chip)
  addSpec('Beam Angle',     detail?.config?.beamAngles?.join(', ')  ?? product?.beam_angle)
  addSpec('Body Color',     detail?.config?.bodyColors?.join(', ')  ?? (product?.body_colors?.length ? product.body_colors.join(', ') : undefined))
  addSpec('Dimensions',     detail?.config?.dimensions?.join(', ')  ?? product?.Dimensions)
  addSpec('Cutout Size',    detail?.config?.cutoutSizes?.join(', ') ?? product?.cutout_size)
  addSpec('CCT',            !detail?.config?.cct && product?.cct?.length ? product.cct.join(', ') : undefined)
  addSpec('Family',         product?.family)
  addSpec('Indoor/Outdoor', product?.collection)
  addSpec('Product Type',   product?.product_type)
  addSpec('Website',        product?.website)
  addSpec('Zone',           zone?.label ?? product?.zone)
  addSpec('Source',         product?.source)
  addSpec('Added',          product?.createdAt ? fmt(product.createdAt) : undefined)
  Object.entries(product?.extra_specs ?? {})
    .filter(([, v]) => v && v !== 'N/A')
    .forEach(([k, v]) => addSpec(k, v))

  const tabs: Array<'overview' | 'config' | 'gallery'> = ['overview', ...(hasConfig ? ['config' as const] : []), 'gallery']

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open && product ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel — same two-column layout (image + tabs) for every product,
          whether it has a curated demo config or only real Supabase fields. */}
      <div className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] shadow-2xl w-full max-w-5xl
        ${open && product ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col md:flex-row h-full overflow-hidden">

          {/* Left: hero + gallery — capped height & full width on mobile,
              44%-width column filling the panel height from md up */}
          <div className="h-56 sm:h-72 md:h-auto w-full md:w-[44%] flex-shrink-0 bg-gray flex flex-col">
            {/* Hero image */}
            <div className="flex-1 relative overflow-hidden">
              {galleries[galleryIdx] ? (
                <button
                  type="button"
                  onClick={() => setLightboxSrc(galleries[galleryIdx])}
                  className="absolute inset-0 h-full w-full cursor-zoom-in"
                  title="View full size"
                >
                  <Image
                    src={galleries[galleryIdx]}
                    alt={product?.Codes ?? ''}
                    fill sizes="(max-width: 768px) 100vw, 44vw"
                    className="object-contain animate-zoom-slow"
                    priority
                  />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-mid">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
              )}
              {/* Red top accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
              {/* Watermark */}
              <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 text-2xl sm:text-5xl font-bold text-black/6 font-bai select-none pointer-events-none leading-none">
                {product?.Codes}
              </div>
            </div>

            {/* Gallery thumbnails — native scrollbar hidden (it rendered as a
                clunky classic Windows scrollbar under the strip); a smooth,
                snap-scrolling swipeable row reads much cleaner. */}
            {galleries.length > 1 && (
              <div className="flex flex-shrink-0 gap-2 p-2 sm:p-3 bg-white border-t border-gray overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide">
                {galleries.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIdx(i)}
                    className={`flex-shrink-0 snap-start w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${galleryIdx === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={g} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: info + config */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-7 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray flex-shrink-0">
              <div className="min-w-0">
                {category && (
                  <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3 py-1 rounded-full font-pop mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {category}
                  </div>
                )}
                <h2 className="text-lg sm:text-2xl font-bold text-foreground font-bai truncate">{title}</h2>
                {zone && <p className="text-xs text-gray-dark font-pop mt-0.5">{zone.label}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Share button — viewer + guest */}
                {can('share') && (
                  <button
                    onClick={() => handleShare(title, product?.Codes ?? '')}
                    title="Share product"
                    className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                )}
                {/* Download / PDF button — viewer + vendor */}
                {can('download') && (
                  <button
                    onClick={() => handlePrint(title, product)}
                    disabled={downloadingPdf}
                    title="Download as PDF"
                    className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-primary/8 hover:text-primary hover:border-primary/40 disabled:opacity-60 transition-all"
                  >
                    {downloadingPdf ? (
                      <div className="w-3.5 h-3.5 border-2 border-gray-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                  </button>
                )}
                <button onClick={onClose}
                  className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm">
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs — Configure only appears when the product actually has
                curated config/permutation data (the 3 demo entries in
                productDetails.ts); every other product just gets Overview
                + Gallery, populated entirely from real Supabase fields. */}
            <div className="flex border-b border-gray px-4 sm:px-7 flex-shrink-0 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold font-bai capitalize border-b-2 transition-all -mb-px ${
                    activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-text hover:text-foreground'
                  }`}>
                  {tab === 'config' ? 'Configure' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && (
                <div className="px-4 sm:px-7 py-4 sm:py-5">
                  {description && (
                    <p className="text-sm text-gray-text font-pop leading-relaxed mb-6">
                      {description}
                    </p>
                  )}
                  {/* Spec summary */}
                  <h4 className="text-[11px] font-semibold text-gray-dark uppercase tracking-widest mb-3 font-pop">Specifications</h4>
                  <div className="bg-gray rounded-xl overflow-hidden divide-y divide-gray-mid">
                    {specRows.map(row => (
                      <div key={row.k} className="flex items-center px-3 sm:px-4 py-2.5 gap-3">
                        <span className="text-xs text-gray-dark font-pop w-24 sm:w-28 flex-shrink-0">{row.k}</span>
                        <span className="text-sm font-semibold text-foreground font-bai">{row.v}</span>
                      </div>
                    ))}
                  </div>

                  {product?.ImageLink && product.ImageLink.length > 2 && (
                    <a href={product.ImageLink} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-5 text-sm text-primary font-semibold font-bai hover:underline">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Open image link ↗
                    </a>
                  )}
                </div>
              )}

              {/* ── CONFIGURE ── */}
              {activeTab === 'config' && hasConfig && (
                <div className="px-4 sm:px-7 py-4 sm:py-5 space-y-5">
                  {/* CCT color swatches */}
                  {detail?.config?.cct && detail?.config?.cct?.length > 0 && (
                    <div>
                      <label className="text-[11px] font-semibold text-gray-dark uppercase tracking-widest font-pop mb-2 block">
                        Colour Temperature (CCT)
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {detail?.config?.cct?.map((c: { label: string; color: string }) => {
                          const isSelected = selection['cct'] === c.label
                          return (
                            <button key={c.label} onClick={() => handleSelect('cct', c.label)}
                              className={`flex flex-col items-center gap-1.5 transition-all`}>
                              <div className={`w-10 h-10 rounded-full border-2 shadow-sm transition-all ${isSelected ? 'border-primary scale-110' : 'border-gray-mid hover:border-gray-dark'}`}
                                style={{ backgroundColor: c.color }} />
                              <span className={`text-[10px] font-pop font-semibold ${isSelected ? 'text-primary' : 'text-gray-text'}`}>
                                {c.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other config options */}
                  {Object.entries(detail?.config ?? {})
                    .filter(([key]) => key !== 'cct' && key !== 'models')
                    .map(([key, vals]) => {
                      if (!Array.isArray(vals) || vals.length === 0) return null
                      const permKey = PERM_KEY[key] ?? key
                      return (
                        <div key={key}>
                          <label className="text-[11px] font-semibold text-gray-dark uppercase tracking-widest font-pop mb-2 block">
                            {CONFIG_LABELS[key] ?? key}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {(vals as string[]).map(v => {
                              const sel = selection[permKey] === v
                              // Check validity if selected
                              const testSel = { ...selection, [permKey]: v }
                              const valid = isValidPermutation(detail?.permutations ?? [], testSel)
                              return (
                                <button key={v} onClick={() => valid && handleSelect(permKey, v)}
                                  disabled={!valid && !sel}
                                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold font-bai border transition-all
                                    ${sel ? 'bg-primary text-white border-primary' : ''}
                                    ${!sel && valid ? 'bg-white text-foreground border-gray-mid hover:border-primary hover:text-primary' : ''}
                                    ${!valid && !sel ? 'opacity-30 cursor-not-allowed border-gray line-through' : ''}
                                  `}>
                                  {v}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                  {/* Validity feedback */}
                  {!isValid && (
                    <div className="flex items-center gap-2 text-xs text-primary font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      This combination is not available. Please adjust your selection.
                    </div>
                  )}
                  {isValid && allConfigSelected && (
                    <div className="flex items-center gap-2 text-xs text-green-700 font-pop bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Valid configuration selected
                    </div>
                  )}
                </div>
              )}

              {/* ── GALLERY ── */}
              {activeTab === 'gallery' && (
                <div className="px-4 sm:px-7 py-4 sm:py-5">
                  {galleries.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {galleries.map((g, i) => (
                        <button key={i} onClick={() => { setGalleryIdx(i); setActiveTab('overview') }}
                          className="aspect-[4/5] rounded-xl overflow-hidden border border-gray hover:border-primary transition-colors">
                          <img src={g} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-dark text-sm font-bai text-center py-12">No gallery images available</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer — no Close button here; the ✕ in the header already
                closes the panel. Hidden entirely when there's nothing else
                to show (e.g. a guest/viewer with no cart/edit/delete rights). */}
            {(can('cart') || (can('edit') && !product?.readOnly) || (can('delete') && !product?.readOnly)) && (
              <div className="px-4 sm:px-7 py-3 sm:py-4 border-t border-gray flex-shrink-0">
                {/* Vendor: quantity + add to cart */}
                {can('cart') ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold font-pop text-gray-dark uppercase tracking-wide">Qty</label>
                      <div className="flex items-center border border-gray-mid rounded-lg overflow-hidden">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))}
                          className="px-3 py-2 text-gray-dark hover:bg-gray hover:text-foreground transition-colors font-bold text-lg leading-none">−</button>
                        <span className="px-4 py-2 text-sm font-bold font-bai text-foreground min-w-[40px] text-center">{qty}</span>
                        <button onClick={() => setQty(q => q + 1)}
                          className="px-3 py-2 text-gray-dark hover:bg-gray hover:text-foreground transition-colors font-bold text-lg leading-none">+</button>
                      </div>
                    </div>
                    <button onClick={handleAddToCart}
                      disabled={!isValid || (hasConfig && !allConfigSelected)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold font-bai transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Add to Quote
                    </button>
                  </div>
                ) : (
                  /* Admin/editor footer */
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
                    {can('edit') && !product?.readOnly && (
                      <button onClick={() => { onClose(); onEdit() }}
                        className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-bold font-bai transition-all">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                    )}
                    {can('delete') && !product?.readOnly && (
                      <button onClick={() => { onClose(); onDelete() }}
                        className="px-4 sm:px-5 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-bold font-bai transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Image lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
