import { v4 as uuidv4 } from 'uuid'
import type { Product } from '@/types'

// In production replace with Prisma/MongoDB/Supabase
const SEED: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ── ZONE A ──
  { Codes: 'LLO-129G',        Category: 'Floor',   ImageLink: '',                                                                                          source: 'internal', zone: 'zone-a' },
  { Codes: 'LB-175',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=600',                         source: 'internal', zone: 'zone-a' },
  { Codes: 'LB-218',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',                            source: 'internal', zone: 'zone-a' },
  { Codes: 'LB-263',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',                         source: 'internal', zone: 'zone-a' },
  { Codes: 'LPL-007',         Category: 'Ceiling', ImageLink: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',                            source: 'internal', zone: 'zone-a' },

  // ── ZONE B ──
  { Codes: 'LLWW-021',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1aORj09x0zMpXs365dHiQEOPpIpf1PxtC/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-006',         Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1K5fO2P7OId_eKIBg33xdM_BQ-NFhlbU3/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-006A',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1dGdjZFAoJ_ZlfeY9aXgazcsP8alPQcPG/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-094',         Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1XnVAj-dfQnZYESQDVwkK7iUEwYyQxtPP/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-1014',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/19zbftFIOIzgWn_WqmoMI2EeYKt42IWlx/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-1032',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/16C1t7PYTl2t10moQjXAywiyKi54HgNVA/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-1049',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1KAljitOSuy17qh-09cwjdFM01Cs-f0wj/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099B',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1eZRS3w73LD1Z-hlbgvQQyHmmYKASkQqd/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099G',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1uFyjKlhtbxxqesV76Drw3nROzoBoWdzR/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099J',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/195lhRv4NrQ8D7bwSuCOofRpR185tJdf1/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099M',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1JbpJpeb1lt4ZB3dlsKIYVdZKPad9549K/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099R',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1GV_NuqSgVQQCj5A2PQGG6Hx18PY4V4v4/view?usp=drivesdk',      source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099V',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/1UuKe8MSwcneqTmjci1IOxSnmq0VklGUV/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'LLO-099W',        Category: 'Wall',    ImageLink: 'https://drive.google.com/file/d/17_46ivAaKq-VuuU-IVYoQdZa3ENShna_/view?usp=drivesdk',       source: 'internal', zone: 'zone-b' },
  { Codes: 'HEMNORD',         Category: 'Ceiling', ImageLink: '',                                                                                          source: 'internal', zone: 'zone-b' },

  // ── ZONE C ──
  { Codes: 'LSO-038',         Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600',                         source: 'internal', zone: 'zone-c' },
  { Codes: 'LB-249',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=600',                         source: 'internal', zone: 'zone-c' },
  { Codes: 'LB-265',          Category: 'Floor',   ImageLink: '',                                                                                          source: 'internal', zone: 'zone-c' },
  { Codes: 'LB-272',          Category: 'Ceiling', ImageLink: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600',                         source: 'internal', zone: 'zone-c' },

  // ── ZONE E ──
  { Codes: 'LPL-010',         Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=600',                         source: 'internal', zone: 'zone-e' },
  { Codes: 'LLO-124',         Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',                         source: 'internal', zone: 'zone-e' },
  { Codes: 'WNSP5884',        Category: 'Ceiling', ImageLink: '',                                                                                          source: 'internal', zone: 'zone-e' },

  // ── ZONE G ──
  { Codes: 'LPL-028',         Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600',                         source: 'internal', zone: 'zone-g' },
  { Codes: 'LLO-129K',        Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600',                            source: 'internal', zone: 'zone-g' },
  { Codes: 'LB-228',          Category: 'Ceiling', ImageLink: '',                                                                                          source: 'internal', zone: 'zone-g' },

  // ── ARTIZAN ──
  { Codes: 'LLO-129I',        Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600',                         source: 'internal', zone: 'artizan' },
  { Codes: 'KAPEGO-D1DA3034', Category: 'Ceiling', ImageLink: '',                                                                                          source: 'internal', zone: 'artizan' },

  // ── CONFERENCE ──
  { Codes: 'LLO-129P',        Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600',                         source: 'internal', zone: 'conference' },
  { Codes: 'WNSP-75105',      Category: 'Ceiling', ImageLink: '',                                                                                          source: 'internal', zone: 'conference' },

  // ── SUMEET ──
  { Codes: 'LB-166',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600',                         source: 'internal', zone: 'sumeet' },
  { Codes: 'LLO-129G',        Category: 'Wall',    ImageLink: '',                                                                                          source: 'internal', zone: 'sumeet' },

  // ── ABHEEK ──
  { Codes: 'LB-266',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',                            source: 'internal', zone: 'abheek' },

  // ── POOJA ──
  { Codes: 'LLO-129P',        Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=600',                         source: 'internal', zone: 'pooja' },

  // ── PODCAST ──
  { Codes: 'LPL-007',         Category: 'Ceiling', ImageLink: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',                         source: 'internal', zone: 'podcast' },

  // ── ABHAV ──
  { Codes: 'LB-263',          Category: 'Floor',   ImageLink: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',                            source: 'internal', zone: 'abhav' },

  // ── ARTIZAN JEWELLERY ──
  { Codes: 'LLWW-021',        Category: 'Wall',    ImageLink: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600',                         source: 'internal', zone: 'artizan-jewellery' },
]

const globalStore = globalThis as typeof globalThis & { __products?: Product[] }
if (!globalStore.__products) {
  globalStore.__products = SEED.map(p => ({
    ...p,
    id:        uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: null,
  }))
}

export const db = {
  getAll(filters?: { search?: string; category?: string; source?: string; zone?: string }) {
    let products = [...globalStore.__products!]
    if (filters?.zone)     products = products.filter(p => p.zone === filters.zone)
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      products = products.filter(p => p.Codes.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q))
    }
    if (filters?.category) products = products.filter(p => p.Category === filters.category)
    if (filters?.source)   products = products.filter(p => p.source === filters.source)
    return products
  },
  getById(id: string) {
    return globalStore.__products!.find(p => p.id === id) ?? null
  },
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const product: Product = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: null }
    globalStore.__products!.unshift(product)
    return product
  },
  update(id: string, data: Partial<Product>) {
    const idx = globalStore.__products!.findIndex(p => p.id === id)
    if (idx === -1) return null
    globalStore.__products![idx] = { ...globalStore.__products![idx], ...data, id, updatedAt: new Date().toISOString() }
    return globalStore.__products![idx]
  },
  delete(id: string) {
    const idx = globalStore.__products!.findIndex(p => p.id === id)
    if (idx === -1) return false
    globalStore.__products!.splice(idx, 1)
    return true
  },
  syncExternal(records: Partial<Product>[], zone?: string) {
    let added = 0, updated = 0
    for (const raw of records) {
      const code = raw.Codes || ''
      const existing = globalStore.__products!.find(p => p.Codes === code && p.zone === (zone || raw.zone))
      if (existing) {
        db.update(existing.id, { ...raw, source: 'external' })
        updated++
      } else {
        db.create({ Codes: code, Category: raw.Category || 'Uncategorized', ImageLink: raw.ImageLink || '', source: 'external', zone: zone || raw.zone || 'zone-a' })
        added++
      }
    }
    return { added, updated }
  },
  getStats(zone?: string) {
    const products = zone ? globalStore.__products!.filter(p => p.zone === zone) : globalStore.__products!
    return {
      total:        products.length,
      withImage:    products.filter(p => p.ImageLink && p.ImageLink.length > 2).length,
      withoutImage: products.filter(p => !p.ImageLink || p.ImageLink.length <= 2).length,
      byCategory:   products.reduce((acc, p) => { acc[p.Category] = (acc[p.Category] || 0) + 1; return acc }, {} as Record<string, number>),
      bySource:     products.reduce((acc, p) => { acc[p.source]   = (acc[p.source]   || 0) + 1; return acc }, {} as Record<string, number>),
    }
  },
  getCategories(zone?: string) {
    const products = zone ? globalStore.__products!.filter(p => p.zone === zone) : globalStore.__products!
    return Array.from(new Set(products.map(p => p.Category)))
  },
}
