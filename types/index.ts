export type Role = 'admin' | 'editor' | 'viewer' | 'guest' | 'vendor'

export interface User {
  username: string
  role: Role
  name: string
  initials: string
  email?: string
  company?: string
}

export interface Product {
  id: string
  Codes: string
  Category: string
  ImageLink: string
  source: 'internal' | 'external'
  zone: string
  createdAt: string
  updatedAt?: string | null
  // Rich product detail (optional — only exists for configured products)
  detail?: ProductDetail
}

// ── Rich product detail ──────────────────────────────────────────────
export interface CCTOption {
  label: string
  color: string
}

export interface ProductConfig {
  models?: string[]
  voltage?: string[]
  dimensions?: string[]
  watts?: string[]
  cct?: CCTOption[]
  bodyColors?: string[]
  beamAngles?: string[]
  ipRating?: string[]
  cutoutSizes?: string[]
  ledChip?: string[]
  luminous?: string[]
  cri?: string[]
}

export interface ProductPermutation {
  voltage?: string
  watts?: string
  dimensions?: string
  bodyColor?: string
  beamAngles?: string
  ledChip?: string
  luminous?: string
  cri?: string
  cct?: string
  [key: string]: string | undefined
}

export interface ProductDetail {
  productAbout: {
    category: string
    name: string
    description: string
    image: string
  }
  config: ProductConfig
  permutations: ProductPermutation[]
  gallery: string[]
}

// ── Cart ─────────────────────────────────────────────────────────────
export interface CartSelection {
  [key: string]: string
}

export interface CartItem {
  id: string
  productCode: string
  productName: string
  productImage: string
  zone: string
  selection: CartSelection
  quantity: number
  addedAt: string
}

// ── Auth ─────────────────────────────────────────────────────────────
export interface ProductFormData {
  Codes: string
  Category: string
  ImageLink: string
  zone?: string
}

export interface Stats {
  total: number
  withImage: number
  withoutImage: number
  byCategory: Record<string, number>
  bySource: Record<string, number>
}

export interface ApiResponse<T> {
  data: T
  meta?: { total: number; page: number; limit: number; pages: number }
}

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export interface Permissions {
  create: boolean
  edit: boolean
  delete: boolean
  cart: boolean
}
