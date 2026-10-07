// Browser Supabase client (anon key) — used only for auth sessions and
// reading the signed-in user's own profile (protected by RLS).
import { createClient } from '@supabase/supabase-js'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ledlum_auth' },
})

/** fetch() that sends the current Supabase access token, for API routes
 * that check who the caller is (e.g. admin-only partner management). */
export async function authFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`)
  return fetch(input, { ...init, headers })
}

/** Fire-and-forget activity report (see CLIENT_EVENTS in lib/activity.ts).
 * No-op when not signed in (guests have no session). */
export function trackActivity(event: string, details?: Record<string, unknown>) {
  authFetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, details }),
    keepalive: true,
  }).catch(() => {})
}
