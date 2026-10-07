import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { ProfileRow } from '@/lib/serverAuth'
import { actionLink, sendActionEmail } from '@/lib/email'
import { logActivity } from '@/lib/activity'

// POST { identifier } (username or email) — emails a 1-hour reset link.
// Always answers the same way so it can't be used to discover accounts.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = String(body.identifier ?? '').trim().toLowerCase()
  const ok = NextResponse.json({ ok: true })
  if (!id) return ok

  const { data } = await supabaseAdmin
    .from('ledlum_profiles').select('*').eq(id.includes('@') ? 'email' : 'username', id).maybeSingle()
  const user = data as ProfileRow | null
  if (!user) return ok

  const error = await sendActionEmail(user, 'reset', actionLink(req, user, 'reset'))
  await logActivity({
    userId: user.id, username: user.username, role: user.role, event: 'password_reset_requested',
    details: error ? { email: user.email, error } : { email: user.email }, req,
  })
  if (error) console.error('[forgot] reset email failed:', error)
  return ok
}
