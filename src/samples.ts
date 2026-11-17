export interface SamplePreset {
  id: 'list' | 'grid' | 'conflict'
  label: string
  text: string
}

const list = `Course Code   Description   Days   Time   Room   Units
CPE 401   Embedded Systems   M/W/F   08:00 AM - 09:30 AM   CICS-302   3.0
CPE 403   Computer Networks & Security   T/TH   10:00 AM - 11:30 AM   CICS-Lab 2   3.0
CPE 405   Microprocessors   S   01:00 PM - 04:00 PM   CEAFA-401   3.0
MATH 204 | Differential Equations | MWF | 13:00-14:00 | Room 205
CS 312 - Machine Learning - TTH - 7:30am to 9:00am - Lab 1`

const conflict = `CPE 401   Embedded Systems   M/W/F   08:00 AM - 09:30 AM   CICS-302   3.0
CPE 403   Computer Networks & Security   T/TH   10:00 AM - 11:30 AM   CICS-Lab 2   3.0
MATH 204 | Differential Equations | MWF | 09:00-10:30 | Room 205
CS 312 - Machine Learning - TTH - 10:30am to 12:00pm - Lab 1
CPE 405   Microprocessors   S   01:00 PM - 04:00 PM   CEAFA-401   3.0`

/** Time-grid sample: cells are tab-separated; "-do-" continues the class above. */
function gridRows(rows: [string, ...string[]][]): string {
  return rows.map((r) => r.join('\t')).join('\n')
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const e = ''
const D = '-do-'

const grid = gridRows([
  ['Time', ...days.flatMap((d) => [d, e])],
  [e, ...days.flatMap(() => ['Subj', 'Room'])],
  ['07:00 AM-07:30 AM', 'CpE 426', 'COMPLAB3', e, e, 'CpE 426', 'COMPLAB3', e, e, e, e, e, e, e, e],
  ['07:30 AM-08:00 AM', D, D, e, e, D, D, e, e, e, e, e, e, e, e],
  ['08:00 AM-08:30 AM', D, D, e, e, D, D, e, e, e, e, e, e, e, e],
  ['08:30 AM-09:00 AM', D, D, e, e, D, D, e, e, e, e, e, e, e, e],
  ['09:00 AM-09:30 AM', D, D, e, e, D, D, e, e, e, e, e, e, e, e],
  ['09:30 AM-10:00 AM', D, D, e, e, D, D, e, e, e, e, e, e, e, e],
  ['10:00 AM-10:30 AM', e, e, 'CpE 431', 'CICS-302', e, e, 'CpE 431', 'CICS-302', e, e, e, e, e, e],
  ['10:30 AM-11:00 AM', e, e, D, D, e, e, D, D, e, e, e, e, e, e],
  ['11:00 AM-11:30 AM', e, e, D, D, e, e, D, D, e, e, e, e, e, e],
  ['11:30 AM-12:00 PM', e, e, D, D, e, e, D, D, e, e, e, e, e, e],
  ['01:00 PM-01:30 PM', e, e, e, e, e, e, e, e, e, e, 'NSTP 102', 'FIELD', e, e],
  ['01:30 PM-02:00 PM', e, e, e, e, e, e, e, e, e, e, D, D, e, e],
  ['02:00 PM-02:30 PM', e, e, e, e, e, e, e, e, e, e, D, D, e, e],
  ['02:30 PM-03:00 PM', e, e, e, e, e, e, e, e, e, e, D, D, e, e],
])

export const SAMPLES: Record<SamplePreset['id'], SamplePreset> = {
  list: { id: 'list', label: 'Load Sample Schedule', text: list },
  grid: { id: 'grid', label: 'Load Grid Timetable Sample', text: grid },
  conflict: { id: 'conflict', label: 'Load Conflict Demo', text: conflict },
}
