// Server-only helpers for checking who is calling an API route.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { Role } from '@/types'

export interface ProfileRow {
  id: string
  username: string
  email: string
  role: Exclude<Role, 'guest'>
  name: string
  company: string | null
  initials: string
  created_at: string
  password_hash: string | null
  must_change_password: boolean
  invited_at: string | null
  password_changed_at: string | null
  last_login_at: string | null
  created_by: string | null
}

/** Resolves the caller's profile (any signed-in staff/partner) from the `Authorization: Bearer <token>`
 * header, or null if missing/invalid. */
export async function getCaller(req: NextRequest): Promise<ProfileRow | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return null
  const { data } = await supabaseAdmin
    .from('ledlum_profiles').select('*').eq('id', user.id).maybeSingle()
  return (data as ProfileRow | null) ?? null
}

/** Returns the caller if they're an admin, else a 401/403 response. */
export async function requireAdmin(req: NextRequest): Promise<ProfileRow | NextResponse> {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (caller.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  return caller
}

export function makeInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
