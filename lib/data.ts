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
]

// In-memory storage (for demo purposes)
let products: Product[] = SEED.map(p => ({
  ...p,
  id: uuidv4(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

export const dataStore = {
  getProducts(zone?: string, filters?: { search?: string; category?: string; source?: string }) {
    let list = [...products]
    
    if (zone) {
      list = list.filter(p => p.zone === zone)
    }
    
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(p => 
        p.Codes.toLowerCase().includes(q) || 
        p.Category.toLowerCase().includes(q)
      )
    }
    
    if (filters?.category) {
      list = list.filter(p => p.Category === filters.category)
    }
    
    if (filters?.source) {
      list = list.filter(p => p.source === filters.source)
    }
    
    return list
  },

  getCategories(zone?: string) {
    const productList = zone ? products.filter(p => p.zone === zone) : products
    return Array.from(new Set(productList.map(p => p.Category)))
  },

  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date().toISOString()
    const newProduct: Product = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }
    products.unshift(newProduct)
    return newProduct
  },

  updateProduct(id: string, data: Partial<Product>): Product {
    const index = products.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Product not found')
    
    products[index] = {
      ...products[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    return products[index]
  },

  deleteProduct(id: string) {
    const index = products.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Product not found')
    products.splice(index, 1)
  },

  getStats(zone?: string) {
    const productList = zone ? products.filter(p => p.zone === zone) : products
    return {
      total: productList.length,
      withImage: productList.filter(p => p.ImageLink && p.ImageLink.length > 2).length,
      withoutImage: productList.filter(p => !p.ImageLink || p.ImageLink.length <= 2).length,
      byCategory: productList.reduce((acc, p) => { acc[p.Category] = (acc[p.Category] || 0) + 1; return acc }, {} as Record<string, number>),
      bySource: productList.reduce((acc, p) => { acc[p.source] = (acc[p.source] || 0) + 1; return acc }, {} as Record<string, number>),
    }
  }
}
