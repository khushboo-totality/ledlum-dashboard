import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/serverAuth'
import { EMAIL, emailButton, emailLayout, escapeHtml, sendEmail } from '@/lib/email'
import { logActivity } from '@/lib/activity'
import {
  applyPrices, detailRow, detailsTable, inr, itemsTable, parseItems, parseProject, projectRows,
  quoteTotals, sectionTitle, summaryStats,
} from '@/lib/quoteItems'

// Who hears about every BOQ download from the quote cart.
const BOQ_ALERT_RECIPIENTS = ['sales@ledlumlighting.com', 'abheek@ledlumlighting.com','khushboo@totality.solutions']

// POST { items, project } — the signed-in user just downloaded a BOQ PDF.
// Logs 'boq_downloaded' and emails the sales team (reply-to = the user) so
// they know who is pricing what. The download itself already happened in the
// browser, so an email failure is only logged.
export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body  = await req.json().catch(() => ({}))
  const items = parseItems(body.items)
  if (!items) return NextResponse.json({ error: 'BOQ is empty or invalid' }, { status: 400 })

  await applyPrices(items, 'boq-download')
  const totals   = quoteTotals(items)
  const project  = parseProject(body.project)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const date     = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  const who      = caller.company || caller.name

  const name    = escapeHtml(caller.name)
  const email   = escapeHtml(caller.email)
  const projectInfo = projectRows(project)
  const html = emailLayout({
    preheader: `${who} downloaded a BOQ — ${items.length} product${items.length !== 1 ? 's' : ''}, ${totalQty} units${totals.hasPrices ? `, ${inr(totals.net)}` : ''}`,
    eyebrow: 'BOQ Alert',
    title: 'A BOQ was just downloaded',
    intro: `<strong style="color:${EMAIL.ink};">${name}</strong>${caller.company ? ` from <strong style="color:${EMAIL.ink};">${escapeHtml(caller.company)}</strong>` : ''} downloaded a BOQ PDF from the product catalogue on ${escapeHtml(date)}. No quote request has been sent yet — a good moment to follow up.`,
    content: `
      ${summaryStats(items)}
      ${sectionTitle('Downloaded by')}
      ${detailsTable(
        detailRow('Name', name) +
        detailRow('Company', escapeHtml(caller.company || '—')) +
        detailRow('Email', `<a href="mailto:${email}" style="color:${EMAIL.gold};text-decoration:none;">${email}</a>`) +
        detailRow('Account', `@${escapeHtml(caller.username)} <span style="font-weight:400;color:${EMAIL.muted};">· ${escapeHtml(caller.role)}</span>`)
      )}
      ${projectInfo ? `${sectionTitle('Project')}${detailsTable(projectInfo)}` : ''}
      ${sectionTitle('Products in the BOQ')}
      ${itemsTable(items)}
      <div style="margin-top:28px;">${emailButton(`mailto:${email}`, `Contact ${caller.name}`)}</div>`,
    footerNote: `Automatic alert from the LEDLUM product catalogue. Reply to this email to reach ${name} directly.`,
  })

  const emailError = await sendEmail({
    to: BOQ_ALERT_RECIPIENTS,
    subject: `BOQ Downloaded — ${who}${project.projectName ? ` — ${project.projectName}` : ''} — ${items.length} product${items.length !== 1 ? 's' : ''}`,
    html,
    replyTo: caller.email,
  })
  if (emailError) console.error('[boq-download] alert email failed:', emailError)

  await logActivity({
    userId: caller.id, username: caller.username, role: caller.role, req,
    event: 'boq_downloaded',
    details: {
      items: items.map(i => ({ productCode: i.productCode, quantity: i.quantity, selection: i.selection })),
      totalQty,
      project: project.projectName || undefined,
      emailed: !emailError,
    },
  })

  return NextResponse.json({ ok: true, emailed: !emailError })
}
