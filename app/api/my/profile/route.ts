import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCaller, makeInitials, type ProfileRow } from '@/lib/serverAuth'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

// 15-char Indian GSTIN: 2-digit state code, PAN, entity no., 'Z', checksum.
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

const toProfile = (p: ProfileRow) => ({
  username: p.username,
  name: p.name,
  company: p.company,
  email: p.email,
  role: p.role,
  createdAt: p.created_at,
  lastLoginAt: p.last_login_at,
  passwordChangedAt: p.password_changed_at,
  phone: p.phone ?? null,
  gstNumber: p.gst_number ?? null,
  billingAddress: p.billing_address ?? null,
})

export async function GET(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  return NextResponse.json(toProfile(caller))
}

// PATCH { phone?, gstNumber?, billingAddress?, name?, company?, email? }
// Everyone can edit phone / GST / billing address. Name, company and email are
// managed by LEDLUM — only admins can change their own here.
export async function PATCH(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const update: Record<string, string | null> = {}
  const isAdmin = caller.role === 'admin'

  if (!isAdmin && (body.name !== undefined || body.company !== undefined || body.email !== undefined)) {
    return NextResponse.json({ error: 'Contact LEDLUM to change your name, company or email' }, { status: 403 })
  }
  if (isAdmin && body.name !== undefined) {
    const name = String(body.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 100)
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    update.name = name
    update.initials = makeInitials(name)
  }
  if (isAdmin && body.company !== undefined) {
    update.company = String(body.company ?? '').trim().slice(0, 150) || null
  }
  if (isAdmin && body.email !== undefined) {
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }
    if (email !== caller.email.toLowerCase()) {
      const { data: taken } = await supabaseAdmin
        .from('ledlum_profiles').select('id').eq('email', email).neq('id', caller.id).maybeSingle()
      if (taken) return NextResponse.json({ error: 'That email is already used by another account' }, { status: 409 })
      // Change the sign-in email first, so the two can never drift apart.
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(caller.id, { email, email_confirm: true })
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
      update.email = email
    }
  }

  if (body.phone !== undefined) {
    const phone = String(body.phone ?? '').trim()
    if (phone && !/^[+0-9][0-9\s-]{6,19}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }
    update.phone = phone || null
  }
  if (body.gstNumber !== undefined) {
    const gst = String(body.gstNumber ?? '').trim().toUpperCase()
    if (gst && !GST_PATTERN.test(gst)) {
      return NextResponse.json({ error: 'GST number should be 15 characters, like 33ABCDE1234F1Z5' }, { status: 400 })
    }
    update.gst_number = gst || null
  }
  if (body.billingAddress !== undefined) {
    update.billing_address = String(body.billingAddress ?? '').trim().slice(0, 1000) || null
  }
  if (Object.keys(update).length === 0) return NextResponse.json(toProfile(caller))

  const { data, error } = await supabaseAdmin
    .from('ledlum_profiles').update(update).eq('id', caller.id).select('*').single()
  if (error) {
    // Profile update failed after the sign-in email changed — put it back.
    if (update.email) await supabaseAdmin.auth.admin.updateUserById(caller.id, { email: caller.email, email_confirm: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const changed = Object.keys(update).filter(k => k !== 'initials')
  await logActivity({
    userId: caller.id, username: caller.username, role: caller.role, event: 'profile_updated',
    details: { fields: changed, ...(update.email ? { emailFrom: caller.email, emailTo: update.email } : {}) }, req,
  })
  return NextResponse.json(toProfile(data as ProfileRow))
}
