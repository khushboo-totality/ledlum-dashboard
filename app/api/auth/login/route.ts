import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logActivity } from '@/lib/activity'
import { authEmailFor } from '@/lib/serverAuth'

// Username-or-email sign-in. Resolving username -> email happens here on the
// server so users' emails are never exposed to the browser; the resulting
// session tokens are handed back for the client to adopt via setSession().
export async function POST(req: NextRequest) {
  const { identifier, password } = await req.json().catch(() => ({}))
  if (!identifier || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
  }

  const id = String(identifier).trim().toLowerCase()
  const { data: profile } = await supabaseAdmin
    .from('ledlum_profiles')
    .select('id, username, email, role')
    .eq(id.includes('@') ? 'email' : 'username', id)
    .maybeSingle()

  const invalid = () => NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
  if (!profile) return invalid()

  // Sign in with the email Supabase Auth actually has for this account (by id),
  // not the profile's copy — if someone edits ledlum_profiles.email directly
  // the two can drift apart, which would otherwise make sign-in fail.
  const signInEmail = await authEmailFor(profile.id, profile.email)
  if (signInEmail.toLowerCase() !== profile.email.toLowerCase()) {
    console.warn(`[login] profile email (${profile.email}) differs from auth email for @${profile.username}`)
  }

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data, error } = await anon.auth.signInWithPassword({ email: signInEmail, password })
  if (error || !data.session) {
    await logActivity({
      userId: profile.id, username: profile.username, role: profile.role,
      event: 'login_failed', details: { reason: error?.message ?? 'unknown' }, req,
    })
    return invalid()
  }

  await supabaseAdmin.from('ledlum_profiles').update({ last_login_at: new Date().toISOString() }).eq('id', profile.id)
  await logActivity({ userId: profile.id, username: profile.username, role: profile.role, event: 'login', req })

  return NextResponse.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
}
