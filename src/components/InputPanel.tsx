import { FlaskConical, Table2, Trash2, Wand2 } from 'lucide-react'
import type { IngestState } from '../hooks/useIngest'
import type { InputFormat, UnparsedLine } from '../types'
import IngestDropzone from './IngestDropzone'

interface Props {
  text: string
  onChange: (v: string) => void
  onLoadSample: () => void
  onLoadGridSample: () => void
  onLoadConflict: () => void
  onClear: () => void
  unparsed: UnparsedLine[]
  format: InputFormat | null
  ingest: IngestState
  onFile: (file: File) => void
  onDismissIngest: () => void
}

const btn =
  'inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-page transition-colors'

export default function InputPanel({
  text,
  onChange,
  onLoadSample,
  onLoadGridSample,
  onLoadConflict,
  onClear,
  unparsed,
  format,
  ingest,
  onFile,
  onDismissIngest,
}: Props) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <h2 className="font-display text-lg font-bold">Add your schedule</h2>
      <p className="mt-0.5 text-sm text-muted">Upload a PDF or screenshot, or paste the text from your student portal.</p>

      <IngestDropzone state={ingest} onFile={onFile} onDismiss={onDismissIngest} />

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <label htmlFor="raw" className="text-sm font-medium">
          Schedule text
        </label>
        {format && (
          <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
            {format === 'grid' ? 'Read as time grid' : 'Read as class list'}
          </span>
        )}
      </div>
      <textarea
        id="raw"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={8}
        wrap="off"
        placeholder={'CPE 401   Embedded Systems   M/W/F   08:00 AM - 09:30 AM   CICS-302   3.0'}
        className="mt-1 w-full resize-y rounded-lg border border-line bg-page p-3 font-mono text-[13px] leading-relaxed placeholder:text-muted/70"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onLoadSample} className={`${btn} !border-accent !bg-accent !text-accent-ink hover:opacity-90`}>
          <Wand2 size={15} /> Load Sample Schedule
        </button>
        <button type="button" onClick={onLoadGridSample} className={btn}>
          <Table2 size={15} /> Load Grid Timetable Sample
        </button>
        <button type="button" onClick={onLoadConflict} className={btn}>
          <FlaskConical size={15} /> Load Conflict Demo
        </button>
        <button type="button" onClick={onClear} disabled={!text} className={`${btn} disabled:opacity-40`}>
          <Trash2 size={15} /> Clear
        </button>
      </div>

      {unparsed.length > 0 && (
        <div className="mt-3 rounded-lg border border-line bg-page p-3 text-sm" aria-live="polite">
          <p className="font-medium text-muted">
            {unparsed.length === 1 ? '1 line was skipped' : `${unparsed.length} lines were skipped`}
          </p>
          <ul className="mt-1 space-y-1 text-muted">
            {unparsed.map((u, i) => (
              <li key={`${u.lineNumber}-${i}`}>
                <span className="tabular-nums">Line {u.lineNumber}:</span> {u.reason}
                <code className="mt-0.5 block truncate font-mono text-xs opacity-80">{u.text}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
