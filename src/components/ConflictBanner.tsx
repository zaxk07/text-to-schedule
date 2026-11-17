import { TriangleAlert } from 'lucide-react'
import type { ScheduleConflict } from '../types'
import { formatRange } from '../utils/timeUtils'

export default function ConflictBanner({ conflicts }: { conflicts: ScheduleConflict[] }) {
  if (conflicts.length === 0) return null

  return (
    <div role="alert" className="reveal rounded-xl border border-alert bg-alert-soft p-4">
      <h3 className="flex items-center gap-2 font-semibold text-alert">
        <TriangleAlert size={18} />
        {conflicts.length === 1 ? '1 time conflict' : `${conflicts.length} time conflicts`}
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {conflicts.map((c) => (
          <li key={`${c.a.id}-${c.b.id}-${c.day}`}>
            <strong>{c.a.courseCode}</strong> and <strong>{c.b.courseCode}</strong> overlap on {c.day},{' '}
            <span className="tabular-nums">{formatRange(c.overlapStart, c.overlapEnd)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
