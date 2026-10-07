import type { Role, User, Permissions } from '@/types'

// Accounts live in Supabase Auth + public.ledlum_profiles (see
// context/AuthContext.tsx and app/api/auth/login). Only the guest user is local.

// ALL roles get share + download
export const PERMISSIONS: Record<Role, Permissions> = {
  admin:   { create: true,  edit: true,  delete: true,  cart: false, share: true, download: true  },
  editor:  { create: true,  edit: true,  delete: false, cart: false, share: true, download: true  },
  viewer:  { create: false, edit: false, delete: false, cart: false, share: true, download: true  },
  guest:   { create: false, edit: false, delete: false, cart: false, share: true, download: true  },
  partner: { create: false, edit: false, delete: false, cart: true,  share: true, download: true  },
}

export function getPermissions(role: Role): Permissions {
  return PERMISSIONS[role] ?? PERMISSIONS.guest
}

export const GUEST_USER: User = {
  username: 'guest', role: 'guest', name: 'Guest', initials: 'GU',
}

export function getImageUrl(link: string): string | null {
  if (!link || link.length <= 2) return null
  if (link.includes('drive.google.com/file/d/')) {
    const m = link.match(/\/d\/([^/]+)/)
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600` : null
  }
  return link.startsWith('http') ? link : null
}

/** placehold.co (demo gallery in productDetails.ts) serves SVG, which the
 * next/image optimizer rejects — render those as-is instead. */
export function skipImageOptimization(src: string): boolean {
  return src.includes('placehold.co')
}
