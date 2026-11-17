import type { CourseColor } from '../types'

// Hand-picked hues spread around the wheel. Reds are left out on purpose: red means "conflict" in this UI.
const HUES = [28, 54, 90, 140, 172, 200, 232, 262, 292, 312]

function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Deterministic colour per unique course code (whitespace/case insensitive). */
export function colorForCourse(courseCode: string): CourseColor {
  const key = courseCode.replace(/\s+/g, '').toUpperCase()
  return { hue: HUES[fnv1a(key) % HUES.length] }
}
