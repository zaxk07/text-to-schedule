import type { RefObject } from 'react'
import ConflictBanner from '../components/ConflictBanner'
import CourseList from '../components/CourseList'
import InputPanel from '../components/InputPanel'
import Timetable from '../components/Timetable'
import Toolbar from '../components/Toolbar'
import type { useIngest } from '../hooks/useIngest'
import type { useSchedule } from '../hooks/useSchedule'
import { downloadIcs } from '../utils/icsExporter'

interface Props {
  s: ReturnType<typeof useSchedule>
  ingest: ReturnType<typeof useIngest>
  title: string
  onTitle: (v: string) => void
  onDownload: () => void
  exporting: boolean
  exported: boolean
  exportError: string
  tableRef: RefObject<HTMLDivElement | null>
}

export default function Planner({ s, ingest, title, onTitle, onDownload, exporting, exported, exportError, tableRef }: Props) {
  return (
    <main className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <InputPanel
          text={s.text}
          onChange={s.setText}
          onLoadSample={s.loadSample}
          onLoadGridSample={s.loadGridSample}
          onLoadConflict={s.loadConflictDemo}
          onClear={s.clear}
          unparsed={s.unparsed}
          format={s.format}
          ingest={ingest.state}
          onFile={ingest.ingest}
          onDismissIngest={ingest.dismiss}
        />
        <CourseList courses={s.courses} onUpdate={s.updateCourse} onDelete={s.deleteCourse} />
      </div>
      <div className="min-w-0 space-y-4">
        <Toolbar
          title={title}
          onTitle={onTitle}
          onDownload={onDownload}
          exporting={exporting}
          exported={exported}
          onExportIcs={() => downloadIcs(s.courses, title)}
          hasCourses={s.courses.length > 0}
        />
        <ConflictBanner conflicts={s.conflicts} />
        {exportError && (
          <p role="alert" className="text-sm text-alert">
            {exportError}
          </p>
        )}
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
          <Timetable ref={tableRef} title={title} courses={s.courses} conflicts={s.conflicts} />
        </div>
      </div>
    </main>
  )
}
