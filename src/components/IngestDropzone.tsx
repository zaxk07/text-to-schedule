import { useRef, useState } from 'react'
import { FileUp, Loader2, X } from 'lucide-react'
import type { IngestState } from '../hooks/useIngest'
import { ACCEPT } from '../ingest'

interface Props {
  state: IngestState
  onFile: (file: File) => void
  onDismiss: () => void
}

export default function IngestDropzone({ state, onFile, onDismiss }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const loading = state.status === 'loading'
  const pct = Math.round(state.progress * 100)

  return (
    <div className="mt-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const file = e.dataTransfer.files[0]
          if (file) onFile(file)
        }}
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border-2 border-dashed px-3 py-3 text-sm transition-colors ${
          over ? 'border-accent bg-page' : 'border-line'
        }`}
      >
        <FileUp size={20} className="shrink-0 text-muted" aria-hidden />
        <p className="min-w-0 flex-1 basis-40 text-muted">
          Drop a PDF or screenshot here, or paste one with <kbd className="rounded border border-line px-1 font-mono text-xs">Ctrl+V</kbd>
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => input.current?.click()}
          className="rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-page disabled:opacity-50"
        >
          Choose file
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label="Upload a PDF or image of your schedule"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {loading && (
        <div className="mt-2" aria-live="polite">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 size={14} className="animate-spin text-accent" aria-hidden />
            <span className="min-w-0 flex-1 truncate">
              {state.stage} <span className="text-muted">· {state.fileName}</span>
            </span>
            <span className="tabular-nums text-muted">{pct}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={state.stage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-alert">
          <span className="min-w-0 flex-1">
            {state.fileName ? `${state.fileName}: ` : ''}
            {state.message}
          </span>
          <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="rounded p-0.5 hover:bg-alert-soft">
            <X size={14} />
          </button>
        </p>
      )}
    </div>
  )
}
