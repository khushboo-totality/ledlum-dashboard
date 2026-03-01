// In-memory vendor store — replace with DB in production
// Admin creates vendors here; they can then log in

export interface VendorRecord {
  username: string
  password: string
  name: string
  company: string
  email: string
  initials: string
  createdAt: string
}

const global = globalThis as typeof globalThis & { __vendors?: VendorRecord[] }
if (!global.__vendors) {
  global.__vendors = [
    {
      username: 'vendor1', password: 'vendor123',
      name: 'Acme Lighting', company: 'Acme Lighting Co.',
      email: 'orders@acmelighting.com', initials: 'AC',
      createdAt: new Date().toISOString(),
    },
    {
      username: 'vendor2', password: 'vendor456',
      name: 'BrightSpace', company: 'BrightSpace Interiors',
      email: 'purchase@brightspace.in', initials: 'BS',
      createdAt: new Date().toISOString(),
    },
  ]
}

export const vendorStore = {
  getAll(): VendorRecord[] {
    return [...global.__vendors!]
  },
  getByUsername(username: string): VendorRecord | null {
    return global.__vendors!.find(v => v.username === username.toLowerCase()) ?? null
  },
  create(data: Omit<VendorRecord, 'initials' | 'createdAt'>): VendorRecord | { error: string } {
    const exists = global.__vendors!.find(v => v.username === data.username.toLowerCase())
    if (exists) return { error: 'Username already exists' }
    const initials = data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const vendor: VendorRecord = {
      ...data,
      username:  data.username.toLowerCase(),
      initials,
      createdAt: new Date().toISOString(),
    }
    global.__vendors!.push(vendor)
    return vendor
  },
  delete(username: string): boolean {
    const idx = global.__vendors!.findIndex(v => v.username === username)
    if (idx === -1) return false
    global.__vendors!.splice(idx, 1)
    return true
  },
}
