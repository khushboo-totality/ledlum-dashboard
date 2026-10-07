// Server-only transactional email via Resend (RESEND_API_KEY in .env.local).
// Mirrors the LEDLUM website's admin emails: a button link, no passwords.
import type { NextRequest } from 'next/server'
import { createActionToken, TOKEN_TTL_LABEL, type TokenPurpose } from '@/lib/actionTokens'
import type { ProfileRow } from '@/lib/serverAuth'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'LEDLUM <noreply@ledlumlighting.com>'

/** Links in emails must point at the real site, not whatever host the
 * request came in on (e.g. localhost) — set NEXT_PUBLIC_SITE_URL in production. */
export function siteOrigin(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '')
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

interface SendInput {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

/** Sends one email via Resend. Returns null on success, or an error message. */
export async function sendEmail({ to, subject, html, replyTo }: SendInput): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return 'RESEND_API_KEY is not configured'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return body?.message ?? `Email provider returned ${res.status}`
    }
    return null
  } catch (err) {
    return err instanceof Error ? err.message : 'Failed to send email'
  }
}

const COPY: Record<TokenPurpose, { subject: string; heading: string; body: string; button: string }> = {
  invite: {
    subject: "You've been invited to the LEDLUM partner catalogue",
    heading: "You're invited",
    body:    'An account has been created for you on the LEDLUM product catalogue, where you can browse products and send quote requests. Click below to choose your password and activate your account.',
    button:  'Accept invite',
  },
  reset: {
    subject: 'Reset your LEDLUM catalogue password',
    heading: 'Reset your password',
    body:    "Someone (hopefully you) asked to reset the password for this account. Click below to choose a new one. If it wasn't you, ignore this email.",
    button:  'Reset password',
  },
}

/** Builds the emailed link for an invite / password reset. */
export function actionLink(req: NextRequest, user: ProfileRow, purpose: TokenPurpose): string {
  return `${siteOrigin(req)}/set-password?token=${encodeURIComponent(createActionToken(user, purpose))}`
}

/** Sends an invite / reset email. Returns null on success, or an error message. */
export async function sendActionEmail(user: ProfileRow, purpose: TokenPurpose, link: string): Promise<string | null> {
  const copy = COPY[purpose]
  const html = `
      <div style="font-family:sans-serif;max-width:520px;color:#1a1a1a;">
        <h2>${copy.heading}</h2>
        <p>Hi ${escapeHtml(user.name)},</p>
        <p>${copy.body}</p>
        <p style="margin:28px 0;">
          <a href="${link}" style="background:#9a8c66;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;">${copy.button}</a>
        </p>
        <p style="font-size:13px;color:#666;">This link expires in ${TOKEN_TTL_LABEL[purpose]} and can only be used once.<br/>If the button doesn't work, paste this into your browser:<br/>${link}</p>
      </div>`

  return sendEmail({ to: user.email, subject: copy.subject, html })
}
