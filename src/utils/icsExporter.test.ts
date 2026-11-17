import { describe, expect, it } from 'vitest'
import type { CourseBlock } from '../types'
import { buildIcs, escapeText, foldLine, icsFileName, upcomingMonday } from './icsExporter'

const course = (over: Partial<CourseBlock> = {}): CourseBlock => ({
  id: 'c1',
  courseCode: 'CS 101',
  courseTitle: 'Intro, to; Computing',
  days: ['Wed', 'Mon'],
  startTimeMinutes: 8 * 60 + 30,
  endTimeMinutes: 10 * 60,
  formattedTime: '8:30 AM – 10:00 AM',
  room: 'Room 204',
  color: { hue: 10 },
  sourceLine: '',
  ...over,
})

// Tuesday 2026-11-17 -> upcoming Monday is 2026-11-23
const today = new Date(2026, 10, 17, 12, 0, 0)

describe('icsExporter', () => {
  it('emits RFC 5545 structure with CRLF endings', () => {
    const ics = buildIcs([course()], { today })
    for (const l of ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'END:VEVENT', 'END:VCALENDAR']) {
      expect(ics).toContain(l)
    }
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=32')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true)
  })

  it('formats local start/end on the upcoming Monday', () => {
    const ics = buildIcs([course()], { today })
    expect(ics).toContain('DTSTART:20261123T083000')
    expect(ics).toContain('DTEND:20261123T100000')
  })

  it('starts on the first selected weekday', () => {
    const ics = buildIcs([course({ days: ['Thu'] })], { today })
    expect(ics).toContain('DTSTART:20261126T083000')
    expect(ics).toContain('BYDAY=TH;COUNT=16')
  })

  it('maps summary and location with escaping', () => {
    const ics = buildIcs([course()], { today })
    expect(ics).toContain('SUMMARY:CS 101 - Intro\\, to\\; Computing')
    expect(ics).toContain('LOCATION:Room 204')
  })

  it('omits LOCATION when no room', () => {
    expect(buildIcs([course({ room: '' })], { today })).not.toContain('LOCATION')
  })

  it('upcomingMonday is strictly after today', () => {
    expect(upcomingMonday(new Date(2026, 10, 23)).getDate()).toBe(30)
    expect(upcomingMonday(new Date(2026, 10, 22)).getDate()).toBe(23)
  })

  it('folds long lines at 75 octets', () => {
    const folded = foldLine('SUMMARY:' + 'x'.repeat(200))
    expect(folded.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true)
    expect(folded.replace(/\r\n /g, '')).toBe('SUMMARY:' + 'x'.repeat(200))
  })

  it('escapes text and sanitizes file names', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne')
    expect(icsFileName('1st Sem AY 2026-2027')).toBe('1st-Sem-AY-2026-2027.ics')
    expect(icsFileName('')).toBe('schedule.ics')
  })
})
