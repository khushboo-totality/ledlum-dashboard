// Server-only activity log writer (public.ledlum_activity_log).
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type ActivityEvent =
  // account lifecycle (written by admins / the system)
  | 'account_created' | 'invite_sent' | 'invite_failed' | 'invite_resent' | 'account_deleted'
  // auth
  | 'login' | 'login_failed' | 'logout'
  | 'invite_accepted' | 'password_reset_requested' | 'password_reset'
  // older entries from the temporary-password flow
  | 'password_changed' | 'password_change_skipped'
  // catalogue / quote activity (reported by the browser)
  | 'product_viewed' | 'quote_item_added' | 'quote_item_removed'
  | 'quote_sent' | 'quote_copied' | 'boq_downloaded'

/** Events the browser is allowed to report via POST /api/activity. */
export const CLIENT_EVENTS: ActivityEvent[] = [
  'logout', 'product_viewed', 'quote_item_added', 'quote_item_removed',
  'quote_sent', 'quote_copied', 'boq_downloaded',
]

interface LogInput {
  userId?: string | null
  username: string
  role?: string | null
  event: ActivityEvent
  details?: Record<string, unknown>
  actor?: string | null
  req?: NextRequest
}

/** Never throws — a logging failure must not break the action being logged. */
export async function logActivity({ userId, username, role, event, details, actor, req }: LogInput) {
  try {
    const ip = req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req?.headers.get('x-real-ip') ?? null
    const { error } = await supabaseAdmin.from('ledlum_activity_log').insert({
      user_id:    userId ?? null,
      username,
      role:       role ?? null,
      event,
      details:    details ?? {},
      actor:      actor ?? username,
      ip,
      user_agent: req?.headers.get('user-agent') ?? null,
    })
    if (error) console.error('[activity] insert failed:', error.message)
  } catch (err) {
    console.error('[activity] insert failed:', err)
  }
}
