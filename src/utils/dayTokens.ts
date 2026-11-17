import type { Day } from '../types'

const ORDER: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const NAMED: Record<string, Day> = {
  MON: 'Mon', MONDAY: 'Mon',
  TUE: 'Tue', TUES: 'Tue', TUESDAY: 'Tue',
  WED: 'Wed', WEDS: 'Wed', WEDNESDAY: 'Wed',
  THU: 'Thu', THUR: 'Thu', THURS: 'Thu', THURSDAY: 'Thu',
  FRI: 'Fri', FRIDAY: 'Fri',
  SAT: 'Sat', SATURDAY: 'Sat',
  SUN: 'Sun', SUNDAY: 'Sun',
}

const SEPARATORS = /[\s/\-,&.+]+/

function sortUnique(days: Day[]): Day[] {
  return ORDER.filter((d) => days.includes(d))
}

/**
 * Parse a day token such as "MWF", "TTH", "T/TH", "M-W-F", "S", or "Mon/Wed".
 * Returns null when the token is not a pure day expression.
 * "TH" is always tried before "T", so "TTH" is Tue + Thu, never Tue + Tue + ?.
 */
export function parseDays(raw: string): Day[] | null {
  const parts = raw.trim().toUpperCase().split(SEPARATORS).filter(Boolean)
  if (parts.length === 0) return null

  // Full or abbreviated day names ("Mon/Wed", "Tuesday Thursday")
  if (parts.every((p) => p in NAMED)) {
    const days = parts.map((p) => NAMED[p])
    return new Set(days).size === days.length ? sortUnique(days) : null
  }

  // Single-letter codes, greedy with TH before T
  const joined = parts.join('')
  if (!/^[MTWFHS]+$/.test(joined) || joined.length > 8) return null

  const found: Day[] = []
  let i = 0
  while (i < joined.length) {
    const ch = joined[i]
    let day: Day | null = null
    if (ch === 'T' && joined[i + 1] === 'H') {
      day = 'Thu'
      i += 2
    } else {
      i += 1
      if (ch === 'M') day = 'Mon'
      else if (ch === 'T') day = 'Tue'
      else if (ch === 'W') day = 'Wed'
      else if (ch === 'F') day = 'Fri'
      else if (ch === 'S') day = 'Sat'
    }
    if (!day || found.includes(day)) return null
    found.push(day)
  }
  return sortUnique(found)
}
