import { forwardRef, useMemo, type CSSProperties } from 'react'
import { ALL_DAYS, DAYS, DAY_LABELS, GRID_END, GRID_START, SLOT_HEIGHT, SLOT_MINUTES } from '../constants'
import type { CourseBlock, Day, ScheduleConflict } from '../types'
import { conflictedKeys } from '../utils/conflictDetector'
import { formatMinutes } from '../utils/timeUtils'
import CourseCard from './CourseCard'

interface Props {
  title: string
  courses: CourseBlock[]
  conflicts: ScheduleConflict[]
}

interface Placed {
  block: CourseBlock
  col: number
  cols: number
}

/** Lay out one day's blocks so overlapping ones sit side by side instead of hiding each other. */
function layoutDay(blocks: CourseBlock[]): Placed[] {
  const sorted = [...blocks].sort((a, b) => a.startTimeMinutes - b.startTimeMinutes || a.endTimeMinutes - b.endTimeMinutes)
  const placed: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1

  const flush = () => {
    const cols = Math.max(1, ...cluster.map((p) => p.col + 1))
    cluster.forEach((p) => (p.cols = cols))
    placed.push(...cluster)
    cluster = []
  }

  for (const block of sorted) {
    if (cluster.length && block.startTimeMinutes >= clusterEnd) flush()
    const used = new Set(cluster.filter((p) => p.block.endTimeMinutes > block.startTimeMinutes).map((p) => p.col))
    let col = 0
    while (used.has(col)) col++
    cluster.push({ block, col, cols: 1 })
    clusterEnd = Math.max(clusterEnd, block.endTimeMinutes)
  }
  flush()
  return placed
}

const slots = (GRID_END - GRID_START) / SLOT_MINUTES
const hourLabels = Array.from({ length: (GRID_END - GRID_START) / 60 + 1 }, (_, i) => GRID_START + i * 60)

const Timetable = forwardRef<HTMLDivElement, Props>(function Timetable({ title, courses, conflicts }, ref) {
  const flagged = useMemo(() => conflictedKeys(conflicts), [conflicts])
  const perDay = useMemo(() => {
    const map = {} as Record<Day, Placed[]>
    for (const day of ALL_DAYS) map[day] = layoutDay(courses.filter((c) => c.days.includes(day)))
    return map
  }, [courses])

  const bodyHeight = slots * SLOT_HEIGHT
  // Sunday gets a column only when a class actually meets on it.
  const days = useMemo(() => (courses.some((c) => c.days.includes('Sun')) ? ALL_DAYS : DAYS), [courses])
  const columns = { gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }

  return (
    <div ref={ref} className="min-w-[880px] bg-panel p-5" style={{ '--slot': `${SLOT_HEIGHT}px` } as CSSProperties}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight">{title || 'My class schedule'}</h2>
        <span className="text-sm text-muted">
          {courses.length} {courses.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      <div className="grid border-b border-line pb-2 text-sm font-semibold" style={columns}>
        <div />
        {days.map((d) => (
          <div key={d} className="px-2 text-center">
            <span className="hidden xl:inline">{DAY_LABELS[d]}</span>
            <span className="xl:hidden">{d}</span>
          </div>
        ))}
      </div>

      <div className="grid" style={{ ...columns, height: bodyHeight }}>
        <div className="relative">
          {hourLabels.map((m) => (
            <span
              key={m}
              className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted"
              style={{ top: ((m - GRID_START) / SLOT_MINUTES) * SLOT_HEIGHT }}
            >
              {m === GRID_START ? '' : formatMinutes(m).replace(':00', '')}
            </span>
          ))}
        </div>

        {days.map((day) => (
          <div key={day} className="timetable-body relative border-l border-line" data-day={day}>
            {perDay[day].map(({ block, col, cols }) => {
              const start = Math.max(block.startTimeMinutes, GRID_START)
              const end = Math.min(block.endTimeMinutes, GRID_END)
              if (end <= start) return null
              return (
                <CourseCard
                  key={`${block.id}-${day}`}
                  block={block}
                  narrow={cols > 1}
                  conflict={flagged.has(`${block.id}:${day}`)}
                  style={{
                    top: ((start - GRID_START) / SLOT_MINUTES) * SLOT_HEIGHT + 1,
                    height: ((end - start) / SLOT_MINUTES) * SLOT_HEIGHT - 2,
                    left: `calc(${(col / cols) * 100}% + 2px)`,
                    width: `calc(${100 / cols}% - 4px)`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
})

export default Timetable
