// Server-only. Signed, single-use links for account emails (partner invite /
// password reset) — same approach as the LEDLUM website's admin invites.
//
// Nothing is stored: the token carries the user id, purpose and expiry, plus
// a fingerprint of the account's current password state. Once the link has
// been used (password set) the fingerprint no longer matches and the link is
// dead. Issuing a new link doesn't revoke older unused ones — they simply
// expire.
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { ProfileRow } from '@/lib/serverAuth'

export type TokenPurpose = 'invite' | 'reset'

export const TOKEN_TTL_MS: Record<TokenPurpose, number> = {
  invite: 7 * 24 * 60 * 60 * 1000, // 7 days
  reset:  60 * 60 * 1000,          // 1 hour
}
export const TOKEN_TTL_LABEL: Record<TokenPurpose, string> = { invite: '7 days', reset: '1 hour' }

type TokenUser = Pick<ProfileRow, 'id' | 'password_hash' | 'password_changed_at'>

function getSecret(): string {
  // Dedicated secret preferred; falls back to the (equally server-only)
  // service-role key so links still work if AUTH_TOKEN_SECRET isn't set.
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Missing AUTH_TOKEN_SECRET env var.')
  return secret
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`action:${value}`).digest('base64url')
}

function fingerprint(user: TokenUser): string {
  return crypto
    .createHash('sha256')
    .update(`${user.password_hash ?? ''}|${user.password_changed_at ?? ''}`)
    .digest('base64url')
    .slice(0, 16)
}

export function createActionToken(user: TokenUser, purpose: TokenPurpose): string {
  const expiry  = Date.now() + TOKEN_TTL_MS[purpose]
  const payload = Buffer.from(`${purpose}.${user.id}.${expiry}.${fingerprint(user)}`).toString('base64url')
  return `${payload}.${sign(payload)}`
}

/** The profile the token is for, or null if it's forged, expired, for a
 * different purpose, or already used. */
export async function readActionToken(
  token: string,
  purposes: TokenPurpose[],
): Promise<(ProfileRow & { purpose: TokenPurpose }) | null> {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature) return null

  const expected = sign(payload)
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null
  }

  const [purpose, userId, expiryStr, fp] = Buffer.from(payload, 'base64url').toString().split('.')
  if (!purposes.includes(purpose as TokenPurpose)) return null
  if (!Number.isFinite(Number(expiryStr)) || Date.now() > Number(expiryStr)) return null

  const { data } = await supabaseAdmin.from('ledlum_profiles').select('*').eq('id', userId).maybeSingle()
  const user = data as ProfileRow | null
  if (!user || fingerprint(user) !== fp) return null

  return { ...user, purpose: purpose as TokenPurpose }
}
