import { describe, expect, it } from 'vitest'
import { SAMPLES } from '../samples'
import { isDitto, looksLikeGrid, parseGridMatrix } from './gridMatrixParser'
import { detectFormat, parseAny } from './parseInput'

const HEADER = ['Time\tMon\t\tTue\t\tWed', '\tSubj\tRoom\tSubj\tRoom\tSubj\tRoom'].join('\n')
const slots = ['07:00 AM-07:30 AM', '07:30 AM-08:00 AM', '08:00 AM-08:30 AM', '08:30 AM-09:00 AM', '09:00 AM-09:30 AM', '09:30 AM-10:00 AM', '10:00 AM-10:30 AM']

/** Build a grid with one row per slot; `cells` are [monSubj, monRoom, tueSubj, tueRoom, wedSubj, wedRoom]. */
function grid(rows: string[][]): string {
  return [HEADER, ...rows.map((cells, i) => [slots[i], ...cells].join('\t'))].join('\n')
}
describe('isDitto', () => {
  it.each(['-do-', 'do', '- do -', '—do—', '-d0-', 'DO', '-Do-', 'do.'])('accepts %s', (v) => {
    expect(isDitto(v)).toBe(true)
  })
  it.each(['', 'CpE 426', 'domain', 'dot', 'COMPLAB3'])('rejects %s', (v) => {
    expect(isDitto(v)).toBe(false)
  })
})

describe('parseGridMatrix: -do- continuation', () => {
  it('merges a start row plus five -do- rows into 7:00 AM - 10:00 AM', () => {
    const text = grid([
      ['CpE 426', 'COMPLAB3', '', '', '', ''],
      ...Array.from({ length: 5 }, () => ['-do-', '-do-', '', '', '', '']),
    ])
    const { courses, unparsed } = parseGridMatrix(text)
    expect(unparsed).toEqual([])
    expect(courses).toHaveLength(1)
    expect(courses[0]).toMatchObject({
      courseCode: 'CPE 426',
      days: ['Mon'],
      startTimeMinutes: 7 * 60,
      endTimeMinutes: 10 * 60,
      formattedTime: '7:00 AM – 10:00 AM',
      room: 'COMPLAB3',
    })
  })

  it('handles OCR variants of the ditto marker', () => {
    const text = grid([
      ['CpE 426', 'COMPLAB3', '', '', '', ''],
      ['do', 'do', '', '', '', ''],
      ['- do -', '- do -', '', '', '', ''],
      ['—do—', '—do—', '', '', '', ''],
      ['-d0-', '-d0-', '', '', '', ''],
      ['-do-', '-do-', '', '', '', ''],
    ])
    const { courses, unparsed } = parseGridMatrix(text)
    expect(unparsed).toEqual([])
    expect(courses).toHaveLength(1)
    expect([courses[0].startTimeMinutes, courses[0].endTimeMinutes]).toEqual([420, 600])
  })

  it('does not treat a ditto on a different day as a continuation of another column', () => {
    const text = grid([
      ['CpE 426', 'LAB', '', '', '', ''],
      ['-do-', '-do-', 'MATH 101', 'R1', '', ''],
      ['-do-', '-do-', '-do-', '-do-', '', ''],
    ])
    const { courses } = parseGridMatrix(text)
    const byCode = Object.fromEntries(courses.map((c) => [c.courseCode, c]))
    expect(byCode['CPE 426']).toMatchObject({ days: ['Mon'], startTimeMinutes: 420, endTimeMinutes: 510 })
    expect(byCode['MATH 101']).toMatchObject({ days: ['Tue'], startTimeMinutes: 450, endTimeMinutes: 510 })
  })

  it('splits back-to-back different classes', () => {
    const text = grid([
      ['CpE 426', 'LAB1', '', '', '', ''],
      ['-do-', '-do-', '', '', '', ''],
      ['CpE 431', 'LAB2', '', '', '', ''],
      ['-do-', '-do-', '', '', '', ''],
    ])
    const { courses } = parseGridMatrix(text)
    expect(courses.map((c) => [c.courseCode, c.room, c.startTimeMinutes, c.endTimeMinutes])).toEqual([
      ['CPE 426', 'LAB1', 420, 480],
      ['CPE 431', 'LAB2', 480, 540],
    ])
  })

  it('ends a block at an empty cell, so a later ditto is reported instead of silently merged', () => {
    const text = grid([
      ['CpE 426', 'LAB', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['-do-', '-do-', '', '', '', ''],
    ])
    const { courses, unparsed } = parseGridMatrix(text)
    expect(courses[0]).toMatchObject({ startTimeMinutes: 420, endTimeMinutes: 450 })
    expect(unparsed).toHaveLength(1)
    expect(unparsed[0].reason).toMatch(/no class above/)
  })

  it('reports a leading ditto with nothing above it', () => {
    const { unparsed } = parseGridMatrix(grid([['-do-', '-do-', '', '', '', '']]))
    expect(unparsed).toHaveLength(1)
  })

  it('merges the same class on several days into one block', () => {
    const text = grid([
      ['CpE 426', 'LAB', '', '', 'CpE 426', 'LAB'],
      ['-do-', '-do-', '', '', '-do-', '-do-'],
    ])
    const { courses } = parseGridMatrix(text)
    expect(courses).toHaveLength(1)
    expect(courses[0].days).toEqual(['Mon', 'Wed'])
  })

  it('tolerates OCR noise in the time label and a missing label', () => {
    const text = [
      HEADER,
      'O7:OO AM-07:30AM\tCpE 426\tLAB\t\t\t\t',
      '??:?? AM-??:?? AM\t-do-\t-do-\t\t\t\t', // unreadable label: assume the next 30-minute slot
      '08:00 AM-08:30 AM\t-do-\t-do-\t\t\t\t',
    ].join('\n')
    const { courses, unparsed } = parseGridMatrix(text)
    expect(unparsed).toEqual([])
    expect([courses[0].startTimeMinutes, courses[0].endTimeMinutes]).toEqual([420, 510])
  })

  it('attaches a wrapped second line of a cell to the class above', () => {
    const text = [
      HEADER,
      '07:00 AM-07:30 AM\tCpE 431\tCICS-\t\t\t\t',
      '\t\t302\t\t\t\t',
      '07:30 AM-08:00 AM\t-do-\t-do-\t\t\t\t',
    ].join('\n')
    const { courses, unparsed } = parseGridMatrix(text)
    expect(unparsed).toEqual([])
    expect(courses).toHaveLength(1)
    expect(courses[0]).toMatchObject({ room: 'CICS-302', startTimeMinutes: 420, endTimeMinutes: 480 })
  })

  it('reads Sunday', () => {
    const text = [
      'Time\tSat\t\tSun',
      '\tSubj\tRoom\tSubj\tRoom',
      '07:00 AM-07:30 AM\t\t\tCpE 500\tR9',
      '07:30 AM-08:00 AM\t\t\t-do-\t-do-',
    ].join('\n')
    const { courses } = parseGridMatrix(text)
    expect(courses[0]).toMatchObject({ days: ['Sun'], courseCode: 'CPE 500', room: 'R9' })
  })

  it('works without a Subj/Room row and with pipe separators', () => {
    const text = [
      '| Time | Mon | | Tue | |',
      '| 07:00 AM-07:30 AM | CpE 426 | LAB | | |',
      '| 07:30 AM-08:00 AM | -do- | -do- | | |',
    ].join('\n')
    expect(looksLikeGrid(text)).toBe(true)
    const { courses } = parseGridMatrix(text)
    expect(courses[0]).toMatchObject({ courseCode: 'CPE 426', startTimeMinutes: 420, endTimeMinutes: 480 })
  })
})

describe('auto-detection', () => {
  it('routes the grid sample to the grid parser', () => {
    expect(detectFormat(SAMPLES.grid.text)).toBe('grid')
    const result = parseAny(SAMPLES.grid.text)
    expect(result.format).toBe('grid')
    expect(result.unparsed).toEqual([])
    const cpe426 = result.courses.find((c) => c.courseCode === 'CPE 426')!
    expect(cpe426).toMatchObject({ days: ['Mon', 'Wed'], startTimeMinutes: 420, endTimeMinutes: 600, room: 'COMPLAB3' })
    expect(result.courses.find((c) => c.courseCode === 'CPE 431')).toMatchObject({ days: ['Tue', 'Thu'], startTimeMinutes: 600, endTimeMinutes: 720 })
    expect(result.courses.find((c) => c.courseCode === 'NSTP 102')).toMatchObject({ days: ['Sat'], startTimeMinutes: 780, endTimeMinutes: 900 })
  })

  it('routes line-by-line samples to the line parser', () => {
    for (const preset of [SAMPLES.list, SAMPLES.conflict]) {
      expect(detectFormat(preset.text)).toBe('lines')
      expect(parseAny(preset.text).format).toBe('lines')
    }
  })

  it('falls back to the line parser when grid parsing finds nothing', () => {
    const text = 'CPE 401   Embedded Systems   M/W/F   08:00 AM - 09:30 AM   CICS-302   3.0'
    expect(parseAny(text)).toMatchObject({ format: 'lines' })
    expect(parseAny(text).courses).toHaveLength(1)
  })

  it('handles empty input', () => {
    expect(parseAny('')).toMatchObject({ courses: [], unparsed: [] })
  })
})
