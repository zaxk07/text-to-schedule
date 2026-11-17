import type { CourseBlock, Day } from '../types'

export const SEMESTER_WEEKS = 16

const DAY_ORDER: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BYDAY: Record<Day, string> = { Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA', Sun: 'SU' }

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

/** Next Monday strictly after `from` (local midnight). */
export function upcomingMonday(from: Date = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const daysAhead = ((8 - d.getDay()) % 7) || 7 // getDay: Sun=0, Mon=1
  d.setDate(d.getDate() + daysAhead)
  return d
}

/** Local "floating" date-time: YYYYMMDDTHHMMSS (interpreted in the importer's local timezone). */
function formatLocal(date: Date, minutes: number): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, minutes)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

function formatUtcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

/** Escape TEXT values per RFC 5545 §3.3.11. */
export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Fold lines to 75 octets (RFC 5545 §3.1) without splitting multi-byte characters. */
export function foldLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let cur = ''
  let curBytes = 0
  let limit = 75
  for (const ch of line) {
    const b = enc.encode(ch).length
    if (curBytes + b > limit) {
      parts.push(cur)
      cur = ''
      curBytes = 0
      limit = 74 // continuation lines start with a space
    }
    cur += ch
    curBytes += b
  }
  parts.push(cur)
  return parts.join('\r\n ')
}

export interface IcsOptions {
  title?: string
  /** Reference "today"; the semester starts on the next Monday after it. */
  today?: Date
  weeks?: number
}

export function buildIcs(courses: CourseBlock[], opts: IcsOptions = {}): string {
  const weeks = opts.weeks ?? SEMESTER_WEEKS
  const now = opts.today ?? new Date()
  const monday = upcomingMonday(now)
  const stamp = formatUtcStamp(now)

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Text to Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  if (opts.title) lines.push(`X-WR-CALNAME:${escapeText(opts.title)}`)

  for (const c of courses) {
    const days = [...new Set(c.days)].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    if (days.length === 0) continue
    // DTSTART must be the first occurrence, which is the earliest selected weekday on/after the start Monday.
    const first = new Date(monday)
    first.setDate(monday.getDate() + DAY_ORDER.indexOf(days[0]))
    const summary = [c.courseCode, c.courseTitle].filter(Boolean).join(' - ') || 'Class'

    lines.push(
      'BEGIN:VEVENT',
      `UID:${c.id}-${formatLocal(first, c.startTimeMinutes)}@text-to-schedule`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatLocal(first, c.startTimeMinutes)}`,
      `DTEND:${formatLocal(first, c.endTimeMinutes)}`,
      // COUNT counts occurrences, not weeks, so scale by days per week to get a full semester.
      `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')};COUNT=${weeks * days.length}`,
      `SUMMARY:${escapeText(summary)}`,
    )
    if (c.room) lines.push(`LOCATION:${escapeText(c.room)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

export function icsFileName(title: string): string {
  const base = (title || 'schedule').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'schedule'
  return `${base}.ics`
}

/** Build the calendar and trigger a browser download. */
export function downloadIcs(courses: CourseBlock[], title: string): void {
  const blob = new Blob([buildIcs(courses, { title })], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = icsFileName(title)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
