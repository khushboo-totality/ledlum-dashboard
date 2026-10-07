// Server-only password helpers.
import { randomBytes, scryptSync } from 'node:crypto'

/** scrypt hash in the form `scrypt$<salt>$<hash>` (hex) — for the
 * ledlum_profiles.password_hash column. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

/** Random password nobody knows — invited accounts get one until they set
 * their own via the invite link, so they can't be signed into before that. */
export function unusablePassword(): string {
  return randomBytes(32).toString('base64url')
}

/** password_hash value for an account whose password hasn't been chosen yet. */
export function unusablePasswordHash(): string {
  return `unset$${randomBytes(16).toString('hex')}`
}

export const MIN_PASSWORD_LENGTH = 8
