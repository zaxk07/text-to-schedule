/**
 * Image clean-up before OCR: grayscale, contrast stretch, then a binary threshold so thin table
 * text turns into crisp black-on-white. The pixel maths is split out so it can be tested without a canvas.
 */

/** RGBA -> luma (Rec. 601) */
export function toGray(rgba: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(rgba.length / 4)
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    out[p] = Math.round(rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114)
  }
  return out
}

/** Stretch the 2nd–98th percentile range to 0–255. */
export function stretchContrast(gray: Uint8Array): Uint8Array {
  const hist = new Array<number>(256).fill(0)
  for (const v of gray) hist[v]++
  const cut = gray.length * 0.02
  let lo = 0
  let hi = 255
  for (let acc = 0; lo < 255 && (acc += hist[lo]) < cut; lo++);
  for (let acc = 0; hi > 0 && (acc += hist[hi]) < cut; hi--);
  if (hi - lo < 8) return gray
  const out = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(((gray[i] - lo) * 255) / (hi - lo))))
  return out
}

/** Otsu's method: the threshold that best separates ink from background. */
export function otsu(gray: Uint8Array): number {
  const hist = new Array<number>(256).fill(0)
  for (const v of gray) hist[v]++
  const total = gray.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sumB = 0
  let wB = 0
  let best = 0
  let bestVar = -1
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) ** 2
    if (between > bestVar) {
      bestVar = between
      best = t
    }
  }
  return best
}

/** Pixels above the threshold become white (255), the rest black (0). */
export function applyThreshold(gray: Uint8Array, threshold: number): Uint8Array {
  const out = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) out[i] = gray[i] > threshold ? 255 : 0
  return out
}

/**
 * Whiten long horizontal and vertical black runs (table borders). Left in place, borders glue words
 * together and the OCR engine reads whole rows as one blob. Letters never form runs this long.
 */
export function removeLines(bw: Uint8Array, width: number, height: number, minRun: number): Uint8Array {
  const out = bw.slice()
  const clear = (start: number, step: number, count: number) => {
    let run = 0
    for (let i = 0; i <= count; i++) {
      if (i < count && bw[start + i * step] === 0) {
        run++
        continue
      }
      if (run >= minRun) for (let k = i - run; k < i; k++) out[start + k * step] = 255
      run = 0
    }
  }
  for (let y = 0; y < height; y++) clear(y * width, 1, width)
  for (let x = 0; x < width; x++) clear(x, width, height)
  return out
}

/**
 * Full pipeline on raw RGBA data. Dark-mode screenshots are inverted first so text is always dark.
 * Pass the image size to also strip table borders.
 */
export function binarize(rgba: Uint8ClampedArray, width?: number, height?: number): Uint8Array {
  let gray = stretchContrast(toGray(rgba))
  let sum = 0
  for (const v of gray) sum += v
  if (sum / gray.length < 110) gray = gray.map((v) => 255 - v)
  const bw = applyThreshold(gray, otsu(gray))
  return width && height ? removeLines(bw, width, height, Math.max(60, Math.round(width * 0.03))) : bw
}

const MIN_WIDTH = 2000
const MAX_WIDTH = 4000

/** Scale up small screenshots (OCR likes ~2000px wide), then binarize onto a fresh canvas. */
export function preprocessToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const scale = Math.min(MAX_WIDTH / width, Math.max(1, MIN_WIDTH / width))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas is not available in this browser')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const bw = binarize(img.data, canvas.width, canvas.height)
  for (let i = 0, p = 0; p < bw.length; i += 4, p++) {
    img.data[i] = img.data[i + 1] = img.data[i + 2] = bw[p]
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}
