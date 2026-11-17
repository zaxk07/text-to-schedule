export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export interface CourseColor {
  /** hue 0-360, used to derive light/dark theme colors via CSS */
  hue: number
}

export interface CourseBlock {
  id: string
  courseCode: string
  courseTitle: string
  days: Day[]
  startTimeMinutes: number
  endTimeMinutes: number
  formattedTime: string
  room: string
  color: CourseColor
  sourceLine: string
}

export interface ScheduleConflict {
  a: CourseBlock
  b: CourseBlock
  day: Day
  overlapStart: number
  overlapEnd: number
}

export interface UnparsedLine {
  lineNumber: number
  text: string
  reason: string
}

export interface ParseResult {
  courses: CourseBlock[]
  unparsed: UnparsedLine[]
}

/** A word/fragment with its position on the page, from PDF text or OCR. Y grows downward. */
export interface PositionedToken {
  text: string
  x0: number
  x1: number
  y0: number
  y1: number
}

export type InputFormat = 'grid' | 'lines'
