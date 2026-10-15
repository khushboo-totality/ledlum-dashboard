// Server-only transactional email via Resend (RESEND_API_KEY in .env.local).
// Mirrors the LEDLUM website's admin emails: a button link, no passwords.
import type { NextRequest } from 'next/server'
import { createActionToken, TOKEN_TTL_LABEL, type TokenPurpose } from '@/lib/actionTokens'
import type { ProfileRow } from '@/lib/serverAuth'
import { EMAIL_LOGO_PNG_BASE64 } from '@/lib/emailLogo'

/** Content-ID of the inline logo attachment sendEmail() adds. */
const LOGO_CID = 'ledlum-logo'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'LEDLUM <noreply@ledlumlighting.com>'

/** Links in emails must point at the real site, not whatever host the
 * request came in on (e.g. localhost) — set NEXT_PUBLIC_SITE_URL in production. */
export function siteOrigin(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '')
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Email palette — matches the catalogue's gold accent. */
export const EMAIL = {
  font:  "Arial, 'Helvetica Neue', Helvetica, sans-serif",
  ink:   '#1a1a1a',
  muted: '#6b6b6b',
  faint: '#9a9a9a',
  line:  '#ece8df',
  soft:  '#f8f6f1',
  page:  '#f4f2ed',
  gold:  '#9a8c66',
}

interface LayoutInput {
  /** Inbox preview text (hidden in the body). */
  preheader?: string
  /** Small label at the top right of the header, e.g. "BOQ Alert". */
  eyebrow?: string
  title: string
  /** Trusted HTML under the title. */
  intro?: string
  /** Trusted HTML for the main body. */
  content: string
  /** Trusted HTML above the brand line in the footer. */
  footerNote?: string
}

/** Branded, table-based wrapper (works in Gmail / Outlook / Apple Mail). */
export function emailLayout({ preheader, eyebrow, title, intro, content, footerNote }: LayoutInput): string {
  const f = EMAIL.font
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${EMAIL.page};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL.page};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;background:#ffffff;border:1px solid ${EMAIL.line};border-radius:12px;overflow:hidden;">
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${EMAIL.gold};">&nbsp;</td></tr>
        <tr><td style="padding:24px 32px;border-bottom:1px solid ${EMAIL.line};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle"><img src="cid:${LOGO_CID}" width="150" alt="LEDLUM" style="display:block;width:150px;height:auto;border:0;outline:none;" /></td>
            ${eyebrow ? `<td valign="middle" align="right" style="font-family:${f};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${EMAIL.gold};">${escapeHtml(eyebrow)}</td>` : ''}
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 32px 0;font-family:${f};color:${EMAIL.ink};">
          <h1 style="margin:0;font-family:${f};font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL.ink};">${escapeHtml(title)}</h1>
          ${intro ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${EMAIL.muted};">${intro}</p>` : ''}
        </td></tr>
        <tr><td style="padding:24px 32px 32px;font-family:${f};font-size:14px;color:${EMAIL.ink};">${content}</td></tr>
        <tr><td style="padding:20px 32px;background:${EMAIL.soft};border-top:1px solid ${EMAIL.line};font-family:${f};font-size:12px;line-height:1.6;color:${EMAIL.faint};">
          ${footerNote ? `<div style="margin-bottom:8px;color:${EMAIL.muted};">${footerNote}</div>` : ''}
          <strong style="color:${EMAIL.muted};">LEDLUM</strong> · Beyond Bright · <a href="https://ledlumlighting.com" style="color:${EMAIL.gold};text-decoration:none;">ledlumlighting.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

/** Pill button (a real link, so it survives image blocking). */
export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="border-radius:999px;background:${EMAIL.gold};">
      <a href="${href}" style="display:inline-block;padding:12px 24px;font-family:${EMAIL.font};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
    </td></tr></table>`
}

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
        // Inline logo for emailLayout() — referenced as <img src="cid:…">.
        ...(html.includes(`cid:${LOGO_CID}`)
          ? { attachments: [{ filename: 'ledlum-logo.png', content: EMAIL_LOGO_PNG_BASE64, content_id: LOGO_CID }] }
          : {}),
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
