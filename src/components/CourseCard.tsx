import type { CSSProperties } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { CourseBlock } from '../types'

interface Props {
  block: CourseBlock
  conflict: boolean
  style: CSSProperties
  /** true when the card shares its day column with another card */
  narrow: boolean
}

export default function CourseCard({ block, conflict, style, narrow }: Props) {
  const minutes = block.endTimeMinutes - block.startTimeMinutes
  const compact = minutes <= 60

  return (
    <div
      className={`course-card absolute overflow-hidden rounded-md py-1 leading-tight ${narrow ? 'px-1 text-[10px]' : 'px-2 text-xs'}`}
      data-conflict={conflict}
      title={`${block.courseCode} ${block.courseTitle}\n${block.formattedTime}${block.room ? `\n${block.room}` : ''}`}
      style={{ ...style, '--h': block.color.hue } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={`min-w-0 whitespace-nowrap font-display font-bold ${narrow ? 'text-[11px]' : 'text-[13px]'}`}>{block.courseCode}</p>
        {conflict && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded bg-alert px-1 py-0.5 text-[10px] font-semibold text-white ${narrow ? 'absolute bottom-1 right-1' : ''}`}
            title="Time conflict"
            aria-label="Time conflict"
          >
            <TriangleAlert size={10} strokeWidth={3} />
            {!narrow && 'Conflict'}
          </span>
        )}
      </div>
      {block.courseTitle !== block.courseCode && <p className={compact ? 'truncate' : 'line-clamp-2'}>{block.courseTitle}</p>}
      <p className="mt-0.5 tabular-nums opacity-80">{block.formattedTime}</p>
      {block.room && !compact && !narrow && <p className="opacity-80">{block.room}</p>}
      {block.room && compact && !narrow && minutes > 45 && <p className="truncate opacity-80">{block.room}</p>}
    </div>
  )
}
