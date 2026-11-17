import type { CourseBlock, ParseResult, UnparsedLine } from '../types'
import { colorForCourse } from './colors'
import { parseDays } from './dayTokens'
import { findTimeRange, formatRange } from './timeUtils'

const CODE_RE = /^([A-Za-z]{2,6})\s?-?(\d{2,4}[A-Za-z]?)\b\s*(.*)$/
const UNITS_RE = /^\d+(\.\d+)?$/
const HEADER_WORDS = /\b(course|subject|code|description|title|days?|time|room|units?|section|schedule|instructor)\b/gi
const SEGMENT_SPLIT = /\t+|\s{2,}|\s*\|\s*|\s+[-–—]\s+/

const MARK = '\u0000'

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/^[\s|,:;-]+|[\s|,:;-]+$/g, '')
}

function isHeader(line: string): boolean {
  return (line.match(HEADER_WORDS) ?? []).length >= 2
}

/** Parse one line into a block, or return the reason it failed. */
function parseLine(line: string, lineNumber: number): CourseBlock | string {
  const time = findTimeRange(line)
  if (!time) return 'No time range found'

  const before = line.slice(0, time.index)
  const after = line.slice(time.index + time.length)

  // 1. Segment-based pass (tabs, 2+ spaces, pipes, " - ")
  let segments = before.split(SEGMENT_SPLIT).map(clean).filter(Boolean)
  let dayIdx = -1
  for (let i = segments.length - 1; i >= 1; i--) {
    if (parseDays(segments[i])) {
      dayIdx = i
      break
    }
  }

  let codeSeg: string
  let titleParts: string[]
  let days = dayIdx >= 0 ? parseDays(segments[dayIdx]) : null

  if (days) {
    codeSeg = segments[0]
    titleParts = segments.slice(1, dayIdx)
  } else {
    // 2. Token fallback for single-spaced lines: "CS 312 Machine Learning TTH 7:30am ..."
    const tokens = clean(before).split(/\s+/).filter(Boolean)
    let idx = -1
    for (let i = tokens.length - 1; i >= 1; i--) {
      if (parseDays(tokens[i])) {
        idx = i
        break
      }
    }
    if (idx < 0) return 'No day code found (expected e.g. MWF, TTH, T/TH, S)'
    days = parseDays(tokens[idx])
    segments = [tokens.slice(0, idx).join(' ')]
    codeSeg = segments[0]
    titleParts = []
  }
  if (!days) return 'No day code found (expected e.g. MWF, TTH, T/TH, S)'

  const codeMatch = CODE_RE.exec(codeSeg)
  if (!codeMatch) return 'No course code found (expected e.g. CPE 401)'
  const courseCode = `${codeMatch[1].toUpperCase()} ${codeMatch[2].toUpperCase()}`
  const courseTitle = clean([codeMatch[3], ...titleParts].join(' ')) || courseCode

  const room = clean(
    after
      .replace(MARK, '')
      .split(SEGMENT_SPLIT)
      .map(clean)
      .filter((s) => s && !UNITS_RE.test(s))
      .join(' '),
  )

  return {
    id: `c${lineNumber}`,
    courseCode,
    courseTitle,
    days,
    startTimeMinutes: time.start,
    endTimeMinutes: time.end,
    formattedTime: formatRange(time.start, time.end),
    room,
    color: colorForCourse(courseCode),
    sourceLine: line.trim(),
  }
}

/** Parse pasted portal text into course blocks. Blank lines and table headers are skipped silently. */
export function parseSchedule(text: string): ParseResult {
  const courses: CourseBlock[] = []
  const unparsed: UnparsedLine[] = []

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    const lineNumber = i + 1

    const result = parseLine(line, lineNumber)
    if (typeof result === 'string') {
      if (result === 'No time range found' && isHeader(line)) return
      unparsed.push({ lineNumber, text: line, reason: result })
    } else {
      courses.push(result)
    }
  })

  return { courses, unparsed }
}
