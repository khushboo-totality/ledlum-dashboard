import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCaller } from '@/lib/serverAuth'
import { QUOTE_SUMMARY_COLUMNS, toQuoteSummary, type QuoteRow } from '@/lib/quotesServer'

export const dynamic = 'force-dynamic'

// GET — the signed-in user's own quote requests, newest first.
export async function GET(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('ledlum_quotes')
    .select(QUOTE_SUMMARY_COLUMNS)
    .eq('user_id', caller.id)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data as QuoteRow[]).map(toQuoteSummary))
}
