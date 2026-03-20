// Client-side in-memory + localStorage store
// Mirrors lib/db.ts but runs entirely in the browser — no API routes needed
// Used for static export (Netlify). Swap useProducts to use server db for server deployments.

import { v4 as uuidv4 } from 'uuid'
import type { Product, ProductFormData } from '@/types'

const STORAGE_KEY = 'ledlum_products_v1'

// ── Seed data (same as lib/db.ts) ──────────────────────────────────────
const SEED: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ── ZONE A ──
  { Codes: 'LLO-129G',        Category: 'Floor',   ImageLink: '',                                                                                         source: 'internal', zone: 'zone-a' },
  { Codes: 'LB-175',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=600',                        source: 'internal', zone: 'zone-a' },
  { Codes: 'LB-218',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',                           source: 'internal', zone: 'zone-a' },
  { Codes: 'LB-263',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',                        source: 'internal', zone: 'zone-a' },
  { Codes: 'LPL-007',         Category: 'Ceiling', ImageLink: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',                           source: 'internal', zone: 'zone-a' },
  // ── ZONE B ──
  { Codes: 'LLWW-021',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1aORj09x0zMpXs365dHiQEOPpIpf1PxtC/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-006',         Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1K5fO2P7OId_eKIBg33xdM_BQ-NFhlbU3/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-006A',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1dGdjZFAoJ_ZlfeY9aXgazcsP8alPQcPG/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-094',         Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1XnVAj-dfQnZYESQDVwkK7iUEwYyQxtPP/view?usp=drivesdk',     source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-1014',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/19zbftFIOIzgWn_WqmoMI2EeYKt42IWlx/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-1032',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/16C1t7PYTl2t10moQjXAywiyKi54HgNVA/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-1049',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1KAljitOSuy17qh-09cwjdFM01Cs-f0wj/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099B',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1eZRS3w73LD1Z-hlbgvQQyHmmYKASkQqd/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099G',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1uFyjKlhtbxxqesV76Drw3nROzoBoWdzR/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099J',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/195lhRv4NrQ8D7bwSuCOofRpR185tJdf1/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099M',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1JbpJpeb1lt4ZB3dlsKIYVdZKPad9549K/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099R',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1GV_NuqSgVQQCj5A2PQGG6Hx18PY4V4v4/view?usp=drivesdk',     source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099V',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1UuKe8MSwcneqTmjci1IOxSnmq0VklGUV/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099W',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/17_46ivAaKq-VuuU-IVYoQdZa3ENShna_/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'HEMNORD',         Category: 'Ceiling', ImageLink: '',                                                                                         source: 'internal', zone: 'zone-b' },
  // ── ZONE C ──
  { Codes: 'LSO-038',         Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600',                        source: 'internal', zone: 'zone-c' },
  { Codes: 'LB-249',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=600',                        source: 'internal', zone: 'zone-c' },
  { Codes: 'LB-265',          Category: 'Floor',   ImageLink: '',                                                                                         source: 'internal', zone: 'zone-c' },
  { Codes: 'LB-272',          Category: 'Ceiling', ImageLink: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600',                        source: 'internal', zone: 'zone-c' },
  // ── ZONE E ──
  { Codes: 'LPL-010',         Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=600',                        source: 'internal', zone: 'zone-e' },
  { Codes: 'LLO-124',         Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',                        source: 'internal', zone: 'zone-e' },
  { Codes: 'WNSP5884',        Category: 'Ceiling', ImageLink: '',                                                                                         source: 'internal', zone: 'zone-e' },
  // ── ZONE G ──
  { Codes: 'LPL-028',         Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600',                        source: 'internal', zone: 'zone-g' },
  { Codes: 'LLO-129K',        Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600',                           source: 'internal', zone: 'zone-g' },
  { Codes: 'LB-228',          Category: 'Ceiling', ImageLink: '',                                                                                         source: 'internal', zone: 'zone-g' },
  // ── ARTIZAN ──
  { Codes: 'LLO-129I',        Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600',                        source: 'internal', zone: 'artizan' },
  { Codes: 'KAPEGO-D1DA3034', Category: 'Ceiling', ImageLink: '',                                                                                         source: 'internal', zone: 'artizan' },
  // ── CONFERENCE ──
  { Codes: 'LLO-129P',        Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600',                        source: 'internal', zone: 'conference' },
  { Codes: 'WNSP-75105',      Category: 'Ceiling', ImageLink: '',                                                                                         source: 'internal', zone: 'conference' },
  // ── SUMEET ──
  { Codes: 'LB-166',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600',                        source: 'internal', zone: 'sumeet' },
  { Codes: 'LLO-129G',        Category: 'Wall',    ImageLink: '',                                                                                         source: 'internal', zone: 'sumeet' },
  // ── ABHEEK ──
  { Codes: 'LB-266',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',                           source: 'internal', zone: 'abheek' },
  // ── POOJA ──
  { Codes: 'LB-252',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600',                        source: 'internal', zone: 'pooja' },
  // ── PODCAST ──
  { Codes: 'LPL-002',         Category: 'Ceiling', ImageLink: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',                           source: 'internal', zone: 'podcast' },
  // ── ABHAV ──
  { Codes: 'LB-263',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',                           source: 'internal', zone: 'abhav' },
  // ── ARTIZAN JEWELLERY ──
  { Codes: 'LLWW-021',        Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600',                        source: 'internal', zone: 'artizan-jewellery' },
]

// ── In-memory store (initialised once per tab from localStorage or seed) ──
let _products: Product[] | null = null

function load(): Product[] {
  if (_products) return _products
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      _products = JSON.parse(raw) as Product[]
      return _products
    }
  } catch {}
  // First load — seed
  _products = SEED.map(p => ({
    ...p,
    id:        uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: null,
  }))
  save()
  return _products
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_products)) } catch {}
}

// ── Public API (mirrors lib/db.ts) ────────────────────────────────────
export const clientDb = {
  getAll(filters?: { search?: string; category?: string; source?: string; zone?: string }): Product[] {
    let list = [...load()]
    if (filters?.zone)     list = list.filter(p => p.zone === filters.zone)
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(p => p.Codes.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q))
    }
    if (filters?.category) list = list.filter(p => p.Category === filters.category)
    if (filters?.source)   list = list.filter(p => p.source   === filters.source)
    return list
  },

  getById(id: string): Product | null {
    return load().find(p => p.id === id) ?? null
  },

  create(data: ProductFormData): Product {
    const product: Product = {
      Codes:       data.Codes,
      Category:    data.Category || 'Uncategorized',
      ImageLink:   data.ImageLink || '',
      zone:        data.zone || 'zone-a',
      source:      'internal',
      id:          uuidv4(),
      createdAt:   new Date().toISOString(),
      updatedAt:   null,
    }
    load().unshift(product)
    save()
    return product
  },

  update(id: string, data: Partial<ProductFormData>): Product | null {
    const list = load()
    const idx = list.findIndex(p => p.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...data, id, updatedAt: new Date().toISOString() }
    save()
    return list[idx]
  },

  delete(id: string): boolean {
    const list = load()
    const idx = list.findIndex(p => p.id === id)
    if (idx === -1) return false
    list.splice(idx, 1)
    save()
    return true
  },

  syncExternal(records: Partial<Product>[], zone?: string): { added: number; updated: number } {
    let added = 0, updated = 0
    const list = load()
    for (const raw of records) {
      const code = raw.Codes || ''
      const existing = list.find(p => p.Codes === code && p.zone === (zone || raw.zone))
      if (existing) {
        clientDb.update(existing.id, { ...raw, source: 'external' } as ProductFormData)
        updated++
      } else {
        clientDb.create({ Codes: code, Category: raw.Category || 'Uncategorized', ImageLink: raw.ImageLink || '', zone: zone || raw.zone || 'zone-a' })
        added++
      }
    }
    return { added, updated }
  },

  getCategories(zone?: string): string[] {
    const list = zone ? load().filter(p => p.zone === zone) : load()
    return Array.from(new Set(list.map(p => p.Category)))
  },

  /** Reset to seed data (useful for dev) */
  reset() {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    _products = null
  },
}