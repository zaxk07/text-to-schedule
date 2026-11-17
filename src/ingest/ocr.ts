import type { PositionedToken } from '../types'

export interface Progress {
  stage: string
  /** 0..1 */
  progress: number
}

/** Self-hosted copies of the worker, WASM core and English data (see scripts/copy-ocr-assets.mjs). */
function ocrBase(): string {
  return new URL(`${import.meta.env.BASE_URL}ocr`, window.location.href).href
}

/** Run OCR on a (preprocessed) canvas and return words with their bounding boxes. */
export async function recognizeCanvas(canvas: HTMLCanvasElement, onProgress: (p: Progress) => void): Promise<PositionedToken[]> {
  onProgress({ stage: 'Loading reader', progress: 0 })
  const { createWorker } = await import('tesseract.js')
  const base = ocrBase()

  const worker = await createWorker('eng', 1, {
    workerPath: `${base}/worker.min.js`,
    corePath: base,
    langPath: base,
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress({ stage: 'Reading text', progress: m.progress })
      else onProgress({ stage: 'Loading reader', progress: Math.min(0.95, m.progress ?? 0) })
    },
  })

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: '6' as never, // one uniform block: best for tables
      preserve_interword_spaces: '1',
    })
    const { data } = await worker.recognize(canvas, {}, { blocks: true })
    const tokens: PositionedToken[] = []
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs) {
        for (const line of para.lines) {
          for (const w of line.words) {
            if (w.text.trim()) tokens.push({ text: w.text, x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0, y1: w.bbox.y1 })
          }
        }
      }
    }
    return tokens
  } finally {
    await worker.terminate()
  }
}
