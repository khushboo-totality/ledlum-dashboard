import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAuth'
import {
  getQuoteRecipients, setQuoteRecipients, getSettingMeta, SettingsError, MAX_QUOTE_RECIPIENTS,
} from '@/lib/services/settings'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

// GET — admin settings.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const [quoteRecipients, meta] = await Promise.all([getQuoteRecipients(), getSettingMeta('quote_recipients')])
  return NextResponse.json({ quoteRecipients, maxQuoteRecipients: MAX_QUOTE_RECIPIENTS, quoteRecipientsMeta: meta })
}

// PATCH { quoteRecipients: string[] } — admin updates settings.
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const body = await req.json().catch(() => ({}))
  if (body.quoteRecipients === undefined) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  try {
    const before = await getQuoteRecipients()
    const quoteRecipients = await setQuoteRecipients(body.quoteRecipients, admin.username)
    await logActivity({
      userId: admin.id, username: admin.username, role: admin.role, event: 'settings_updated',
      details: { setting: 'quote_recipients', from: before, to: quoteRecipients }, req,
    })
    return NextResponse.json({ quoteRecipients, quoteRecipientsMeta: await getSettingMeta('quote_recipients') })
  } catch (err) {
    if (err instanceof SettingsError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
