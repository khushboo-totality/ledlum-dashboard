import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/serverAuth'
import { logActivity } from '@/lib/activity'

export async function DELETE(req: NextRequest, { params }: { params: { username: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const username = params.username.toLowerCase()
  const { data: profile } = await supabaseAdmin
    .from('ledlum_profiles').select('id, name, company, email').eq('username', username).eq('role', 'partner').maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

  // Log first, while user_id still resolves — the log row keeps the username
  // snapshot (user_id becomes null) after the auth user is deleted.
  await logActivity({
    userId: profile.id, username, role: 'partner', event: 'account_deleted',
    details: { name: profile.name, company: profile.company, email: profile.email },
    actor: admin.username, req,
  })

  // Deleting the auth user cascades to ledlum_profiles and ends their access.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
