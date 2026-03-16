import type { Role, User, Permissions } from '@/types'
import { vendorStore } from '@/lib/vendorStore'

export const STAFF_USERS: Record<string, { password: string; role: Role; name: string; initials: string; email?: string }> = {
  admin:  { password: 'admin123', role: 'admin',  name: 'Admin',  initials: 'AD', email: 'admin@ledlum.com'  },
  editor: { password: 'edit123',  role: 'editor', name: 'Editor', initials: 'ED', email: 'editor@ledlum.com' },
  viewer: { password: 'view123',  role: 'viewer', name: 'Viewer', initials: 'VW', email: 'viewer@ledlum.com' },
}

// ALL roles get share + download
export const PERMISSIONS: Record<Role, Permissions> = {
  admin:  { create: true,  edit: true,  delete: true,  cart: false, share: true, download: true  },
  editor: { create: true,  edit: true,  delete: false, cart: false, share: true, download: true  },
  viewer: { create: false, edit: false, delete: false, cart: false, share: true, download: true  },
  guest:  { create: false, edit: false, delete: false, cart: false, share: true, download: true  },
  vendor: { create: false, edit: false, delete: false, cart: true,  share: true, download: true  },
}

export function getPermissions(role: Role): Permissions {
  return PERMISSIONS[role] ?? PERMISSIONS.guest
}

export const GUEST_USER: User = {
  username: 'guest', role: 'guest', name: 'Guest', initials: 'GU',
}

export function validateLogin(username: string, password: string): User | null {
  const u = username.toLowerCase()
  const staff = STAFF_USERS[u]
  if (staff && staff.password === password) {
    return { username: u, role: staff.role, name: staff.name, initials: staff.initials, email: staff.email }
  }
  const vendor = vendorStore.getByUsername(u)
  if (vendor && vendor.password === password) {
    return { username: u, role: 'vendor', name: vendor.name, initials: vendor.initials, email: vendor.email, company: vendor.company }
  }
  return null
}

export function getImageUrl(link: string): string | null {
  if (!link || link.length <= 2) return null
  if (link.includes('drive.google.com/file/d/')) {
    const m = link.match(/\/d\/([^/]+)/)
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600` : null
  }
  return link.startsWith('http') ? link : null
}
