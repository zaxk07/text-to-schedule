import { CalendarPlus, Check, Download, Loader2 } from 'lucide-react'

interface Props {
  title: string
  onTitle: (v: string) => void
  onDownload: () => void
  exporting: boolean
  exported: boolean
  onExportIcs: () => void
  hasCourses: boolean
}

export default function Toolbar({ title, onTitle, onDownload, exporting, exported, onExportIcs, hasCourses }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-panel p-3">
      <label className="flex min-w-0 flex-1 basis-56 items-center gap-2 text-sm font-medium">
        <span className="shrink-0 text-muted">Title</span>
        <input
          aria-label="Timetable title"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="1st Sem AY 2026-2027"
          className="min-w-0 flex-1 rounded-lg border border-line bg-page px-3 py-1.5 text-sm font-normal"
        />
      </label>
      <button
        type="button"
        onClick={onExportIcs}
        disabled={!hasCourses}
        className="press inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarPlus size={16} />
        Export .ics
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={exporting}
        className="press inline-flex min-w-[9.5rem] items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        {exporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : exported ? (
          <Check key="ok" size={16} className="pop" />
        ) : (
          <Download size={16} />
        )}
        {exporting ? 'Rendering…' : exported ? 'Saved' : 'Download PNG'}
      </button>
    </div>
  )
}
