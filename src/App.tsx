import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import ConflictBanner from './components/ConflictBanner'
import CourseList from './components/CourseList'
import InputPanel from './components/InputPanel'
import Timetable from './components/Timetable'
import Toolbar from './components/Toolbar'
import { useIngest } from './hooks/useIngest'
import { useSchedule } from './hooks/useSchedule'
import { useTheme } from './hooks/useTheme'
import { downloadIcs } from './utils/icsExporter'

export default function App() {
  const s = useSchedule()
  const { dark, toggle } = useTheme()
  const ingest = useIngest(s.setText)
  const [title, setTitle] = useState('1st Sem AY 2026-2027')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const tableRef = useRef<HTMLDivElement>(null)

  async function download() {
    const node = tableRef.current
    if (!node) return
    setExporting(true)
    setExportError('')
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--panel').trim() || '#ffffff'
      const url = await toPng(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true })
      const a = document.createElement('a')
      a.download = `${(title || 'schedule').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'schedule'}.png`
      a.href = url
      a.click()
    } catch {
      setExportError('Could not create the image. Try again, or take a screenshot instead.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Toolbar title={title} onTitle={setTitle} dark={dark} onToggleTheme={toggle} onDownload={download}
        exporting={exporting}
        onExportIcs={() => downloadIcs(s.courses, title)}
        hasCourses={s.courses.length > 0}
      />
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
    </div>
  )
}
