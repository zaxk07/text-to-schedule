import type { PositionedToken } from '../types'
import { preprocessToCanvas } from './preprocess'
import { recognizeCanvas, type Progress } from './ocr'

/** Below this many characters a PDF page is treated as a scan and sent through OCR. */
const MIN_TEXT_CHARS = 20

export async function extractPdfTokens(file: File, onProgress: (p: Progress) => void): Promise<PositionedToken[]> {
  onProgress({ stage: 'Loading reader', progress: 0 })
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const tokens: PositionedToken[] = []
  let yOffset = 0

  try {
    for (let p = 1; p <= doc.numPages; p++) {
      onProgress({ stage: 'Reading text', progress: (p - 1) / doc.numPages })
      const page = await doc.getPage(p)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()

      const pageTokens: PositionedToken[] = []
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue
        const [, , , , e, f] = item.transform as number[]
        const height = item.height || Math.abs(item.transform[3]) || 10
        pageTokens.push({
          text: item.str,
          x0: e,
          x1: e + item.width,
          // PDF origin is bottom-left; flip so Y grows downward and stack pages vertically.
          y0: yOffset + viewport.height - f - height,
          y1: yOffset + viewport.height - f,
        })
      }

      if (pageTokens.reduce((n, t) => n + t.text.length, 0) >= MIN_TEXT_CHARS) {
        tokens.push(...pageTokens)
      } else {
        // Scanned page: render it and run OCR instead.
        onProgress({ stage: 'Preparing image', progress: (p - 1) / doc.numPages })
        const scale = 2500 / viewport.width
        const scaled = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(scaled.width)
        canvas.height = Math.round(scaled.height)
        await page.render({ canvas, viewport: scaled }).promise
        const clean = preprocessToCanvas(canvas, canvas.width, canvas.height)
        const ocr = await recognizeCanvas(clean, onProgress)
        for (const t of ocr) {
          tokens.push({ ...t, x0: t.x0 / scale, x1: t.x1 / scale, y0: yOffset + t.y0 / scale, y1: yOffset + t.y1 / scale })
        }
      }
      yOffset += viewport.height + 40
    }
  } finally {
    await doc.destroy()
  }
  return tokens
}
