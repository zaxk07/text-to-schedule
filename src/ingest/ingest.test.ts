import { describe, expect, it } from 'vitest'
import type { PositionedToken } from '../types'
import { parseAny } from '../utils/parseInput'
import { tokensToText } from './layout'
import { applyThreshold, binarize, otsu, removeLines, stretchContrast, toGray } from './preprocess'

/** Build a token at a column/row position on a fake page. */
const tok = (text: string, x: number, row: number, w = 40): PositionedToken => ({ text, x0: x, x1: x + w, y0: row * 20, y1: row * 20 + 12 })

describe('tokensToText', () => {
  // Column centers: time ~50, Mon subj 150 / room 210, Tue subj 270 / room 330
  const header = [
    tok('Time', 30, 0), tok('Mon', 170, 0), tok('Tue', 290, 0),
    tok('Subj', 130, 1), tok('Room', 190, 1), tok('Subj', 250, 1), tok('Room', 310, 1),
  ]

  it('keeps empty cells so days stay aligned, and the result parses as a grid', () => {
    const tokens = [
      ...header,
      tok('07:00', 20, 2, 30), tok('AM-07:30', 52, 2, 40), tok('AM', 95, 2, 12), tok('CpE', 120, 2, 25), tok('426', 148, 2, 22), tok('COMPLAB3', 190, 2, 55),
      tok('07:30', 20, 3, 30), tok('AM-08:00', 52, 3, 40), tok('AM', 95, 3, 12), tok('-do-', 130, 3, 30), tok('-do-', 190, 3, 30),
      tok('08:00', 20, 4, 30), tok('AM-08:30', 52, 4, 40), tok('AM', 95, 4, 12), tok('-do-', 130, 4, 30), tok('-do-', 190, 4, 30),
    ]
    const text = tokensToText(tokens)
    const lines = text.split('\n')
    expect(lines[0]).toBe('Time\tMon\t\tTue\t')
    expect(lines[1]).toBe('\tSubj\tRoom\tSubj\tRoom')
    expect(lines[2]).toBe('07:00 AM-07:30 AM\tCpE 426\tCOMPLAB3\t\t')

    const result = parseAny(text)
    expect(result.format).toBe('grid')
    expect(result.courses).toHaveLength(1)
    expect(result.courses[0]).toMatchObject({ courseCode: 'CPE 426', days: ['Mon'], startTimeMinutes: 420, endTimeMinutes: 510, room: 'COMPLAB3' })
  })

  it('puts a value in the right day column when an earlier column is empty', () => {
    const tokens = [...header, tok('07:00', 20, 2, 30), tok('AM-07:30', 52, 2, 40), tok('AM', 95, 2, 12), tok('MATH', 250, 2, 30), tok('1', 282, 2, 8), tok('R2', 310, 2, 20)]
    const [, , row] = tokensToText(tokens).split('\n')
    expect(row.split('\t')).toEqual(['07:00 AM-07:30 AM', '', '', 'MATH 1', 'R2'])
  })

  it('turns ordinary rows into plain lines', () => {
    const text = tokensToText([tok('CPE', 0, 0, 25), tok('401', 30, 0, 25), tok('M/W/F', 160, 0, 40), tok('Embedded', 60, 0, 50)])
    expect(text).toBe('CPE 401 Embedded   M/W/F')
  })

  it('returns an empty string for no tokens', () => {
    expect(tokensToText([])).toBe('')
  })
})

describe('preprocess', () => {
  const rgba = (...px: [number, number, number][]) => new Uint8ClampedArray(px.flatMap(([r, g, b]) => [r, g, b, 255]))

  it('converts to grayscale with luma weights', () => {
    expect(Array.from(toGray(rgba([255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 255])))).toEqual([76, 150, 29, 255])
  })

  it('stretches a low-contrast range', () => {
    const gray = new Uint8Array(100).map((_, i) => 100 + (i % 50)) // 100..149
    const out = stretchContrast(gray)
    expect(Math.min(...out)).toBeLessThan(10)
    expect(Math.max(...out)).toBeGreaterThan(245)
  })

  it('finds a threshold between dark ink and light paper', () => {
    const gray = new Uint8Array([...Array(30).fill(40), ...Array(70).fill(220)])
    const t = otsu(gray)
    expect(t).toBeGreaterThanOrEqual(40)
    expect(t).toBeLessThan(220)
    expect(Array.from(applyThreshold(new Uint8Array([40, 220]), t))).toEqual([0, 255])
  })

  it('binarizes to pure black and white, and inverts dark-mode screenshots', () => {
    const light = binarize(rgba(...Array.from({ length: 100 }, (_, i): [number, number, number] => (i < 20 ? [30, 30, 30] : [235, 235, 235]))))
    expect(new Set(light)).toEqual(new Set([0, 255]))
    expect(light[0]).toBe(0) // ink stays black

    const dark = binarize(rgba(...Array.from({ length: 100 }, (_, i): [number, number, number] => (i < 20 ? [230, 230, 230] : [20, 20, 20]))))
    expect(dark[0]).toBe(0) // light text on dark background becomes black text
    expect(dark[99]).toBe(255)
  })
})

describe('removeLines', () => {
  it('whitens long borders but keeps letter-sized marks', () => {
    const w = 120
    const h = 40
    const bw = new Uint8Array(w * h).fill(255)
    for (let x = 0; x < w; x++) bw[20 * w + x] = 0 // full-width horizontal border
    for (let y = 0; y < h; y++) bw[y * w + 60] = 0 // full-height vertical border
    for (let x = 10; x < 18; x++) bw[5 * w + x] = 0 // short stroke (part of a letter)
    const out = removeLines(bw, w, h, 30)
    expect(out[20 * w + 5]).toBe(255)
    expect(out[10 * w + 60]).toBe(255)
    expect(out[5 * w + 12]).toBe(0)
  })
})
