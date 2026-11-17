import type { CSSProperties } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
// [day index, start hour, length in hours, code, room, hue]
const BLOCKS: [number, number, number, string, string, number][] = [
  [0, 8, 1.5, 'CPE 401', 'CICS-302', 232],
  [2, 8, 1.5, 'CPE 401', 'CICS-302', 232],
  [4, 8, 1.5, 'CPE 401', 'CICS-302', 232],
  [1, 10, 1.5, 'CPE 403', 'Lab 2', 172],
  [3, 10, 1.5, 'CPE 403', 'Lab 2', 172],
  [0, 13, 1, 'MATH 204', 'Rm 205', 28],
  [2, 13, 1, 'MATH 204', 'Rm 205', 28],
  [4, 13, 1, 'MATH 204', 'Rm 205', 28],
  [1, 14, 1.5, 'CS 312', 'Lab 1', 292],
  [3, 14, 1.5, 'CS 312', 'Lab 1', 292],
]
const START = 7
const HOURS = 9
const ROW = 34

function hourLabel(h: number) {
  return `${((h + 11) % 12) + 1}${h >= 12 ? 'p' : 'a'}`
}

/** Static, decorative miniature of the planner's weekly timetable. */
export default function PreviewTimetable() {
  return (
    <div aria-hidden className="select-none">
      <div className="grid grid-cols-[34px_repeat(5,1fr)] border-b border-line pb-1.5 text-[11px] font-semibold text-muted">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="text-center">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-[34px_repeat(5,1fr)]" style={{ height: HOURS * ROW }}>
        <div className="relative">
          {Array.from({ length: HOURS }, (_, i) => (
            <span key={i} className="absolute right-1.5 text-[10px] tabular-nums text-muted" style={{ top: i * ROW - 6 }}>
              {i === 0 ? '' : hourLabel(START + i)}
            </span>
          ))}
        </div>
        {DAYS.map((_, di) => (
          <div
            key={di}
            className="relative border-l border-line"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ROW - 1}px, var(--grid-line) ${ROW - 1}px, var(--grid-line) ${ROW}px)`,
            }}
          >
            {BLOCKS.filter((b) => b[0] === di).map((b, i) => (
              <div
                key={i}
                className="course-card preview-block absolute inset-x-[2px] overflow-hidden rounded-md px-1.5 py-1 text-[10px] leading-tight"
                style={
                  {
                    top: (b[1] - START) * ROW + 1,
                    height: b[2] * ROW - 2,
                    '--h': b[5],
                    '--i': di + i,
                  } as CSSProperties
                }
              >
                <p className="truncate font-display text-[11px] font-bold">{b[3]}</p>
                <p className="truncate opacity-80">{b[4]}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
