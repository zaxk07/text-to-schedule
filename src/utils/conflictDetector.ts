import { ALL_DAYS } from '../constants'
import type { CourseBlock, ScheduleConflict } from '../types'
import { formatRange } from './timeUtils'

/** Strict interval overlap: back-to-back classes (end === start) do not conflict. */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function detectConflicts(blocks: CourseBlock[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  for (const day of ALL_DAYS) {
    const onDay = blocks
      .filter((b) => b.days.includes(day))
      .sort((x, y) => x.startTimeMinutes - y.startTimeMinutes)
    for (let i = 0; i < onDay.length; i++) {
      for (let j = i + 1; j < onDay.length; j++) {
        const a = onDay[i]
        const b = onDay[j]
        // sorted by start: once b starts at/after a's end, later blocks can't overlap a either
        if (b.startTimeMinutes >= a.endTimeMinutes) break
        if (overlaps(a.startTimeMinutes, a.endTimeMinutes, b.startTimeMinutes, b.endTimeMinutes)) {
          conflicts.push({
            a,
            b,
            day,
            overlapStart: Math.max(a.startTimeMinutes, b.startTimeMinutes),
            overlapEnd: Math.min(a.endTimeMinutes, b.endTimeMinutes),
          })
        }
      }
    }
  }
  return conflicts
}

/** Per-day set of conflicting ids so a block is only flagged on the days it actually collides. */
export function conflictedKeys(conflicts: ScheduleConflict[]): Set<string> {
  const keys = new Set<string>()
  for (const c of conflicts) {
    keys.add(`${c.a.id}:${c.day}`)
    keys.add(`${c.b.id}:${c.day}`)
  }
  return keys
}

export function describeConflict(c: ScheduleConflict): string {
  return `${c.a.courseCode} and ${c.b.courseCode} overlap on ${c.day} ${formatRange(c.overlapStart, c.overlapEnd)}`
}
