import { CalendarPlus, Download, Loader2, Moon, Sun } from 'lucide-react'

interface Props {
  title: string
  onTitle: (v: string) => void
  dark: boolean
  onToggleTheme: () => void
  onDownload: () => void
  exporting: boolean
  onExportIcs: () => void
  hasCourses: boolean
}

export default function Toolbar({ title, onTitle, dark, onToggleTheme, onDownload, exporting, onExportIcs, hasCourses }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-panel/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <h1 className="font-display text-xl font-extrabold tracking-tight">Text to Schedule</h1>
        <input
          aria-label="Timetable title"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="1st Sem AY 2026-2027"
          className="min-w-0 flex-1 basis-56 rounded-lg border border-line bg-page px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-lg border border-line p-2 hover:bg-page"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          type="button"
          onClick={onExportIcs}
          disabled={!hasCourses}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarPlus size={16} />
          Export .ics
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink hover:opacity-90 disabled:opacity-60"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Download PNG
        </button>
      </div>
    </header>
  )
}
