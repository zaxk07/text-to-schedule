export interface TimeRangeMatch {
  start: number
  end: number
  /** index of the match in the source string */
  index: number
  length: number
}

const TIME_RANGE =
  /(?<![\d:])(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?(?![\w:])/gi

type Meridiem = 'a' | 'p' | undefined

function to24(hour: number, minute: number, mer: Meridiem): number {
  let h = hour
  if (mer === 'p' && h < 12) h += 12
  if (mer === 'a' && h === 12) h = 0
  return h * 60 + minute
}

function merOf(s: string | undefined): Meridiem {
  return s ? (s[0].toLowerCase() as Meridiem) : undefined
}

/**
 * Find and normalize a time range inside a line.
 * Handles "08:00 AM - 09:30 AM", "13:00-14:00", "7:30am to 9:00am", "1-2pm".
 * Returns null if nothing time-like is found or the values are invalid.
 */
export function findTimeRange(text: string): TimeRangeMatch | null {
  let weak: TimeRangeMatch | null = null

  const re = new RegExp(TIME_RANGE.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    // allow overlapping candidates ("CS 12 - 7:30am to 9:00am" must still find 7:30am to 9:00am)
    re.lastIndex = m.index + 1
    const sh = Number(m[1])
    const sm = Number(m[2] ?? 0)
    const eh = Number(m[4])
    const em = Number(m[5] ?? 0)
    const sMer = merOf(m[3])
    const eMer = merOf(m[6])
    if (sm > 59 || em > 59 || sh > 24 || eh > 24) continue

    const startStrong = m[2] !== undefined || sMer !== undefined
    const endStrong = m[5] !== undefined || eMer !== undefined
    // Bare "3-4" is ambiguous (section numbers, unit ranges): need a meridiem somewhere or colons on both sides.
    if (!(sMer || eMer || (m[2] !== undefined && m[5] !== undefined))) continue

    let start: number
    let end: number
    if (sMer) {
      start = to24(sh, sm, sMer)
      end = to24(eh, em, eMer ?? sMer)
      if (!eMer && end <= start) end = to24(eh, em, 'p')
    } else if (eMer) {
      // "11-1pm" -> 11am-1pm; "1-3pm" -> 1pm-3pm
      end = to24(eh, em, eMer)
      start = to24(sh, sm, eMer)
      if (start >= end) start = to24(sh, sm, eMer === 'p' ? 'a' : 'p')
    } else {
      // 24-hour clock
      start = sh * 60 + sm
      end = eh * 60 + em
    }

    if (end <= start || start < 0 || end > 24 * 60) continue

    const result: TimeRangeMatch = { start, end, index: m.index, length: m[0].length }
    if (startStrong && endStrong) return result
    weak ??= result
  }
  return weak
}

export function formatMinutes(total: number): string {
  const h24 = Math.floor(total / 60) % 24
  const m = total % 60
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatRange(start: number, end: number): string {
  return `${formatMinutes(start)} – ${formatMinutes(end)}`
}

/** "HH:MM" for <input type="time"> */
export function toInputValue(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function fromInputValue(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}
