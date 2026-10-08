import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCaller } from '@/lib/serverAuth'
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/password'
import { logActivity } from '@/lib/activity'

// POST { currentPassword, newPassword } — change password while signed in.
export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword     = typeof body.newPassword === 'string' ? body.newPassword : ''
  if (!currentPassword) return NextResponse.json({ error: 'Enter your current password' }, { status: 400 })
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 })
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'New password must be different from the current one' }, { status: 400 })
  }

  // Verify the current password with a throwaway sign-in.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { error: signInErr } = await anon.auth.signInWithPassword({ email: caller.email, password: currentPassword })
  if (signInErr) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const { error } = await supabaseAdmin.auth.admin.updateUserById(caller.id, { password: newPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabaseAdmin.from('ledlum_profiles').update({
    password_hash: hashPassword(newPassword),
    password_changed_at: new Date().toISOString(),
  }).eq('id', caller.id)
  await logActivity({ userId: caller.id, username: caller.username, role: caller.role, event: 'password_changed', req })

  return NextResponse.json({ ok: true })
}
