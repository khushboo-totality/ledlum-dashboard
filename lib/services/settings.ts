// Server-only. App-wide settings (public.ledlum_settings, key → JSON value).
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const TABLE = 'ledlum_settings'

/** Fallback when the setting/table doesn't exist yet. */
const DEFAULT_QUOTE_RECIPIENTS = [process.env.QUOTE_TO_EMAIL || 'projects@ledlumlighting.com']

export const MAX_QUOTE_RECIPIENTS = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Who receives partner quote requests. Never empty. */
export async function getQuoteRecipients(): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from(TABLE).select('value').eq('key', 'quote_recipients').maybeSingle()
  if (error || !data) return DEFAULT_QUOTE_RECIPIENTS
  const list = Array.isArray(data.value) ? data.value.filter((v: unknown): v is string => typeof v === 'string' && EMAIL_PATTERN.test(v)) : []
  return list.length ? list : DEFAULT_QUOTE_RECIPIENTS
}

export class SettingsError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

/** Validates, de-duplicates and saves the quote recipient list. */
export async function setQuoteRecipients(raw: unknown, adminUsername: string): Promise<string[]> {
  if (!Array.isArray(raw)) throw new SettingsError('Recipients must be a list of email addresses', 400)
  const seen = new Set<string>()
  const list: string[] = []
  for (const v of raw) {
    const email = String(v ?? '').trim().toLowerCase()
    if (!email) continue
    if (!EMAIL_PATTERN.test(email)) throw new SettingsError(`"${email}" is not a valid email address`, 400)
    if (!seen.has(email)) { seen.add(email); list.push(email) }
  }
  if (list.length === 0) throw new SettingsError('Add at least one email address — quote requests need somewhere to go', 400)
  if (list.length > MAX_QUOTE_RECIPIENTS) throw new SettingsError(`At most ${MAX_QUOTE_RECIPIENTS} recipients`, 400)

  const { error } = await supabaseAdmin.from(TABLE).upsert({
    key: 'quote_recipients', value: list, updated_at: new Date().toISOString(), updated_by: adminUsername,
  })
  if (error) throw new Error(`Failed to save settings: ${error.message}`)
  return list
}

export async function getSettingMeta(key: string): Promise<{ updatedAt: string | null; updatedBy: string | null }> {
  const { data } = await supabaseAdmin.from(TABLE).select('updated_at, updated_by').eq('key', key).maybeSingle()
  return { updatedAt: data?.updated_at ?? null, updatedBy: data?.updated_by ?? null }
}
