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
  ImageLink?: string
  imageUrl?: string
  Price?: string
  Wattage?: string
  ColourTemp?: string
  BeamAngle?: string
  Finish?: string
  Dimensions?: string
  Description?: string
  source: 'internal' | 'external'
  zone: string
  createdAt?: string
  updatedAt?: string | null
  detail?: ProductDetail

  // ── Real Supabase (ledlum_products) fields — populated for zone-mode
  // products, absent for "Browse by Product Type" mock data. Display
  // components should prefer these when present, falling back to the
  // legacy fields above otherwise.
  zones?: string[]
  model?: string
  family?: string | null
  group_name?: string
  collection?: string
  hero_image?: string | null
  hero_description?: string | null
  gallery_images?: string[]
  watts?: string | null
  cutout_size?: string | null
  body_colors?: string[]
  cct?: string[]
  beam_angle?: string | null
  ip_rating?: string | null
  led_chip?: string | null
  luminous?: string | null
  cri?: string | null
  website?: string | null
  product_type?: string | null
  extra_specs?: Record<string, string> | null
}

// ── Rich product detail ──────────────────────────────────────────────
export interface CCTOption {
  label: string
  color: string
}

export interface ConfigOption {
  id: string
  label: string
  values: string[]
}

export interface ProductPermutation {
  [key: string]: string
}

export interface ProductAbout {
  category: string
  name: string
  description: string
  image?: string
}

export interface ProductDetail {
  productAbout?: ProductAbout
  config?: Record<string, any>
  permutations?: ProductPermutation[]
  gallery?: string[]
}

export interface Permissions {
  create: boolean
  edit: boolean
  delete: boolean
  cart: boolean
  share: boolean
  download: boolean
}

export interface CartSelection {
  [key: string]: string
}

// ── Cart ─────────────────────────────────────────────────────────────
export type BrowseMode = 'zone' | 'product'

export interface CartItem {
  id: string
  productCode: string
  productName: string
  productImage: string
  // Context — zone browsing
  zone: string
  // Context — product type browsing
  browseMode: BrowseMode
  productCategory?: string        // e.g. "Indoor Lighting"
  productSubcategory?: string     // e.g. "Downlights"
  productTypeName?: string        // e.g. "Recessed Downlights"
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
  zones?: string[]
  family?: string
  collection?: string
  hero_description?: string
  gallery_images?: string[]
  watts?: string
  dimensions?: string
  cutout_size?: string
  body_colors?: string[]
  cct?: string[]
  beam_angle?: string
  ip_rating?: string
  led_chip?: string
  luminous?: string
  cri?: string
  website?: string
  product_type?: string
}

export interface Stats {
  total: number
  withImage: number
  withoutImage: number
  byCategory: Record<string, number>
  bySource: Record<string, number>
}

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
}
