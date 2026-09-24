'use client'

// Renders a document component off-screen (real DOM, not a print popup) and
// captures each of its <section> pages pixel-for-pixel with html2canvas, then
// stitches those captures into a PDF with jsPDF. This sidesteps browser
// print-CSS reflow (which was clipping columns off wide BOQ tables) entirely —
// the PDF is a faithful screenshot of what's on screen, not a re-flowed print layout.
import type { ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import BOQDocument, { type BoqMeta, type BoqRow, type BoqTotals } from '@/boq/BOQDocument'
import ProductDatasheet, {
  type DatasheetData, DATASHEET_HERO, DATASHEET_THUMB, DATASHEET_MAX_THUMBS,
} from '@/boq/ProductDatasheet'
import { skipImageOptimization } from '@/lib/auth'

const CAPTURE_SCALE = 2
const BOQ_IMAGE_BOX = 80 // matches the h-20 w-20 image cell in BOQDocument

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => reject(new Error('Image load timed out')), 15000)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); reject(new Error('Image failed to load')) }
    img.src = src
  })
}

/**
 * Loads an image and letterboxes it ("contain") onto a white canvas of
 * exactly boxW x boxH (at capture scale), returning a JPEG data URL.
 *  - html2canvas doesn't support object-fit, so images must already be the
 *    shape of their box or they come out stretched/cropped.
 *  - Goes through the same-origin next/image optimizer first: a resized
 *    copy instead of the 2–5 MB original, and no CORS problem for hosts
 *    like Google Drive that don't send Access-Control-Allow-Origin. Falls
 *    back to the original URL (R2 does send CORS headers).
 * Returns undefined if the image can't be loaded at all.
 */
export async function prepareImageForPdf(src: string | undefined, boxW: number, boxH: number): Promise<string | undefined> {
  if (!src) return undefined
  const w = boxW * CAPTURE_SCALE
  const h = boxH * CAPTURE_SCALE
  const candidates = skipImageOptimization(src) || src.startsWith('data:')
    ? [src]
    : [`/_next/image?url=${encodeURIComponent(src)}&w=${w <= 640 ? 640 : 1080}&q=85`, src]

  for (const url of candidates) {
    try {
      const img = await loadImage(url)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return undefined
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      return canvas.toDataURL('image/jpeg', 0.9)
    } catch {
      // try the next candidate
    }
  }
  return undefined
}

const LOGO_URL = 'https://pub-72e9e5cfa7cc4ff0a9cc7ba22a9d2341.r2.dev/ledlum/images/logo/LEDLUM-Logo-black.png'
let logoPromise: Promise<string | undefined> | null = null

/**
 * The brand logo, prepared for the PDFs' near-black mastheads: cropped to
 * its visible content (the source PNG has wide transparent padding) and with
 * the black wordmark turned white so it reads on the dark header — the
 * orange mark keeps its colour. Done on a canvas because html2canvas
 * doesn't support CSS filters. Cached after the first export.
 */
function prepareLogoForDarkHeader(): Promise<string | undefined> {
  logoPromise ??= (async () => {
    try {
      const img = await loadImage(LOGO_URL)
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return undefined
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, w, h)
      const px = data.data
      let minX = w, minY = h, maxX = -1, maxY = -1
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = px[i], g = px[i + 1], b = px[i + 2]
          // The source has an opaque white background. Grey pixels (the
          // black wordmark, the white background and the anti-aliased edges
          // between) become white with alpha = darkness: black → solid
          // white, white → transparent. Coloured (orange mark) pixels stay.
          if (Math.max(r, g, b) - Math.min(r, g, b) < 60) {
            const darkness = 255 - (r + g + b) / 3
            px[i] = px[i + 1] = px[i + 2] = 255
            px[i + 3] = Math.round(darkness * (px[i + 3] / 255))
          }
          if (px[i + 3] < 16) continue
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
      if (maxX < 0) return undefined
      ctx.putImageData(data, 0, 0)
      const cropped = document.createElement('canvas')
      cropped.width = maxX - minX + 1
      cropped.height = maxY - minY + 1
      cropped.getContext('2d')?.drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height)
      return cropped.toDataURL('image/png')
    } catch {
      logoPromise = null // retry on the next export
      return undefined
    }
  })()
  return logoPromise
}

async function renderToPdf(element: ReactElement, filename: string): Promise<void> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '-10000px'
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  const root = createRoot(container)
  try {
    await new Promise<void>(resolve => {
      root.render(element)
      // Two rAFs: one for React to commit, one for layout to settle.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
    // Web fonts must be ready or html2canvas captures the fallback font.
    await document.fonts?.ready

    const sections = Array.from(container.querySelectorAll('section'))
    if (sections.length === 0) return

    let pdf: jsPDF | null = null
    for (const section of sections) {
      const canvas = await html2canvas(section as HTMLElement, {
        scale: CAPTURE_SCALE,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pageW = canvas.width / CAPTURE_SCALE
      const pageH = canvas.height / CAPTURE_SCALE
      // jsPDF swaps the format's sides to match `orientation`, so it must
      // agree with the page's real shape (BOQ = landscape, datasheet = portrait).
      const orientation = pageW >= pageH ? 'landscape' : 'portrait'

      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: 'px', format: [pageW, pageH] })
      } else {
        pdf.addPage([pageW, pageH], orientation)
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH)
    }

    pdf?.save(filename)
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}

export async function downloadBoqPdf(
  meta: BoqMeta,
  rows: BoqRow[],
  filename: string,
  totals?: BoqTotals
): Promise<void> {
  const logo = prepareLogoForDarkHeader()
  const preparedRows = await Promise.all(rows.map(async r => ({
    ...r,
    image: await prepareImageForPdf(r.image, BOQ_IMAGE_BOX, BOQ_IMAGE_BOX),
  })))
  await renderToPdf(<BOQDocument meta={{ ...meta, logo: await logo }} rows={preparedRows} totals={totals} />, filename)
}

/** Single-product data sheet: hero image, gallery, description + full spec list. */
export async function downloadProductDatasheetPdf(
  data: Omit<DatasheetData, 'heroImage' | 'gallery'> & { heroImage?: string; gallery: string[] },
  filename: string
): Promise<void> {
  const thumbs = data.gallery.filter(g => g && g !== data.heroImage).slice(0, DATASHEET_MAX_THUMBS)
  const [logo, heroImage, ...gallery] = await Promise.all([
    prepareLogoForDarkHeader(),
    prepareImageForPdf(data.heroImage, DATASHEET_HERO.w, DATASHEET_HERO.h),
    ...thumbs.map(g => prepareImageForPdf(g, DATASHEET_THUMB.w, DATASHEET_THUMB.h)),
  ])
  const prepared: DatasheetData = {
    ...data,
    logo,
    heroImage,
    gallery: gallery.filter((g): g is string => !!g),
  }
  await renderToPdf(<ProductDatasheet data={prepared} />, filename)
}
