'use client'

// Renders BOQDocument off-screen (real DOM, not a print popup) and captures
// each of its pages pixel-for-pixel with html2canvas, then stitches those
// captures into a PDF with jsPDF. This sidesteps browser print-CSS reflow
// (which was clipping columns off wide BOQ tables) entirely — the PDF is a
// faithful screenshot of what's on screen, not a re-flowed print layout.
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import BOQDocument, { type BoqMeta, type BoqRow, type BoqTotals } from '@/boq/BOQDocument'

function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'))
  return Promise.all(
    images.map(img =>
      img.complete ? Promise.resolve() : new Promise<void>(resolve => {
        img.onload = () => resolve()
        img.onerror = () => resolve() // don't let one broken image block the whole export
      })
    )
  ).then(() => undefined)
}

export async function downloadBoqPdf(
  meta: BoqMeta,
  rows: BoqRow[],
  filename: string,
  totals?: BoqTotals
): Promise<void> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '-10000px'
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  const root = createRoot(container)
  try {
    await new Promise<void>(resolve => {
      root.render(<BOQDocument meta={meta} rows={rows} totals={totals} />)
      // Two rAFs: one for React to commit, one for layout to settle.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    await waitForImages(container)

    const sections = Array.from(container.querySelectorAll('section'))
    if (sections.length === 0) return

    let pdf: jsPDF | null = null
    for (let i = 0; i < sections.length; i++) {
      const canvas = await html2canvas(sections[i] as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pageW = canvas.width / 2
      const pageH = canvas.height / 2

      if (!pdf) {
        pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [pageW, pageH] })
      } else {
        pdf.addPage([pageW, pageH], 'landscape')
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH)
    }

    pdf?.save(filename)
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}
