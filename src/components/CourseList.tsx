import { useState, type CSSProperties } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { DAYS } from '../constants'
import type { CourseBlock, Day } from '../types'
import { fromInputValue, toInputValue } from '../utils/timeUtils'

interface Props {
  courses: CourseBlock[]
  onUpdate: (id: string, patch: Partial<CourseBlock>) => void
  onDelete: (id: string) => void
}

const field = 'w-full rounded-md border border-line bg-page px-2 py-1 text-sm'

function EditRow({ course, onSave, onCancel }: { course: CourseBlock; onSave: (p: Partial<CourseBlock>) => void; onCancel: () => void }) {
  const [code, setCode] = useState(course.courseCode)
  const [title, setTitle] = useState(course.courseTitle)
  const [room, setRoom] = useState(course.room)
  const [days, setDays] = useState<Day[]>(course.days)
  const [start, setStart] = useState(toInputValue(course.startTimeMinutes))
  const [end, setEnd] = useState(toInputValue(course.endTimeMinutes))

  const s = fromInputValue(start)
  const e = fromInputValue(end)
  const valid = code.trim() !== '' && days.length > 0 && s !== null && e !== null && e > s

  return (
    <form
      className="space-y-2"
      onSubmit={(ev) => {
        ev.preventDefault()
        if (!valid) return
        onSave({
          courseCode: code.trim().toUpperCase(),
          courseTitle: title.trim() || code.trim().toUpperCase(),
          room: room.trim(),
          days: DAYS.filter((d) => days.includes(d)),
          startTimeMinutes: s!,
          endTimeMinutes: e!,
        })
      }}
    >
      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <input aria-label="Course code" className={field} value={code} onChange={(x) => setCode(x.target.value)} />
        <input aria-label="Course title" className={field} value={title} onChange={(x) => setTitle(x.target.value)} />
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Days">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days.includes(d)}
            onClick={() => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
            className="rounded-md border border-line px-2 py-0.5 text-xs font-medium aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-ink"
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input aria-label="Start time" type="time" className={field} value={start} onChange={(x) => setStart(x.target.value)} />
        <input aria-label="End time" type="time" className={field} value={end} onChange={(x) => setEnd(x.target.value)} />
        <input aria-label="Room" className={field} value={room} placeholder="Room" onChange={(x) => setRoom(x.target.value)} />
      </div>
      {!valid && <p className="text-xs text-alert">Pick at least one day, and make the end time later than the start time.</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={!valid} className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-ink disabled:opacity-40">
          <Check size={14} /> Save
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-sm">
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  )
}

export default function CourseList({ courses, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <h2 className="font-display text-lg font-bold">Parsed courses</h2>
      {courses.length === 0 ? (
        <p className="mt-1 text-sm text-muted">Nothing yet. Paste a schedule above or load the sample to see it here.</p>
      ) : (
        <>
          <p className="mt-0.5 text-sm text-muted">Edits change the timetable. Typing in the box above reads the text again.</p>
          <ul className="mt-3 space-y-2">
            {courses.map((c) => (
              <li key={c.id} className="rounded-lg border border-line p-2.5" style={{ '--h': c.color.hue } as CSSProperties}>
                {editing === c.id ? (
                  <EditRow
                    course={c}
                    onCancel={() => setEditing(null)}
                    onSave={(patch) => {
                      onUpdate(c.id, patch)
                      setEditing(null)
                    }}
                  />
                ) : (
                  <div className="flex items-start gap-2.5">
                    <span className="course-chip mt-1 h-8 w-1 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate">
                        <strong className="font-display">{c.courseCode}</strong> {c.courseTitle !== c.courseCode && c.courseTitle}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {c.days.join(' ')} · {c.formattedTime}
                        {c.room ? ` · ${c.room}` : ''}
                      </p>
                    </div>
                    <button type="button" aria-label={`Edit ${c.courseCode}`} onClick={() => setEditing(c.id)} className="rounded-md p-1.5 text-muted hover:bg-page hover:text-ink">
                      <Pencil size={15} />
                    </button>
                    <button type="button" aria-label={`Delete ${c.courseCode}`} onClick={() => onDelete(c.id)} className="rounded-md p-1.5 text-muted hover:bg-alert-soft hover:text-alert">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
