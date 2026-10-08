import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCaller, type ProfileRow } from '@/lib/serverAuth'

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

// PATCH { phone?, gstNumber?, billingAddress? } — the user edits their own contact details.
// Name, company and email are managed by LEDLUM (admin), not editable here.
export async function PATCH(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const update: Record<string, string | null> = {}

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toProfile(data as ProfileRow))
}
