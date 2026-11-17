import { useCallback, useMemo, useState } from 'react'
import { SAMPLES } from '../samples'
import type { CourseBlock, InputFormat, UnparsedLine } from '../types'
import { colorForCourse } from '../utils/colors'
import { detectConflicts } from '../utils/conflictDetector'
import { parseAny } from '../utils/parseInput'
import { formatRange } from '../utils/timeUtils'

export function useSchedule() {
  const [text, setTextState] = useState('')
  const [courses, setCourses] = useState<CourseBlock[]>([])
  const [unparsed, setUnparsed] = useState<UnparsedLine[]>([])
  const [format, setFormat] = useState<InputFormat | null>(null)

  const setText = useCallback((value: string) => {
    setTextState(value)
    const result = parseAny(value)
    setCourses(result.courses)
    setUnparsed(result.unparsed)
    setFormat(value.trim() ? result.format : null)
  }, [])

  const conflicts = useMemo(() => detectConflicts(courses), [courses])

  const updateCourse = useCallback((id: string, patch: Partial<CourseBlock>) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const next = { ...c, ...patch }
        next.formattedTime = formatRange(next.startTimeMinutes, next.endTimeMinutes)
        next.color = colorForCourse(next.courseCode)
        return next
      }),
    )
  }, [])

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return {
    text,
    setText,
    courses,
    unparsed,
    format,
    conflicts,
    updateCourse,
    deleteCourse,
    loadSample: () => setText(SAMPLES.list.text),
    loadGridSample: () => setText(SAMPLES.grid.text),
    loadConflictDemo: () => setText(SAMPLES.conflict.text),
    clear: () => setText(''),
  }
}
