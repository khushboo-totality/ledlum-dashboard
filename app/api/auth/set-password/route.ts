import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { readActionToken } from '@/lib/actionTokens'
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/password'
import { logActivity } from '@/lib/activity'

const INVALID = 'This link is invalid, expired or has already been used'

// GET ?token= — tells the page who the link is for (invite vs reset).
export async function GET(req: NextRequest) {
  const user = await readActionToken(req.nextUrl.searchParams.get('token') || '', ['invite', 'reset'])
  if (!user) return NextResponse.json({ error: INVALID }, { status: 400 })
  return NextResponse.json({ email: user.email, name: user.name, username: user.username, purpose: user.purpose })
}

// POST { token, password } — accepts an invite or completes a password reset,
// then signs the user in (session tokens returned for the client to adopt).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''

  const user = await readActionToken(body.token, ['invite', 'reset'])
  if (!user) return NextResponse.json({ error: INVALID }, { status: 400 })
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 })
  }

  const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('ledlum_profiles').update({
    password_hash: hashPassword(password),   // also invalidates this link (fingerprint changes)
    password_changed_at: now,
    must_change_password: false,
    last_login_at: now,
  }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = { userId: user.id, username: user.username, role: user.role, req }
  await logActivity({ ...base, event: user.purpose === 'invite' ? 'invite_accepted' : 'password_reset' })

  // Sign them straight in.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data } = await anon.auth.signInWithPassword({ email: user.email, password })
  if (!data.session) return NextResponse.json({ ok: true }) // password saved; they can sign in manually
  await logActivity({ ...base, event: 'login' })

  return NextResponse.json({
    ok: true,
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
}
