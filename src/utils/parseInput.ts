import type { InputFormat, ParseResult } from '../types'
import { looksLikeGrid, parseGridMatrix } from './gridMatrixParser'
import { parseSchedule } from './scheduleParser'

export interface ParsedInput extends ParseResult {
  format: InputFormat
}

export function detectFormat(text: string): InputFormat {
  return looksLikeGrid(text) ? 'grid' : 'lines'
}

/** Route text to the 2D grid parser or the line-by-line parser, whichever fits. */
export function parseAny(text: string): ParsedInput {
  if (detectFormat(text) === 'grid') {
    const grid = parseGridMatrix(text)
    if (grid.courses.length > 0) return { ...grid, format: 'grid' }
  }
  return { ...parseSchedule(text), format: 'lines' }
}
