import type { CourseBlock, Day, ParseResult, UnparsedLine } from '../types'
import { colorForCourse } from './colors'
import { findTimeRange, formatRange } from './timeUtils'

/**
 * Parser for 2D portal timetables:
 *
 *   Time               | Mon          | Tue          ...
 *                      | Subj | Room  | Subj | Room
 *   07:00 AM-07:30 AM  | CpE 426 | COMPLAB3 | ...
 *   07:30 AM-08:00 AM  | -do-    | -do-     | ...
 *
 * Cells are separated by tabs (what table copy and our PDF/OCR layout step produce) or by pipes.
 * Consecutive "-do-" (ditto) cells extend the class above instead of creating duplicate blocks.
 */

const DAY_NAMES: Record<string, Day> = {
  mon: 'Mon', monday: 'Mon',
  tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
  wed: 'Wed', weds: 'Wed', wednesday: 'Wed',
  thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
  fri: 'Fri', friday: 'Fri',
  sat: 'Sat', saturday: 'Sat',
  sun: 'Sun', sunday: 'Sun',
}

const DITTO_RE = /^[\s\-–—~_.'"]*d[o0]\.?[\s\-–—~_.'"]*$/i
const CODE_RE = /^([A-Za-z]{2,6})\s?-?(\d{2,4}[A-Za-z]?)\b\s*(.*)$/
const SLOT_MINUTES = 30

/** True for "-do-" and the usual OCR variants: "do", "- do -", "—do—", "-d0-". */
export function isDitto(cell: string): boolean {
  return DITTO_RE.test(cell.trim())
}

type Delimiter = 'tab' | 'pipe'

function pickDelimiter(lines: string[]): Delimiter | null {
  if (lines.some((l) => l.includes('\t'))) return 'tab'
  if (lines.filter((l) => (l.match(/\|/g) ?? []).length >= 4).length >= 2) return 'pipe'
  return null
}

function splitCells(line: string, delimiter: Delimiter): string[] {
  if (delimiter === 'tab') return line.split('\t').map((c) => c.trim())
  let l = line.trim()
  if (l.startsWith('|')) l = l.slice(1)
  if (l.endsWith('|')) l = l.slice(0, -1)
  return l.split('|').map((c) => c.trim())
}

/**
 * Fix the OCR slips that show up in time labels. The only letters a time label legitimately contains
 * are A, M and P, so any O is a misread 0 and any l/I/| is a misread 1: "O7:OO" -> "07:00".
 */
function normalizeTimeCell(cell: string): string {
  return cell.replace(/[Oo]/g, '0').replace(/[lI|]/g, '1').replace(/\s+/g, ' ')
}

interface Header {
  rowIndex: number
  days: { day: Day; subj: number; room: number }[]
}

function dayOfCell(cell: string): Day | null {
  const m = /^([A-Za-z]+)/.exec(cell.trim())
  return m ? (DAY_NAMES[m[1].toLowerCase()] ?? null) : null
}

/** Find the day header (optionally followed by a Subj/Room row) and map each day to its two columns. */
function findHeader(rows: string[][]): Header | null {
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const dayCols = rows[i].map((c, idx) => ({ day: dayOfCell(c), idx })).filter((d): d is { day: Day; idx: number } => d.day !== null)
    if (dayCols.length < 2) continue

    // A Subj/Room row directly below (or the same row) tells us the exact sub-columns.
    const subRow = [rows[i], rows[i + 1]].find((r) => r && r.filter((c) => /^subj/i.test(c.trim())).length >= 2)
    const subjCols = subRow ? subRow.map((c, idx) => (/^subj/i.test(c.trim()) ? idx : -1)).filter((x) => x >= 0) : []

    const days: Header['days'] = []
    if (subjCols.length >= dayCols.length) {
      dayCols.forEach((d, n) => {
        // Equal counts: pair by order. Otherwise take the first Subj column at or after the day's cell.
        const subj = subjCols.length === dayCols.length ? subjCols[n] : (subjCols.find((s) => s >= d.idx) ?? subjCols[n])
        days.push({ day: d.day, subj, room: subj + 1 })
      })
    } else {
      // No Subj/Room row: assume each day's header cell sits over its Subj column, Room right after it.
      dayCols.forEach((d) => days.push({ day: d.day, subj: d.idx, room: d.idx + 1 }))
    }
    return { rowIndex: subRow && subRow !== rows[i] ? i + 1 : i, days }
  }
  return null
}

/** Cheap check used for auto-detection. */
export function looksLikeGrid(text: string): boolean {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const delimiter = pickDelimiter(lines)
  if (!delimiter) return false
  const rows = lines.map((l) => splitCells(l, delimiter))

  const slotRows = rows.filter((r) => {
    const t = findTimeRange(normalizeTimeCell(r[0] ?? ''))
    return t !== null && t.end - t.start <= 120
  })
  if (slotRows.length < 2) return false

  const hasSubjRoom = /\bsubj\b/i.test(text) && /\broom\b/i.test(text)
  const hasDitto = rows.some((r) => r.slice(1).some((c) => c.trim() !== '' && isDitto(c)))
  const hasDayRow = rows.some((r) => r.filter((c) => dayOfCell(c) !== null).length >= 3)
  return hasSubjRoom || hasDitto || hasDayRow
}

interface OpenBlock {
  code: string
  title: string
  room: string
  start: number
  end: number
}

/** Join the pieces of a cell that wrapped onto two lines, gluing after a trailing hyphen. */
function joinWrapped(a: string, b: string): string {
  return a.endsWith('-') ? a + b : a ? `${a} ${b}` : b
}

function splitSubject(raw: string): { code: string; title: string } {
  const clean = raw.replace(/\s+/g, ' ').trim()
  const m = CODE_RE.exec(clean)
  if (!m) return { code: clean.toUpperCase(), title: clean }
  const code = `${m[1].toUpperCase()} ${m[2].toUpperCase()}`
  return { code, title: m[3].trim() || code }
}

export function parseGridMatrix(text: string): ParseResult {
  const unparsed: UnparsedLine[] = []
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.filter((l) => l.trim())
  const delimiter = pickDelimiter(nonEmpty)
  if (!delimiter) return { courses: [], unparsed }

  // Keep original line numbers so skipped rows can be reported accurately.
  const indexed = lines.map((l, i) => ({ line: l, lineNumber: i + 1 })).filter((x) => x.line.trim())
  const rows = indexed.map((x) => splitCells(x.line, delimiter))

  const header = findHeader(rows)
  if (!header) return { courses: [], unparsed }

  const open = new Map<Day, OpenBlock | null>()
  const done: (OpenBlock & { day: Day })[] = []
  const close = (day: Day) => {
    const b = open.get(day)
    if (b) done.push({ ...b, day })
    open.set(day, null)
  }

  let prevEnd: number | null = null

  for (let r = header.rowIndex + 1; r < rows.length; r++) {
    const cells = rows[r]
    const { line, lineNumber } = indexed[r]
    const dayCells = header.days.map((d) => ({
      day: d.day,
      subj: (cells[d.subj] ?? '').trim(),
      room: (cells[d.room] ?? '').trim(),
    }))
    const hasContent = dayCells.some((c) => c.subj || c.room)

    const label = (cells[0] ?? '').trim()

    // No label at all: this is a wrapped line of the row above ("CICS-" / "302"), not a new time slot.
    if (!label && hasContent) {
      let attached = false
      for (const c of dayCells) {
        const current = open.get(c.day)
        if (!current || isDitto(c.subj) || isDitto(c.room)) continue
        if (c.room) {
          current.room = joinWrapped(current.room, c.room)
          attached = true
        }
        if (c.subj) {
          current.title = joinWrapped(current.title, c.subj)
          attached = true
        }
      }
      if (!attached) unparsed.push({ lineNumber, text: line.trim(), reason: 'Row has no time slot and nothing above it to attach to' })
      continue
    }

    const slot = findTimeRange(normalizeTimeCell(label))
    let start: number
    let end: number
    if (slot) {
      start = slot.start
      end = slot.end
    } else if (hasContent && prevEnd !== null) {
      // Unreadable time label between valid ones: assume the next 30-minute slot.
      start = prevEnd
      end = prevEnd + SLOT_MINUTES
    } else {
      if (hasContent) unparsed.push({ lineNumber, text: line.trim(), reason: 'Could not read the time slot for this row' })
      continue
    }
    prevEnd = end

    for (const c of dayCells) {
      const current = open.get(c.day) ?? null

      if (c.subj && isDitto(c.subj)) {
        if (current && current.end === start) {
          current.end = end
          if (!current.room && c.room && !isDitto(c.room)) current.room = c.room
        } else {
          close(c.day)
          unparsed.push({ lineNumber, text: line.trim(), reason: `"-do-" under ${c.day} has no class above it to continue` })
        }
      } else if (c.subj) {
        close(c.day)
        const { code, title } = splitSubject(c.subj)
        open.set(c.day, { code, title, room: isDitto(c.room) ? '' : c.room, start, end })
      } else if (current && current.end === start && c.room && isDitto(c.room)) {
        current.end = end
      } else {
        close(c.day)
      }
    }
  }
  for (const d of header.days) close(d.day)

  // Same class at the same time/room on several days becomes one block (Mon/Wed/Fri).
  const merged = new Map<string, CourseBlock>()
  let n = 0
  for (const b of done.sort((a, z) => a.start - z.start || a.code.localeCompare(z.code))) {
    const key = `${b.code}|${b.start}|${b.end}|${b.room}`
    const existing = merged.get(key)
    if (existing) {
      if (!existing.days.includes(b.day)) existing.days.push(b.day)
      continue
    }
    merged.set(key, {
      id: `g${++n}`,
      courseCode: b.code,
      courseTitle: b.title,
      days: [b.day],
      startTimeMinutes: b.start,
      endTimeMinutes: b.end,
      formattedTime: formatRange(b.start, b.end),
      room: b.room,
      color: colorForCourse(b.code),
      sourceLine: `${b.code} ${formatRange(b.start, b.end)}`,
    })
  }

  const order: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const courses = [...merged.values()].map((c) => ({ ...c, days: order.filter((d) => c.days.includes(d)) }))
  return { courses, unparsed }
}
