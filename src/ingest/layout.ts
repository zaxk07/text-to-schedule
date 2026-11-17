import type { PositionedToken } from '../types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_RE = /^(mon|tue|wed|thu|fri|sat|sun)/i

interface Row {
  y: number
  tokens: PositionedToken[]
}

const xc = (t: PositionedToken) => (t.x0 + t.x1) / 2
const yc = (t: PositionedToken) => (t.y0 + t.y1) / 2

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

function clusterRows(tokens: PositionedToken[]): Row[] {
  const tol = Math.max(2, median(tokens.map((t) => t.y1 - t.y0)) * 0.6)
  const sorted = [...tokens].sort((a, b) => yc(a) - yc(b))
  const rows: Row[] = []
  for (const t of sorted) {
    const last = rows[rows.length - 1]
    if (last && Math.abs(yc(t) - last.y) <= tol) {
      last.tokens.push(t)
      last.y = last.tokens.reduce((s, k) => s + yc(k), 0) / last.tokens.length
    } else {
      rows.push({ y: yc(t), tokens: [t] })
    }
  }
  for (const r of rows) r.tokens.sort((a, b) => a.x0 - b.x0)
  return rows
}

/**
 * Turn positioned fragments from a PDF or OCR into text.
 *
 * Grid timetables (a row with several "Subj"/"Room" headers) become tab-separated rows, with empty
 * cells kept, so the grid parser can tell which day column each value belongs to. Anything else
 * becomes plain lines, one per visual row.
 */
export function tokensToText(input: PositionedToken[]): string {
  const tokens = input.map((t) => ({ ...t, text: t.text.trim() })).filter((t) => t.text !== '')
  if (tokens.length === 0) return ''

  const rows = clusterRows(tokens)
  const subjRowIdx = rows.findIndex((r) => r.tokens.filter((t) => /^subj/i.test(t.text)).length >= 2)
  if (subjRowIdx >= 0) return gridText(rows, subjRowIdx)
  return linesText(rows, median(tokens.map((t) => t.y1 - t.y0)))
}

function linesText(rows: Row[], height: number): string {
  return rows
    .map((r) => {
      let out = ''
      r.tokens.forEach((t, i) => {
        if (i > 0) out += t.x0 - r.tokens[i - 1].x1 > height * 1.5 ? '   ' : ' '
        out += t.text
      })
      return out
    })
    .join('\n')
}

function gridText(rows: Row[], subjRowIdx: number): string {
  const sub = rows[subjRowIdx].tokens.filter((t) => /^(subj|room)/i.test(t.text))
  const anchors = sub.map(xc)
  const n = anchors.length
  const gap = n > 1 ? (anchors[n - 1] - anchors[0]) / (n - 1) : 60
  const timeBoundary = anchors[0] - gap / 2

  // Day names, in reading order, from the header row above the Subj/Room row (or on it).
  const dayTokens = [rows[subjRowIdx - 1], rows[subjRowIdx]]
    .filter(Boolean)
    .flatMap((r) => r.tokens.filter((t) => DAY_RE.test(t.text)))
  const dayCount = Math.ceil(n / 2)
  const dayNames =
    dayTokens.length === dayCount
      ? dayTokens.map((t) => DAYS[DAYS.findIndex((d) => d.toLowerCase() === t.text.slice(0, 3).toLowerCase())] ?? t.text)
      : DAYS.slice(0, dayCount)

  const header1 = ['Time', ...Array.from({ length: n }, (_, i) => (i % 2 === 0 ? dayNames[i / 2] : ''))]
  const header2 = ['', ...sub.map((t) => (/^subj/i.test(t.text) ? 'Subj' : 'Room'))]

  const lines = [header1.join('\t'), header2.join('\t')]
  for (const row of rows.slice(subjRowIdx + 1)) {
    const cells: string[][] = Array.from({ length: n + 1 }, () => [])
    for (const t of row.tokens) {
      if (xc(t) < timeBoundary) {
        cells[0].push(t.text)
        continue
      }
      let best = 0
      for (let i = 1; i < n; i++) if (Math.abs(xc(t) - anchors[i]) < Math.abs(xc(t) - anchors[best])) best = i
      cells[best + 1].push(t.text)
    }
    lines.push(cells.map((c) => c.join(' ')).join('\t'))
  }
  return lines.join('\n')
}
