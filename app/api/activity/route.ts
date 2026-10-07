import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCaller, requireAdmin } from '@/lib/serverAuth'
import { CLIENT_EVENTS, logActivity, type ActivityEvent } from '@/lib/activity'

// POST — the signed-in user reports something they did in the browser
// (viewed a product, added to quote, sent a quote, …).
export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const event = body.event as ActivityEvent
  if (!CLIENT_EVENTS.includes(event)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }
  const details = body.details && typeof body.details === 'object' ? body.details : {}

  await logActivity({ userId: caller.id, username: caller.username, role: caller.role, event, details, req })
  return NextResponse.json({ ok: true })
}

// GET ?username=<u>&limit=<n> — admin-only history for one account.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const username = req.nextUrl.searchParams.get('username')?.toLowerCase()
  if (!username) return NextResponse.json({ error: 'username is required' }, { status: 400 })
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 200, 1000)

  const { data, error } = await supabaseAdmin
    .from('ledlum_activity_log')
    .select('id, event, details, actor, ip, user_agent, created_at')
    .eq('username', username)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
