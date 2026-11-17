import { describe, expect, it } from 'vitest'
import { SAMPLES } from '../samples'
import { colorForCourse } from './colors'
import { detectConflicts } from './conflictDetector'
import { parseDays } from './dayTokens'
import { parseSchedule } from './scheduleParser'
import { findTimeRange } from './timeUtils'

describe('parseDays', () => {
  it('separates T and TH', () => {
    expect(parseDays('TTH')).toEqual(['Tue', 'Thu'])
    expect(parseDays('T')).toEqual(['Tue'])
    expect(parseDays('TH')).toEqual(['Thu'])
    expect(parseDays('T/TH')).toEqual(['Tue', 'Thu'])
    expect(parseDays('THT')).toEqual(['Tue', 'Thu'])
  })
  it('handles multi-day tokens', () => {
    expect(parseDays('MWF')).toEqual(['Mon', 'Wed', 'Fri'])
    expect(parseDays('M-W-F')).toEqual(['Mon', 'Wed', 'Fri'])
    expect(parseDays('M/W/F')).toEqual(['Mon', 'Wed', 'Fri'])
    expect(parseDays('S')).toEqual(['Sat'])
    expect(parseDays('Mon/Wed')).toEqual(['Mon', 'Wed'])
  })
  it('rejects non-day tokens', () => {
    expect(parseDays('Embedded')).toBeNull()
    expect(parseDays('MATH')).toBeNull()
    expect(parseDays('TT')).toBeNull()
    expect(parseDays('')).toBeNull()
  })
})

describe('findTimeRange', () => {
  const r = (s: string) => {
    const t = findTimeRange(s)
    return t && [t.start, t.end]
  }
  it('normalizes 12h', () => {
    expect(r('08:00 AM - 09:30 AM')).toEqual([480, 570])
    expect(r('01:00 PM - 04:00 PM')).toEqual([780, 960])
    expect(r('7:30am to 9:00am')).toEqual([450, 540])
    expect(r('11:00 AM - 12:30 PM')).toEqual([660, 750])
    expect(r('12:00 PM - 1:00 PM')).toEqual([720, 780])
  })
  it('normalizes 24h', () => {
    expect(r('13:00-14:00')).toEqual([780, 840])
  })
  it('infers a missing meridiem', () => {
    expect(r('1-2pm')).toEqual([780, 840])
    expect(r('11-1pm')).toEqual([660, 780])
  })
  it('ignores non-times and invalid ranges', () => {
    expect(findTimeRange('CS 312 - Machine Learning')).toBeNull()
    expect(findTimeRange('10:00 AM - 9:00 AM')).toBeNull()
  })
  it('prefers a real time over a code-like prefix', () => {
    expect(r('CS 12 - 7:30am to 9:00am')).toEqual([450, 540])
  })
})

describe('parseSchedule', () => {
  it('parses all sample formats and skips the header', () => {
    const { courses, unparsed } = parseSchedule(SAMPLES.list.text)
    expect(unparsed).toEqual([])
    expect(courses.map((c) => c.courseCode)).toEqual(['CPE 401', 'CPE 403', 'CPE 405', 'MATH 204', 'CS 312'])

    const [cpe401, cpe403, cpe405, math, cs] = courses
    expect(cpe401).toMatchObject({
      courseTitle: 'Embedded Systems',
      days: ['Mon', 'Wed', 'Fri'],
      startTimeMinutes: 480,
      endTimeMinutes: 570,
      room: 'CICS-302',
      formattedTime: '8:00 AM – 9:30 AM',
    })
    expect(cpe403).toMatchObject({
      courseTitle: 'Computer Networks & Security',
      days: ['Tue', 'Thu'],
      room: 'CICS-Lab 2',
    })
    expect(cpe405.days).toEqual(['Sat'])
    expect(math).toMatchObject({ courseTitle: 'Differential Equations', days: ['Mon', 'Wed', 'Fri'], room: 'Room 205', startTimeMinutes: 780 })
    expect(cs).toMatchObject({ courseTitle: 'Machine Learning', days: ['Tue', 'Thu'], room: 'Lab 1', startTimeMinutes: 450 })
  })

  it('handles single-spaced lines', () => {
    const { courses, unparsed } = parseSchedule('CS 312 Machine Learning TTH 7:30am to 9:00am Lab 1')
    expect(unparsed).toEqual([])
    expect(courses[0]).toMatchObject({ courseTitle: 'Machine Learning', days: ['Tue', 'Thu'], room: 'Lab 1' })
  })

  it('reports noise instead of swallowing it', () => {
    const { courses, unparsed } = parseSchedule('\n\nTotal units: 15\nCPE 405   Microprocessors   S   01:00 PM - 04:00 PM   CEAFA-401   3.0\nCPE 999  Broken  XYZ  8:00 AM - 9:00 AM')
    expect(courses).toHaveLength(1)
    expect(unparsed.map((u) => u.lineNumber)).toEqual([3, 5])
  })

  it('gives the same colour to the same code', () => {
    expect(colorForCourse('CPE 401')).toEqual(colorForCourse('cpe401'))
  })
})

describe('detectConflicts', () => {
  it('finds nothing in the clean sample', () => {
    expect(detectConflicts(parseSchedule(SAMPLES.list.text).courses)).toEqual([])
  })

  it('reports each colliding day with the overlap window', () => {
    const conflicts = detectConflicts(parseSchedule(SAMPLES.conflict.text).courses)
    const mw = conflicts.filter((c) => c.a.courseCode === 'CPE 401' && c.b.courseCode === 'MATH 204')
    expect(mw.map((c) => c.day)).toEqual(['Mon', 'Wed', 'Fri'])
    expect(mw[0]).toMatchObject({ overlapStart: 540, overlapEnd: 570 })
    const tth = conflicts.filter((c) => c.a.courseCode === 'CPE 403')
    expect(tth.map((c) => c.day)).toEqual(['Tue', 'Thu'])
    expect(tth[0]).toMatchObject({ overlapStart: 630, overlapEnd: 690 })
  })

  it('treats back-to-back classes as non-conflicting', () => {
    const { courses } = parseSchedule('AA 101 | A | M | 8:00am-9:00am | R1\nBB 102 | B | M | 9:00am-10:00am | R2')
    expect(detectConflicts(courses)).toEqual([])
  })

  it('only flags shared days', () => {
    const { courses } = parseSchedule('AA 101 | A | MWF | 8:00am-9:00am | R1\nBB 102 | B | TTH | 8:00am-9:00am | R2')
    expect(detectConflicts(courses)).toEqual([])
  })
})
