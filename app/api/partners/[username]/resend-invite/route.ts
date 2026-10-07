import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin, type ProfileRow } from '@/lib/serverAuth'
import { actionLink, sendActionEmail } from '@/lib/email'
import { logActivity } from '@/lib/activity'

// Emails a fresh "set your password" link. Their current password (if any)
// keeps working until they use the link.
export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const username = params.username.toLowerCase()
  const { data } = await supabaseAdmin
    .from('ledlum_profiles').select('*').eq('username', username).eq('role', 'partner').maybeSingle()
  const profile = data as ProfileRow | null
  if (!profile) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

  const link = actionLink(req, profile, 'invite')
  const inviteError = await sendActionEmail(profile, 'invite', link)
  if (!inviteError) {
    await supabaseAdmin.from('ledlum_profiles').update({ invited_at: new Date().toISOString() }).eq('id', profile.id)
  }
  await logActivity({
    userId: profile.id, username, role: 'partner',
    event: inviteError ? 'invite_failed' : 'invite_resent',
    details: inviteError ? { email: profile.email, error: inviteError } : { email: profile.email },
    actor: admin.username, req,
  })

  return NextResponse.json({
    inviteSent: !inviteError,
    inviteError,
    inviteLink: inviteError ? link : undefined,
  })
}
