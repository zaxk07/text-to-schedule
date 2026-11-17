import { tokensToText } from './layout'
import { recognizeCanvas, type Progress } from './ocr'
import { extractPdfTokens } from './pdfExtract'
import { preprocessToCanvas } from './preprocess'

export type { Progress }

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const ACCEPT = `application/pdf,${IMAGE_TYPES.join(',')}`

export function isSupportedFile(file: File): boolean {
  return file.type === 'application/pdf' || IMAGE_TYPES.includes(file.type) || /\.pdf$/i.test(file.name)
}

/** Read a PDF or image and return text laid out for the schedule parsers. */
export async function extractTextFromFile(file: File, onProgress: (p: Progress) => void): Promise<string> {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (isPdf) {
    const tokens = await extractPdfTokens(file, onProgress)
    onProgress({ stage: 'Building schedule', progress: 1 })
    return tokensToText(tokens)
  }

  onProgress({ stage: 'Preparing image', progress: 0 })
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = preprocessToCanvas(bitmap, bitmap.width, bitmap.height)
    const tokens = await recognizeCanvas(canvas, onProgress)
    onProgress({ stage: 'Building schedule', progress: 1 })
    return tokensToText(tokens)
  } finally {
    bitmap.close()
  }
}
