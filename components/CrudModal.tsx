'use client'

import { useState, useEffect, useRef } from 'react'
import type { Product, ProductFormData } from '@/types'
import { useZones } from '@/context/ZonesContext'
import { useAuth } from '@/context/AuthContext'
import { authFetch } from '@/lib/supabaseClient'
import { uploadProductImage } from '@/lib/uploadImage'
import { getImageUrl } from '@/lib/auth'

interface CategoryOption { id: number; name: string; collection: string | null; productCount: number }
interface MainCategoryOption { name: string; label: string; count: number }
const NEW_CATEGORY = '__new__'
const NEW_MAIN = '__new_main__'

interface CrudModalProps {
  mode: 'create' | 'edit' | null
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  onClose: () => void
  currentZone?: string
}

const toList = (s: string) => s.split(',').map(v => v.trim()).filter(Boolean)
const fromList = (l?: string[]) => (l ?? []).join(', ')
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** Thumbnail URL for a stored image link (handles Google Drive share links). */
const previewSrc = (url: string) => (url.trim() ? getImageUrl(url.trim()) : null)

/** Corner tag on thumbnails of images that will upload on save. */
function PendingBadge() {
  return (
    <span className="pointer-events-none absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white shadow">
      New
    </span>
  )
}

/** An image in the form: either an existing/pasted URL, or a picked file
 * waiting to be uploaded when the product is saved. */
interface ImageItem {
  id: string
  url?: string      // set once it's a real URL (pasted, existing, or uploaded)
  file?: File       // pending upload
  preview: string   // what to show in the thumbnail
}
let itemSeq = 0
const urlItem = (url: string): ImageItem => ({ id: `u${++itemSeq}`, url, preview: previewSrc(url) ?? url })

export default function CrudModal({ mode, product, onSubmit, onClose, currentZone }: CrudModalProps) {
  const { zones, getZoneById } = useZones()
  const { can } = useAuth()

  // Create: 1) main category  2) category inside it  3) details. Edit: details only.
  const [step, setStep]   = useState<'main' | 'category' | 'details'>('main')
  const [codes, setCodes] = useState('')

  // Category — chosen from ledlum_categories (not free text), so renaming a
  // category in one place renames it on every product.
  const [categories, setCategories]       = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoryId, setCategoryId]       = useState<string>('')   // '' = none, NEW_CATEGORY = adding
  const [categorySearch, setCategorySearch] = useState('')
  const [newCategory, setNewCategory]     = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  // Main category = ledlum_products.collection (Indoor / Outdoor / Artizan …),
  // listed from the live catalogue taxonomy.
  const [mainCategories, setMainCategories] = useState<MainCategoryOption[]>([])
  const [collection, setCollection]   = useState('')
  const [newMain, setNewMain]         = useState('')

  const [hero, setHero]                   = useState<ImageItem | null>(null)
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [zonesOpen, setZonesOpen]         = useState(false)
  const zonesRef = useRef<HTMLDivElement>(null)
  const [specsOpen, setSpecsOpen]         = useState(false)

  // Real-schema specification fields (all optional)
  const [family, setFamily]                 = useState('')
  const [productType, setProductType]       = useState('')
  const [heroDescription, setHeroDescription] = useState('')
  const [galleryImages, setGalleryImages]   = useState<ImageItem[]>([])
  const [galleryUrl, setGalleryUrl]         = useState('')

  // Images picked from disk stay in the browser (object-URL previews) and are
  // only uploaded to R2 when the product is saved — cancelling uploads nothing.
  const heroInputRef    = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const objectUrls      = useRef(new Set<string>())
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [uploadError, setUploadError]       = useState('')
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
  const [dp, setDp]                         = useState('')   // D.P. (dealer price), rupees

  const [loading, setLoading] = useState(false)
  const isOpen = mode !== null

  // Load categories + main categories whenever the modal opens, then pick the
  // product's current ones in edit mode.
  useEffect(() => {
    if (!mode) return
    let cancelled = false
    setCategoriesLoading(true); setCategoryError(''); setNewCategory(''); setCategorySearch('')

    fetch('/api/product-categories')
      .then(res => res.json())
      .then((data: CategoryOption[] | { error: string }) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setCategories(list)
        if (mode === 'edit' && product) {
          // Prefer the linked id; fall back to matching the name for products
          // saved before categories had their own table.
          const match = product.category_id
            ? list.find(c => c.id === product.category_id)
            : list.find(c => c.name.toLowerCase() === (product.group_name ?? product.Category ?? '').trim().toLowerCase())
          setCategoryId(match ? String(match.id) : '')
        } else {
          setCategoryId('')
        }
      })
      .catch(() => { if (!cancelled) setCategoryError('Could not load categories') })
      .finally(() => { if (!cancelled) setCategoriesLoading(false) })

    fetch('/api/product-taxonomy')
      .then(res => res.json())
      .then((data: { name: string; label: string; count: number }[]) => {
        if (cancelled || !Array.isArray(data)) return
        setMainCategories(
          data.filter(c => c.name && c.name !== 'Uncategorized')
            .map(c => ({ name: c.name, label: c.label, count: c.count }))
        )
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [mode, product])

  // Reset the form when opening.
  useEffect(() => {
    if (mode === 'edit' && product) {
      setCodes(product.model ?? product.Codes)
      const heroUrl = product.hero_image ?? product.ImageLink ?? ''
      setHero(heroUrl ? urlItem(heroUrl) : null)
      setSelectedZones(product.zones?.length ? product.zones : product.zone ? [product.zone] : [])
      setFamily(product.family ?? '')
      setCollection(product.collection ?? '')
      setProductType(product.product_type ?? '')
      setHeroDescription(product.hero_description ?? '')
      setGalleryImages((product.gallery_images ?? []).map(urlItem))
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
      setDp(product.prices?.['D.P.'] != null ? String(product.prices['D.P.']) : '')
      setSpecsOpen(false)
      setStep('details')
    } else if (mode === 'create') {
      setCodes(''); setHero(null)
      setFamily(''); setCollection(''); setProductType('')
      setHeroDescription(''); setGalleryImages([]); setWatts(''); setDimensions('')
      setCutoutSize(''); setBodyColors(''); setCct(''); setBeamAngle('')
      setIpRating(''); setLedChip(''); setLuminous(''); setCri(''); setWebsite(''); setDp('')
      setSpecsOpen(false)
      setSelectedZones(currentZone ? [currentZone] : [])
      setStep('main')
    }
    setNewMain(''); setZonesOpen(false); setGalleryUrl(''); setUploadError(''); setUploadProgress(null)
  }, [mode, product, currentZone])

  // ── Images (picked locally; uploaded on save) ──
  const fileItem = (file: File): ImageItem => {
    const preview = URL.createObjectURL(file)
    objectUrls.current.add(preview)
    return { id: `f${++itemSeq}`, file, preview }
  }
  const releasePreview = (item: ImageItem | null | undefined) => {
    if (item?.file && objectUrls.current.has(item.preview)) {
      URL.revokeObjectURL(item.preview)
      objectUrls.current.delete(item.preview)
    }
  }
  // Free all local previews when the modal closes/reopens or unmounts.
  useEffect(() => {
    const urls = objectUrls.current
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); urls.clear() }
  }, [mode, product])

  const handleHeroFile = (files: FileList | null) => {
    const file = files?.[0]
    if (heroInputRef.current) heroInputRef.current.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadError(`${file.name} is not an image`); return }
    setUploadError('')
    releasePreview(hero)
    setHero(fileItem(file))
  }

  const handleGalleryFiles = (files: FileList | null) => {
    const list = Array.from(files ?? [])
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    const images = list.filter(f => f.type.startsWith('image/'))
    setUploadError(images.length < list.length ? 'Some files were skipped because they are not images' : '')
    if (images.length) setGalleryImages(prev => [...prev, ...images.map(fileItem)])
  }

  const setHeroUrl = (value: string) => {
    releasePreview(hero)
    setHero(value.trim() ? { ...urlItem(value), url: value } : null)
  }

  const addGalleryUrl = () => {
    const urls = toList(galleryUrl).filter(u => /^https?:\/\//i.test(u))
    if (urls.length) setGalleryImages(prev => [...prev, ...urls.filter(u => !prev.some(p => p.url === u)).map(urlItem)])
    setGalleryUrl('')
  }
  const removeGalleryImage = (i: number) => setGalleryImages(prev => {
    releasePreview(prev[i])
    return prev.filter((_, idx) => idx !== i)
  })
  const moveGalleryImage = (i: number, dir: -1 | 1) => setGalleryImages(prev => {
    const j = i + dir
    if (j < 0 || j >= prev.length) return prev
    const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]
    return next
  })
  // Gallery image → hero; the old hero (if any) goes back into the gallery.
  const makeHero = (i: number) => {
    const item = galleryImages[i]
    setGalleryImages(prev => {
      const rest = prev.filter((_, idx) => idx !== i)
      return hero ? [hero, ...rest] : rest
    })
    setHero(item)
  }

  /** Uploads every pending file (hero + gallery) to R2 and returns the final
   * URLs. Uploaded items are swapped to URL items in state as they finish, so
   * a retry after a failure doesn't upload them twice. */
  const uploadPendingImages = async (): Promise<{ heroUrl: string; galleryUrls: string[] }> => {
    const opts = {
      collection: mainValue || undefined,
      model: codes.trim() || undefined,
    }
    const pending = [
      ...(hero?.file ? [{ item: hero, kind: 'hero' as const }] : []),
      ...galleryImages.filter(g => g.file).map(item => ({ item, kind: 'gallery' as const })),
    ]
    const uploaded = new Map<string, string>()   // item id -> url
    if (pending.length) {
      setUploadProgress({ done: 0, total: pending.length })
      const failures: string[] = []
      await Promise.all(pending.map(async ({ item, kind }) => {
        try {
          const url = await uploadProductImage(item.file!, { ...opts, kind })
          uploaded.set(item.id, url)
          setUploadProgress(p => p && { ...p, done: p.done + 1 })
        } catch (err) {
          failures.push(`${item.file!.name}: ${err instanceof Error ? err.message : 'Upload failed'}`)
        }
      }))
      // Keep what succeeded (as URLs) so a retry only re-sends the failures.
      const swap = (it: ImageItem) => {
        const url = uploaded.get(it.id)
        if (!url) return it
        releasePreview(it)
        return urlItem(url)
      }
      setHero(h => h && swap(h))
      setGalleryImages(prev => prev.map(swap))
      if (failures.length) throw new Error(`Couldn't upload ${failures.length} image${failures.length === 1 ? '' : 's'} — ${failures.join('; ')}`)
    }
    const urlOf = (it: ImageItem) => it.url ?? uploaded.get(it.id) ?? ''
    return {
      heroUrl: hero ? urlOf(hero) : '',
      galleryUrls: galleryImages.map(urlOf).filter(Boolean),
    }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (zonesOpen) setZonesOpen(false)
      else onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, zonesOpen])

  // Close the zone dropdown on outside click.
  useEffect(() => {
    if (!zonesOpen) return
    const onDown = (e: MouseEvent) => {
      if (zonesRef.current && !zonesRef.current.contains(e.target as Node)) setZonesOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [zonesOpen])

  const toggleZone = (id: string) => {
    setSelectedZones(prev => prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id])
  }

  const handleAddCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    setAddingCategory(true); setCategoryError('')
    try {
      // New categories are created inside the chosen main category.
      const res  = await authFetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, collection: collection && collection !== NEW_MAIN ? collection : null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setCategoryError(data.error ?? 'Could not add category'); return }
      setCategories(prev => [...prev, data as CategoryOption].sort((a, b) => a.name.localeCompare(b.name)))
      setCategoryId(String(data.id))
      setNewCategory('')
      if (step === 'category') setStep('details')
    } finally {
      setAddingCategory(false)
    }
  }

  const pickMain = (name: string) => {
    setCollection(name)
    // Keep the category only if it belongs to this main category.
    const current = categories.find(c => String(c.id) === categoryId)
    if (current && current.collection && current.collection !== name) setCategoryId('')
    setCategorySearch('')
    setStep('category')
  }

  const pickCategory = (id: number) => {
    setCategoryId(String(id))
    const cat = categories.find(c => c.id === id)
    if (cat?.collection && !collection) setCollection(cat.collection)
    setStep('details')
  }

  // Details-step dropdowns: changing the category fills in its main category;
  // changing the main category clears a category that doesn't belong to it.
  const changeCategory = (value: string) => {
    setCategoryId(value); setCategoryError('')
    const cat = categories.find(c => String(c.id) === value)
    if (cat?.collection) setCollection(cat.collection)
  }
  const changeMain = (value: string) => {
    setCollection(value); setNewMain('')
    const current = categories.find(c => String(c.id) === categoryId)
    if (value && value !== NEW_MAIN && current?.collection && current.collection !== value) setCategoryId('')
  }

  const selectedCategory = categories.find(c => String(c.id) === categoryId)
  const mainValue = collection === NEW_MAIN ? newMain.trim().toLowerCase() : collection
  // D.P.: blank = no price; otherwise a non-negative number (commas allowed).
  const dpText  = dp.replace(/[,₹\s]/g, '')
  const dpValue = dpText === '' ? null : Number(dpText)
  const dpInvalid = dpValue !== null && (!Number.isFinite(dpValue) || dpValue < 0)
  const canSubmit = !!codes.trim() && categoryId !== NEW_CATEGORY && collection !== NEW_MAIN && !loading && !dpInvalid

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true); setUploadError('')
    try {
      // 1) Upload any picked images now — only when the product is actually saved.
      let images: { heroUrl: string; galleryUrls: string[] }
      try {
        images = await uploadPendingImages()
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Image upload failed')
        return
      } finally {
        setUploadProgress(null)
      }

      // 2) Save the product with the final image URLs.
      await onSubmit({
        Codes: codes.trim(),
        Category: selectedCategory?.name ?? 'Uncategorized',
        category_id: selectedCategory?.id ?? null,
        ImageLink: images.heroUrl.trim(),
        zones: selectedZones,
        family: family.trim() || undefined,
        collection: mainValue || undefined,
        product_type: productType.trim() || undefined,
        hero_description: heroDescription.trim() || undefined,
        gallery_images: images.galleryUrls,
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
        // Only sent when set now or previously set (so it can be cleared).
        ...(dpValue !== null || product?.prices?.['D.P.'] != null ? { dp: dpValue } : {}),
      })
      onClose()
    } finally { setLoading(false) }
  }

  const inputCls = "w-full border border-gray-mid rounded-xl px-4 py-3 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
  const labelCls = "block text-xs font-semibold font-pop text-foreground uppercase tracking-wide mb-1.5"
  const specInputCls = "w-full border border-gray-mid rounded-lg px-3 py-2 text-xs font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
  const specLabelCls = "block text-[10px] font-semibold font-pop text-gray-dark uppercase tracking-wide mb-1"
  const chevron = <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>

  const selectedZoneLabels = selectedZones.map(id => getZoneById(id)?.label ?? id).join(', ')
  // Main categories = those in the catalogue, plus any only set on a category
  // (e.g. a new one with no products yet), plus the product's current one.
  const mainOptions: MainCategoryOption[] = [...mainCategories]
  const addMainOption = (name: string | null | undefined) => {
    if (name && name !== NEW_MAIN && !mainOptions.some(m => m.name === name)) {
      mainOptions.push({ name, label: titleCase(name), count: 0 })
    }
  }
  categories.forEach(c => addMainOption(c.collection))
  addMainOption(collection)
  const mainLabel = (name: string) => mainOptions.find(m => m.name === name)?.label ?? titleCase(name)

  // Categories inside the chosen main category (all of them if none chosen).
  const inMain = (c: CategoryOption) => !collection || collection === NEW_MAIN || c.collection === collection
  const mainCategoryList = categories.filter(inMain)
  // Categories not yet assigned to any main category — offered separately.
  const unassigned = collection && collection !== NEW_MAIN ? categories.filter(c => !c.collection) : []

  const q = categorySearch.trim().toLowerCase()
  const matches = (c: CategoryOption) => !q || c.name.toLowerCase().includes(q)
  const visibleCategories = mainCategoryList.filter(matches)
  const visibleUnassigned = unassigned.filter(matches)

  // Dropdown in details: this main category's categories, plus the selected one if it's elsewhere.
  // (Unassigned ones are listed in their own optgroup, so don't add them twice.)
  const categoryDropdown = selectedCategory && selectedCategory.collection && !inMain(selectedCategory)
    ? [...mainCategoryList, selectedCategory]
    : mainCategoryList

  // Inline "add new category" box — used on the step-1 grid and in the details dropdown.
  const newCategoryBox = (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
      <label className="block text-[10px] font-semibold font-pop text-gray-dark uppercase tracking-wide mb-1">New category name</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
          placeholder="e.g. Pole Light Fixtures"
          autoFocus
          className={`${inputCls} py-2`}
        />
        <button
          type="button"
          onClick={handleAddCategory}
          disabled={!newCategory.trim() || addingCategory}
          className="flex-shrink-0 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors"
        >
          {addingCategory ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => { setCategoryId(''); setNewCategory(''); setCategoryError('') }}
          className="flex-shrink-0 px-3 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  )

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
              {mode === 'create' && step === 'main' && 'Step 1 of 3 — Choose a main category'}
              {mode === 'create' && step === 'category' && `Step 2 of 3 — Choose a category${collection && collection !== NEW_MAIN ? ` in ${mainLabel(collection)}` : ''}`}
              {mode === 'create' && step === 'details' && `Step 3 of 3 — Product details · ${
                [collection && collection !== NEW_MAIN ? mainLabel(collection) : null, selectedCategory?.name].filter(Boolean).join(' › ') || 'No category'
              }`}
              {mode === 'edit' && `Editing ${product?.Codes}`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm flex-shrink-0">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* ── STEP 1: Main category picker ── */}
          {step === 'main' && (
            <div className="px-7 py-5 space-y-3">
              <p className="text-xs text-gray-dark font-pop">Which main category does this product belong to?</p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {mainOptions.map(m => (
                  <button
                    key={m.name}
                    onClick={() => pickMain(m.name)}
                    className={`flex flex-col items-start gap-0.5 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                      collection === m.name
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-mid hover:border-primary/40 hover:bg-gray text-foreground'
                    }`}
                  >
                    <span className="text-base font-bold font-bai">{m.label}</span>
                    <span className="text-[11px] text-gray-dark font-pop">
                      {categories.filter(c => c.collection === m.name).length} categories · {m.count} products
                    </span>
                  </button>
                ))}
              </div>

              {can('create') && (
                collection === NEW_MAIN ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <label className="block text-[10px] font-semibold font-pop text-gray-dark uppercase tracking-wide mb-1">New main category name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMain}
                        onChange={e => setNewMain(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newMain.trim()) {
                            const v = newMain.trim().toLowerCase()
                            if (!mainCategories.some(m => m.name === v)) setMainCategories(prev => [...prev, { name: v, label: titleCase(v), count: 0 }])
                            setNewMain(''); pickMain(v)
                          }
                        }}
                        placeholder="e.g. Architectural"
                        autoFocus
                        className={`${inputCls} py-2`}
                      />
                      <button
                        type="button"
                        disabled={!newMain.trim()}
                        onClick={() => {
                          const v = newMain.trim().toLowerCase()
                          if (!mainCategories.some(m => m.name === v)) setMainCategories(prev => [...prev, { name: v, label: titleCase(v), count: 0 }])
                          setNewMain(''); pickMain(v)
                        }}
                        className="flex-shrink-0 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai"
                      >
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCollection(''); setNewMain('') }}
                        className="flex-shrink-0 px-3 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setCollection(NEW_MAIN); setNewMain('') }}
                    className="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 px-4 py-2.5 text-sm font-semibold font-bai text-primary hover:bg-primary/5"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add new main category
                  </button>
                )
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => { if (collection === NEW_MAIN) setCollection(''); setStep('details') }}
                  className="text-xs font-semibold font-pop text-gray-dark hover:text-primary underline"
                >
                  Skip — choose later
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Category picker (inside the chosen main category) ── */}
          {step === 'category' && (
            <div className="px-7 py-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-dark font-pop">
                  Which category in <strong className="text-foreground">{collection ? mainLabel(collection) : 'the catalogue'}</strong>?
                </p>
                <button
                  onClick={() => setStep('main')}
                  className="flex-shrink-0 text-xs font-semibold font-pop text-primary hover:underline"
                >
                  ← Change main category
                </button>
              </div>

              <input
                type="text"
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                placeholder="Search categories…"
                autoFocus
                className={`${inputCls} py-2.5`}
              />

              {categoryId === NEW_CATEGORY ? (
                newCategoryBox
              ) : can('create') && (
                <button
                  type="button"
                  onClick={() => { setCategoryId(NEW_CATEGORY); setNewCategory(categorySearch.trim()); setCategoryError('') }}
                  className="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 px-4 py-2.5 text-sm font-semibold font-bai text-primary hover:bg-primary/5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add new category{categorySearch.trim() ? ` "${categorySearch.trim()}"` : ''}
                </button>
              )}
              {categoryError && <p className="text-xs text-red-500 font-pop">{categoryError}</p>}

              {categoriesLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : visibleCategories.length === 0 && visibleUnassigned.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-dark font-bai">
                  {q ? 'No categories match — add it as a new category above' : 'No categories here yet — add one above'}
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                  {[{ list: visibleCategories, title: '' }, { list: visibleUnassigned, title: 'Not assigned to a main category' }]
                    .filter(g => g.list.length > 0)
                    .map(g => (
                      <div key={g.title || 'main'}>
                        {g.title && (
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-dark font-pop">{g.title}</p>
                        )}
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {g.list.map(c => (
                            <button
                              key={c.id}
                              onClick={() => pickCategory(c.id)}
                              className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                String(c.id) === categoryId
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-gray-mid hover:border-primary/40 hover:bg-gray text-foreground'
                              }`}
                            >
                              <span className="text-sm font-semibold font-bai truncate">{c.name}</span>
                              <span className="flex-shrink-0 text-[10px] text-gray-dark font-pop">{c.productCount}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setStep('details')}
                  className="text-xs font-semibold font-pop text-gray-dark hover:text-primary underline"
                >
                  Skip — choose later
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 / EDIT: Product details ── */}
          {step === 'details' && (
            <>
              <div className="px-7 py-5 space-y-4">
                <div className="grid grid-cols-[1fr_9rem] gap-3">
                  <div>
                    <label className={labelCls}>
                      Model / Product Code <span className="text-primary">*</span>
                    </label>
                    <input type="text" value={codes} onChange={e => setCodes(e.target.value)}
                      placeholder="e.g. LLF-RD-12W" className={inputCls} autoFocus />
                  </div>
                  <div>
                    <label className={labelCls}>D.P. (₹)</label>
                    <input type="text" inputMode="decimal" value={dp} onChange={e => setDp(e.target.value)}
                      placeholder="e.g. 1250"
                      className={`${inputCls} ${dpInvalid ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`} />
                    {dpInvalid && <p className="mt-1 text-[10px] text-red-500 font-pop">Enter a valid price</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Main category (collection) */}
                  <div>
                    <label className={labelCls}>Main Category</label>
                    <div className="relative">
                      <select value={collection} onChange={e => changeMain(e.target.value)}
                        className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                        <option value="">—</option>
                        {mainOptions.map(m => <option key={m.name} value={m.name}>{m.label}</option>)}
                        {can('create') && <option value={NEW_MAIN}>+ New main category…</option>}
                      </select>
                      {chevron}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className={labelCls}>Category</label>
                    <div className="relative">
                      <select
                        value={categoryId}
                        onChange={e => changeCategory(e.target.value)}
                        disabled={categoriesLoading}
                        className={`${inputCls} appearance-none pr-8 cursor-pointer disabled:opacity-60`}
                      >
                        <option value="">{categoriesLoading ? 'Loading…' : '— Select —'}</option>
                        {categoryDropdown.map(c => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                        {unassigned.length > 0 && (
                          <optgroup label="Not assigned to a main category">
                            {unassigned.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                          </optgroup>
                        )}
                        {can('create') && <option value={NEW_CATEGORY}>+ Add new category…</option>}
                      </select>
                      {chevron}
                    </div>
                  </div>
                </div>

                {collection === NEW_MAIN && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <label className="block text-[10px] font-semibold font-pop text-gray-dark uppercase tracking-wide mb-1">New main category name</label>
                    <input
                      type="text"
                      value={newMain}
                      onChange={e => setNewMain(e.target.value)}
                      onBlur={() => {
                        const v = newMain.trim().toLowerCase()
                        if (v) {
                          if (!mainCategories.some(m => m.name === v)) setMainCategories(prev => [...prev, { name: v, label: titleCase(v), count: 0 }])
                          setCollection(v); setNewMain('')
                        }
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      placeholder="e.g. Architectural"
                      autoFocus
                      className={`${inputCls} py-2`}
                    />
                  </div>
                )}

                {categoryId === NEW_CATEGORY && newCategoryBox}
                {categoryError && <p className="text-xs text-red-500 font-pop">{categoryError}</p>}

                {/* Zones — multi-select dropdown */}
                <div ref={zonesRef} className="relative">
                  <label className={labelCls}>Zone</label>
                  <button
                    type="button"
                    onClick={() => setZonesOpen(o => !o)}
                    className={`${inputCls} relative pr-8 text-left ${selectedZones.length ? '' : 'text-gray-dark'}`}
                  >
                    <span className="block truncate">{selectedZoneLabels || '— Select zone(s) —'}</span>
                    {chevron}
                  </button>
                  {zonesOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-mid bg-white shadow-xl">
                      <div className="max-h-56 overflow-y-auto py-1">
                        {zones.map(z => {
                          const on = selectedZones.includes(z.id)
                          return (
                            <label key={z.id} className="flex cursor-pointer items-center gap-2.5 px-4 py-2 text-sm font-bai hover:bg-gray">
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => toggleZone(z.id)}
                                className="h-4 w-4 accent-[var(--color-primary,#9a8c66)]"
                              />
                              <span className={on ? 'font-semibold text-primary' : 'text-foreground'}>{z.label}</span>
                            </label>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-between border-t border-gray px-4 py-2">
                        <button type="button" onClick={() => setSelectedZones([])}
                          className="text-xs font-semibold text-gray-dark hover:text-primary">Clear</button>
                        <button type="button" onClick={() => setZonesOpen(false)}
                          className="text-xs font-bold text-primary">Done</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hero image — upload or URL */}
                <div>
                  <label className={labelCls}>Hero Image</label>
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-mid bg-white">
                      {hero?.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hero.preview} alt="Hero" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-dark">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      )}
                      {hero?.file && <PendingBadge />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => heroInputRef.current?.click()}
                          disabled={loading}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold font-bai text-white hover:bg-primary-dark disabled:opacity-60"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {hero ? 'Replace' : 'Choose image'}
                        </button>
                        {hero && (
                          <button type="button" onClick={() => setHeroUrl('')} disabled={loading}
                            className="rounded-lg border border-gray-mid px-3 py-2 text-xs font-semibold font-bai text-gray-text hover:border-red-400 hover:text-red-500">
                            Remove
                          </button>
                        )}
                        <input ref={heroInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => handleHeroFile(e.target.files)} />
                      </div>
                      {hero?.file ? (
                        <p className="truncate text-[11px] text-gray-dark font-pop" title={hero.file.name}>
                          {hero.file.name} · uploads when you save
                        </p>
                      ) : (
                        <input type="text" value={hero?.url ?? ''} onChange={e => setHeroUrl(e.target.value)}
                          placeholder="…or paste an image URL" className={`${inputCls} py-2 text-xs`} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Gallery images — upload (multiple) or URL */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={`${labelCls} mb-0`}>Gallery Images {galleryImages.length > 0 && <span className="normal-case text-gray-dark font-normal">({galleryImages.length})</span>}</label>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold font-bai text-primary hover:bg-primary/5"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add images
                    </button>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => handleGalleryFiles(e.target.files)} />
                  </div>

                  {galleryImages.length > 0 && (
                    <div className="mb-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {galleryImages.map((item, i) => (
                        <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-mid bg-white">
                          {item.preview && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.preview} alt={`Gallery ${i + 1}`} className="h-full w-full object-contain" />
                          )}
                          {item.file && <PendingBadge />}
                          <div className="absolute inset-0 flex flex-col justify-between bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <div className="flex justify-between">
                              <button type="button" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0} title="Move left"
                                className="h-6 w-6 rounded bg-white/90 text-xs font-bold text-foreground disabled:opacity-30">‹</button>
                              <button type="button" onClick={() => removeGalleryImage(i)} title="Remove"
                                className="h-6 w-6 rounded bg-white/90 text-xs text-red-500">✕</button>
                            </div>
                            <div className="flex justify-between">
                              <button type="button" onClick={() => makeHero(i)} title="Use as hero image"
                                className="rounded bg-white/90 px-1.5 text-[10px] font-bold text-primary">★ Hero</button>
                              <button type="button" onClick={() => moveGalleryImage(i, 1)} disabled={i === galleryImages.length - 1} title="Move right"
                                className="h-6 w-6 rounded bg-white/90 text-xs font-bold text-foreground disabled:opacity-30">›</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {galleryImages.some(g => g.file) && (
                    <p className="mb-2 text-[11px] text-gray-dark font-pop">
                      Images marked <span className="font-semibold text-amber-700">New</span> upload when you save.
                    </p>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={galleryUrl}
                      onChange={e => setGalleryUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGalleryUrl() } }}
                      placeholder="…or paste image URL(s), comma-separated"
                      className={`${inputCls} py-2 text-xs`}
                    />
                    <button type="button" onClick={addGalleryUrl} disabled={!galleryUrl.trim()}
                      className="flex-shrink-0 rounded-lg border border-gray-mid px-3 text-xs font-semibold font-bai text-gray-text hover:border-primary hover:text-primary disabled:opacity-50">
                      Add
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-red-500 font-pop bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>
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
                      <div className="col-span-2"><label className={specLabelCls}>Description</label>
                        <textarea value={heroDescription} onChange={e => setHeroDescription(e.target.value)} rows={2} className={`${specInputCls} resize-none`} /></div>
                      <div className="col-span-2"><label className={specLabelCls}>Website</label>
                        <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className={specInputCls} /></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-7 py-4 bg-gray border-t border-gray-mid flex justify-between gap-3 flex-shrink-0">
                {mode === 'create' ? (
                  <button onClick={() => setStep('category')}
                    className="px-4 py-2.5 text-sm font-semibold font-bai text-gray-text hover:text-foreground">
                    ← Category
                  </button>
                ) : <span />}
                <div className="flex gap-3">
                  <button onClick={onClose}
                    className="px-5 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground hover:text-foreground transition-colors bg-white">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={!canSubmit}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors">
                    {uploadProgress
                      ? `Uploading images ${uploadProgress.done}/${uploadProgress.total}…`
                      : loading ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
