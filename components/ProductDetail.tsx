'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import type { Product, ProductPermutation, CartSelection } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { getImageUrl } from '@/lib/auth'
import { getZoneById } from '@/lib/zones'
import { getProductDetail } from '@/lib/productDetails'

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

  const [open, setOpen]             = useState(false)
  const [imgError, setImgError]     = useState(false)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [selection, setSelection]   = useState<CartSelection>({})
  const [qty, setQty]               = useState(1)
  const [activeTab, setActiveTab]   = useState<'overview' | 'config' | 'gallery'>('overview')

  const detail = product ? getProductDetail(product.Codes) : null

  // Reset when product changes
  useEffect(() => {
    if (product) {
      setImgError(false)
      setGalleryIdx(0)
      setSelection({})
      setQty(1)
      setActiveTab(detail ? 'overview' : 'overview')
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

  const handlePrint = (name: string, prod: typeof product) => {
    if (!prod) return
    const z = getZoneById(prod.zone ?? '')?.label ?? prod.zone ?? ''
    const specs = [
      { k: 'Product Code', v: prod.Codes },
      { k: 'Category',     v: prod.Category },
      { k: 'Zone',         v: z },
      prod.Wattage     ? { k: 'Wattage',     v: prod.Wattage     } : null,
      prod.ColourTemp  ? { k: 'Colour Temp', v: prod.ColourTemp  } : null,
      prod.BeamAngle   ? { k: 'Beam Angle',  v: prod.BeamAngle   } : null,
      prod.Finish      ? { k: 'Finish',      v: prod.Finish      } : null,
      prod.Dimensions  ? { k: 'Dimensions',  v: prod.Dimensions  } : null,
      prod.Description ? { k: 'Description', v: prod.Description } : null,
    ].filter(Boolean) as { k: string; v: string }[]

    const rows = specs.map(s =>
      `<tr><td style="padding:8px 12px;font-size:12px;color:#666;width:140px;background:#f8f7f4;border-bottom:1px solid #eee">${s.k}</td><td style="padding:8px 12px;font-size:13px;color:#171717;font-weight:600;border-bottom:1px solid #eee">${s.v}</td></tr>`
    ).join('')

    const img = prod.imageUrl || prod.ImageLink || ''
    const imgHtml = img ? `<img src="${img}" style="max-height:260px;max-width:100%;object-fit:contain;border-radius:8px;margin-bottom:16px" />` : ''

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${prod.Codes} — LEDLUM</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:32px; color:#171717; background:#fff; }
  .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; padding-bottom:16px; border-bottom:3px solid #9a8c66; }
  .brand { font-size:22px; font-weight:800; letter-spacing:0.05em; color:#9a8c66; }
  .code { font-size:14px; color:#888; margin-top:4px; }
  h1 { font-size:20px; font-weight:700; margin:0 0 4px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; border-radius:8px; overflow:hidden; border:1px solid #eee; }
  .footer { margin-top:32px; font-size:10px; color:#bbb; text-align:center; border-top:1px solid #eee; padding-top:12px; }
  @media print { body { padding:16px; } }
</style></head>
<body>
  <div class="header">
    <div><div class="brand">LEDLUM</div><div class="code">Product Data Sheet</div></div>
    <div style="text-align:right"><div style="font-size:11px;color:#888">Generated ${new Date().toLocaleDateString('en-IN')}</div></div>
  </div>
  <h1>${name || prod.Codes}</h1>
  ${imgHtml}
  <table>${rows}</table>
  <div class="footer">LEDLUM — Confidential product information. For internal and trade use only.</div>
</body></html>`

    const w = window.open('', '_blank', 'width=700,height=900')
    if (!w) { toast('Please allow popups to download PDF', 'error'); return }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 400)
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
      selection,
      quantity:           qty,
    })
    toast(`${product.Codes} added to quote`, 'success')
  }

  if (!product && !open) return null

  const imgUrl    = product ? getImageUrl(product.ImageLink ?? '') : null
  const heroImage = detail?.productAbout?.image ?? imgUrl
  const fmt       = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const zone      = getZoneById(product?.zone ?? '')

  const galleries = detail?.gallery ?? (imgUrl ? [imgUrl] : [])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open && product ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel — wider when has detail */}
      <div className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] shadow-2xl
        ${detail ? 'w-full max-w-5xl' : 'w-full max-w-xl'}
        ${open && product ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {detail ? (
          /* ── RICH DETAIL VIEW ─────────────────────────────────── */
          <div className="flex h-full overflow-hidden">

            {/* Left: hero + gallery */}
            <div className="w-[44%] flex-shrink-0 bg-gray flex flex-col">
              {/* Hero image */}
              <div className="flex-1 relative overflow-hidden">
                {galleries[galleryIdx] ? (
                  <Image
                    src={galleries[galleryIdx]}
                    alt={product?.Codes ?? ''}
                    fill sizes="44vw"
                    className="object-cover animate-zoom-slow"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-mid">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                {/* Red top accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
                {/* Watermark */}
                <div className="absolute bottom-5 left-5 text-5xl font-bold text-black/6 font-bai select-none pointer-events-none leading-none">
                  {product?.Codes}
                </div>
              </div>

              {/* Gallery thumbnails */}
              {galleries.length > 1 && (
                <div className="flex gap-2 p-3 bg-white border-t border-gray overflow-x-auto">
                  {galleries.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIdx(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${galleryIdx === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={g} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: info + config */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-gray flex-shrink-0">
                <div>
                  <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3 py-1 rounded-full font-pop mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {detail.productAbout?.category}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground font-bai">{detail.productAbout?.name}</h2>
                  {zone && <p className="text-xs text-gray-dark font-pop mt-0.5">{zone.label}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Share button — viewer + guest */}
                  {can('share') && (
                    <button
                      onClick={() => handleShare(detail.productAbout?.name ?? '', product?.Codes ?? '')}
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
                      onClick={() => handlePrint(detail?.productAbout?.name ?? '', product)}
                      title="Download as PDF"
                      className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-primary/8 hover:text-primary hover:border-primary/40 transition-all"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  )}
                  <button onClick={onClose}
                    className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm">
                    ✕
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray px-7 flex-shrink-0">
                {(['overview', 'config', 'gallery'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-semibold font-bai capitalize border-b-2 transition-all -mb-px ${
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
                  <div className="px-7 py-5">
                    <p className="text-sm text-gray-text font-pop leading-relaxed mb-6">
                      {detail.productAbout?.description}
                    </p>
                    {/* Spec summary */}
                    <h4 className="text-[11px] font-semibold text-gray-dark uppercase tracking-widest mb-3 font-pop">Specifications</h4>
                    <div className="bg-gray rounded-xl overflow-hidden divide-y divide-gray-mid">
                      {[
                        { k: 'Category',   v: detail.productAbout?.category },
                        ...(detail.config?.watts     ? [{ k: 'Wattage',    v: detail.config.watts.join(', ')     }] : []),
                        ...(detail.config?.luminous  ? [{ k: 'Luminous',   v: detail.config.luminous.join(', ')  }] : []),
                        ...(detail.config?.cri       ? [{ k: 'CRI',        v: detail.config.cri.join(', ')       }] : []),
                        ...(detail.config?.ipRating  ? [{ k: 'IP Rating',  v: detail.config.ipRating.join(', ')  }] : []),
                        ...(detail.config?.voltage   ? [{ k: 'Voltage',    v: detail.config.voltage.join(', ')   }] : []),
                        ...(detail.config?.ledChip   ? [{ k: 'LED Chip',   v: detail.config.ledChip.join(', ')   }] : []),
                        { k: 'Zone',       v: zone?.label ?? product?.zone },
                        { k: 'Source',     v: product?.source },
                        { k: 'Added',      v: product?.createdAt ? fmt(product.createdAt) : '' },
                      ].filter(row => row.v).map(row => (
                        <div key={row.k} className="flex items-center px-4 py-2.5 gap-3">
                          <span className="text-xs text-gray-dark font-pop w-24 flex-shrink-0">{row.k}</span>
                          <span className="text-sm font-semibold text-foreground font-bai">{row.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── CONFIGURE ── */}
                {activeTab === 'config' && (
                  <div className="px-7 py-5 space-y-5">
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
                    {Object.entries(detail.config ?? {})
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
                                const valid = isValidPermutation(detail.permutations ?? [], testSel)
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
                  <div className="px-7 py-5">
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

              {/* Footer */}
              <div className="px-7 py-4 border-t border-gray flex-shrink-0">
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
                    <div className="flex gap-3">
                      <button onClick={onClose}
                        className="px-4 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground transition-colors">
                        Close
                      </button>
                      <button onClick={handleAddToCart}
                        disabled={!isValid || (detail.permutations && detail.permutations.length > 0 && !allConfigSelected)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold font-bai transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                        Add to Quote
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Admin/editor footer */
                  <div className="flex gap-3 justify-end">
                    <button onClick={onClose}
                      className="px-5 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground hover:text-foreground transition-colors">
                      Close
                    </button>
                    {can('edit') && (
                      <button onClick={() => { onClose(); onEdit() }}
                        className="flex items-center gap-2 px-5 py-2.5 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-bold font-bai transition-all">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                    )}
                    {can('delete') && (
                      <button onClick={() => { onClose(); onDelete() }}
                        className="px-5 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-bold font-bai transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : (
          /* ── SIMPLE DETAIL VIEW (no rich config) ─────────────── */
          <div className="flex flex-col h-full">
            {/* Image */}
            <div className="h-56 bg-gray relative flex-shrink-0 flex items-center justify-center overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
              {imgUrl && !imgError && product ? (
                <Image src={imgUrl} alt={product.Codes} fill sizes="xl" className="object-cover animate-zoom-slow" onError={() => setImgError(true)} priority />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-mid">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span className="text-xs font-bai uppercase tracking-widest">No Image</span>
                </div>
              )}
              <div className="absolute bottom-4 left-5 text-4xl font-bold text-black/7 font-bai select-none pointer-events-none">{product?.Codes}</div>
            </div>

            {/* Info */}
            <div className="flex items-start justify-between px-7 pt-5 pb-4 border-b border-gray">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3 py-1 rounded-full font-pop mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {product?.Category}
                </div>
                <h2 className="text-2xl font-bold text-foreground font-bai">{product?.Codes}</h2>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {can('share') && (
                  <button
                    onClick={() => handleShare(product?.Codes ?? '', product?.Codes ?? '')}
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
                {can('download') && (
                  <button
                    onClick={() => handlePrint(product?.Codes ?? '', product)}
                    title="Download as PDF"
                    className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-primary/8 hover:text-primary hover:border-primary/40 transition-all"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                )}
                <button onClick={onClose}
                  className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm">
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-5">
              <h4 className="text-[11px] font-semibold text-gray-dark uppercase tracking-widest mb-3 font-pop">Details</h4>
              <div className="bg-gray rounded-xl overflow-hidden divide-y divide-gray-mid">
                {[
                  { k: 'Code',     v: product?.Codes },
                  { k: 'Category', v: product?.Category },
                  { k: 'Zone',     v: zone?.label ?? product?.zone },
                  { k: 'Source',   v: product?.source },
                  { k: 'Added',    v: product?.createdAt ? fmt(product.createdAt) : '' },
                ].map(r => (
                  <div key={r.k} className="flex items-center px-4 py-3 gap-3">
                    <span className="text-xs text-gray-dark font-pop w-24">{r.k}</span>
                    <span className="text-sm font-semibold text-foreground font-bai">{r.v}</span>
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

            <div className="px-7 py-4 border-t border-gray flex gap-3 justify-end flex-shrink-0">
              <button onClick={onClose}
                className="px-5 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground transition-colors">
                Close
              </button>
              {can('cart') && (
                <button onClick={handleAddToCart}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-bold font-bai transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  Add to Quote
                </button>
              )}
              {can('edit') && (
                <button onClick={() => { onClose(); onEdit() }}
                  className="px-5 py-2.5 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-bold font-bai transition-all">
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
