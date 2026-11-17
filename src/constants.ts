import type { Day } from './types'

/** Days always shown on the timetable. Sunday appears only when a course meets on it. */
export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const ALL_DAYS: Day[] = [...DAYS, 'Sun']
export const DAY_LABELS: Record<Day, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

export const GRID_START = 7 * 60
export const GRID_END = 20 * 60
export const SLOT_MINUTES = 30
export const SLOT_HEIGHT = 36 // px per 30 minutes
