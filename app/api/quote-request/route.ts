import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/serverAuth'
import { getPermissions } from '@/lib/auth'
import { EMAIL, emailButton, emailLayout, escapeHtml, sendEmail } from '@/lib/email'
import { logActivity } from '@/lib/activity'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { formatQuoteNo } from '@/lib/quotes'
import { getQuoteRecipients } from '@/lib/services/settings'
import {
  applyPrices, detailRow, detailsTable, inr, itemsTable, noteBox, parseItems, parseProject, projectRows,
  quoteTotals, sectionTitle, summaryStats,
} from '@/lib/quoteItems'

// Where partner quote requests go is an admin setting (Admin → Settings →
// Quote recipients); defaults to projects@ledlumlighting.com.

// POST { items, note? } — a signed-in partner sends their quote list to LEDLUM.
// Emails the sales inbox (reply-to = the partner) and a confirmation copy to the partner.
export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Please sign in to send a quote request' }, { status: 401 })
  if (!getPermissions(caller.role).cart) {
    return NextResponse.json({ error: 'Your account cannot send quote requests' }, { status: 403 })
  }

  const body  = await req.json().catch(() => ({}))
  const items = parseItems(body.items)
  if (!items) return NextResponse.json({ error: 'Your quote list is empty or invalid' }, { status: 400 })

  await applyPrices(items, 'quote-request')   // authoritative D.P. per product
  const totals = quoteTotals(items)
  const recipients = await getQuoteRecipients()

  const note     = typeof body.note === 'string' ? body.note.trim().slice(0, 2000) : ''
  const project  = parseProject(body.project)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const date     = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  const who      = caller.company || caller.name

  // Save the quote (for My Account → My Quotes). If the table isn't there yet
  // (migration 007 not run), still send the request — just without a number.
  let quoteId: number | null = null
  {
    const { data: saved, error: saveErr } = await supabaseAdmin.from('ledlum_quotes').insert({
      user_id: caller.id,
      username: caller.username,
      partner_name: caller.name,
      company: caller.company,
      partner_email: caller.email,
      note: note || null,
      project_name: project.projectName || null,
      location: project.location || null,
      architect_name: project.architectName || null,
      architect_pan: project.architectPan || null,
      items,
      item_count: items.length,
      total_qty: totalQty,
      subtotal: totals.hasPrices ? totals.gross : null,
      discount: totals.hasPrices ? totals.discount : null,
      total: totals.hasPrices ? totals.net : null,
    }).select('id').single()
    if (saveErr) console.error('[quote-request] could not save quote:', saveErr.message)
    else quoteId = saved.id
  }
  const quoteNo = quoteId ? formatQuoteNo(quoteId) : null

  const name     = escapeHtml(caller.name)
  const email    = escapeHtml(caller.email)
  const projectInfo = projectRows(project)
  const salesHtml = emailLayout({
    preheader: `${who} requested a quote — ${items.length} product${items.length !== 1 ? 's' : ''}, ${totalQty} units${totals.hasPrices ? `, ${inr(totals.net)}` : ''}`,
    eyebrow: quoteNo ? `Quote ${quoteNo}` : 'Quote Request',
    title: 'New partner quote request',
    intro: `<strong style="color:${EMAIL.ink};">${name}</strong>${caller.company ? ` from <strong style="color:${EMAIL.ink};">${escapeHtml(caller.company)}</strong>` : ''} sent a quote request on ${escapeHtml(date)}.`,
    content: `
      ${summaryStats(items)}
      ${note ? noteBox('Note from partner', note) : ''}
      ${sectionTitle('Partner')}
      ${detailsTable(
        (quoteNo ? detailRow('Quote No', quoteNo) : '') +
        detailRow('Name', name) +
        detailRow('Company', escapeHtml(caller.company || '—')) +
        detailRow('Email', `<a href="mailto:${email}" style="color:${EMAIL.gold};text-decoration:none;">${email}</a>`) +
        detailRow('Account', `@${escapeHtml(caller.username)}`)
      )}
      ${projectInfo ? `${sectionTitle('Project')}${detailsTable(projectInfo)}` : ''}
      ${sectionTitle('Requested products')}
      ${itemsTable(items)}
      <div style="margin-top:28px;">${emailButton(`mailto:${email}`, `Reply to ${caller.name}`)}</div>`,
    footerNote: `Reply to this email to respond to ${name} directly.`,
  })

  const salesError = await sendEmail({
    to: recipients,
    subject: `Quote Request${quoteNo ? ` ${quoteNo}` : ''} — ${who}${project.projectName ? ` — ${project.projectName}` : ''} — ${items.length} product${items.length !== 1 ? 's' : ''}`,
    html: salesHtml,
    replyTo: caller.email,
  })

  const base = { userId: caller.id, username: caller.username, role: caller.role, req }
  const summary = items.map(i => ({
    productCode: i.productCode, quantity: i.quantity, selection: i.selection,
    unitPrice: i.unitPrice, discount: i.discount || undefined,
  }))

  if (salesError) {
    // Not delivered — drop the saved quote so a retry doesn't leave a duplicate.
    if (quoteId) await supabaseAdmin.from('ledlum_quotes').delete().eq('id', quoteId)
    await logActivity({ ...base, event: 'quote_failed', details: { items: summary, totalQty, error: salesError } })
    return NextResponse.json({ error: 'Could not send your quote request. Please try again.' }, { status: 502 })
  }
  if (quoteId) await supabaseAdmin.from('ledlum_quotes').update({ email_sent: true }).eq('id', quoteId)
  await logActivity({ ...base, event: 'quote_sent', details: {
    quoteNo: quoteNo ?? undefined, project: project.projectName || undefined,
    items: summary, totalQty, note: note || undefined, to: recipients.join(', '),
    ...(totals.hasPrices ? { subtotal: totals.gross, discount: totals.discount, total: totals.net } : {}),
  } })

  // Confirmation to the partner — failure here doesn't fail the request.
  const confirmHtml = emailLayout({
    preheader: `Your quote request${quoteNo ? ` ${quoteNo}` : ''} has reached the LEDLUM team.`,
    eyebrow: quoteNo ? `Quote ${quoteNo}` : 'Quote Request',
    title: "We've received your quote request",
    intro: `Hi ${name}, thanks — your request for ${items.length} product${items.length !== 1 ? 's' : ''}${project.projectName ? ` for <strong style="color:${EMAIL.ink};">${escapeHtml(project.projectName)}</strong>` : ''} has been sent to the LEDLUM team. We'll get back to you shortly.${quoteNo ? ` You can see it any time under <strong style="color:${EMAIL.ink};">My Account → My Quotes</strong>.` : ''}`,
    content: `
      ${summaryStats(items)}
      ${note ? noteBox('Your note', note) : ''}
      ${projectInfo ? `${sectionTitle('Project')}${detailsTable(projectInfo)}` : ''}
      ${sectionTitle('Your products')}
      ${itemsTable(items)}`,
    footerNote: `Sent ${escapeHtml(date)}. Reply to this email if you have any questions.`,
  })
  const confirmError = await sendEmail({
    to: caller.email,
    subject: `Your LEDLUM quote request${quoteNo ? ` ${quoteNo}` : ''}`,
    html: confirmHtml,
    replyTo: recipients[0],
  })
  if (confirmError) console.error('[quote-request] confirmation email failed:', confirmError)

  return NextResponse.json({ ok: true, confirmationSent: !confirmError, quoteId, quoteNo })
}
