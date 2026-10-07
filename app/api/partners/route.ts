import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin, makeInitials, type ProfileRow } from '@/lib/serverAuth'
import { unusablePassword, unusablePasswordHash } from '@/lib/password'
import { actionLink, sendActionEmail } from '@/lib/email'
import { logActivity } from '@/lib/activity'

const toPartner = (p: ProfileRow) => ({
  username:           p.username,
  name:               p.name,
  company:            p.company ?? '',
  email:              p.email,
  initials:           p.initials,
  createdAt:          p.created_at,
  createdBy:          p.created_by,
  invitedAt:          p.invited_at,
  lastLoginAt:        p.last_login_at,
  passwordChangedAt:  p.password_changed_at,
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { data, error } = await supabaseAdmin
    .from('ledlum_profiles').select('*').eq('role', 'partner').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data as ProfileRow[]).map(toPartner))
}

// Invites a partner: creates the account with a password nobody knows and
// emails them a link to choose their own (same flow as the LEDLUM website).
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json().catch(() => ({}))
  const username = String(body.username ?? '').trim().toLowerCase()
  const email    = String(body.email ?? '').trim().toLowerCase()
  const name     = String(body.name ?? '').trim()
  const company  = String(body.company ?? '').trim()
  if (!username || !name || !company || !email.includes('@')) {
    return NextResponse.json({ error: 'Name, company, a valid email and username are required' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('ledlum_profiles').select('id').eq('username', username).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 })

  const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email, password: unusablePassword(), email_confirm: true,
  })
  if (authErr || !created.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create partner' }, { status: 409 })
  }

  const { data, error: profileErr } = await supabaseAdmin
    .from('ledlum_profiles')
    .insert({
      id: created.user.id, username, email, role: 'partner',
      name, company, initials: makeInitials(name),
      password_hash: unusablePasswordHash(),
      created_by: admin.username,
    })
    .select('*').single()
  if (profileErr || !data) {
    // Don't leave an auth user without a profile behind.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: profileErr?.message ?? 'Failed to create partner' }, { status: 500 })
  }
  const profile = data as ProfileRow

  const base = { userId: profile.id, username, role: 'partner', actor: admin.username, req }
  await logActivity({ ...base, event: 'account_created', details: { name, company, email } })

  const link = actionLink(req, profile, 'invite')
  const inviteError = await sendActionEmail(profile, 'invite', link)
  if (inviteError) {
    await logActivity({ ...base, event: 'invite_failed', details: { email, error: inviteError } })
  } else {
    await supabaseAdmin.from('ledlum_profiles').update({ invited_at: new Date().toISOString() }).eq('id', profile.id)
    await logActivity({ ...base, event: 'invite_sent', details: { email } })
  }

  return NextResponse.json({
    partner: toPartner(profile),
    inviteSent: !inviteError,
    inviteError,
    // Only returned when the email failed, so the admin can pass it on manually.
    inviteLink: inviteError ? link : undefined,
  }, { status: 201 })
}
