// Server-only Supabase client using the service-role key.
// Never import this from a 'use client' component — the service-role key
// must not reach the browser bundle. All Supabase access goes through the
// app's own API routes (app/api/**), which run server-side.
import { createClient } from '@supabase/supabase-js'

const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
})
