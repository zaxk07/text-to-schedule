import { useRef } from 'react'
import { ArrowRight, CalendarSync, FileScan, ImageDown, ScanSearch, TriangleAlert, Upload, Wand2 } from 'lucide-react'
import PreviewTimetable from '../components/PreviewTimetable'
import { ACCEPT } from '../ingest'
import type { Route } from '../hooks/useRoute'

interface Props {
  navigate: (to: Route) => void
  onFile: (file: File) => void
  onTrySample: () => void
}

const FEATURES = [
  {
    icon: FileScan,
    title: 'Multi-Format OCR/PDF Extraction',
    body: 'Drop in a PDF, a screenshot, or pasted portal text. Everything is read in your browser, so nothing is uploaded.',
  },
  {
    icon: TriangleAlert,
    title: 'Conflict Detection',
    body: 'Overlapping classes are flagged on the timetable and listed by day and time before the semester starts.',
  },
  {
    icon: CalendarSync,
    title: 'Google & Samsung .ics Sync',
    body: 'Export one .ics file and import it into a separate semester calendar you can delete after finals.',
  },
  {
    icon: ImageDown,
    title: 'High-Res PNG Export',
    body: 'Save a crisp 2x image of your week for your lock screen, group chat, or printed planner.',
  },
]

export default function Home({ navigate, onFile, onTrySample }: Props) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <div>
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1fr_minmax(0,1.05fr)] lg:pb-24 lg:pt-24">
        <div className="rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold text-muted">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Free. No account. Runs in your browser.
          </p>
          <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            Your class schedule, <span className="text-accent">ready for the whole semester</span>.
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-muted text-pretty">
            Turn a registration PDF, a portal screenshot, or pasted text into a color-coded weekly timetable. Catch conflicts early, then sync it
            to Google or Samsung Calendar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="press inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              <Upload size={18} aria-hidden /> Upload PDF / Screenshot
            </button>
            <button
              type="button"
              onClick={onTrySample}
              className="press inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-5 py-3 text-[15px] font-semibold transition-colors hover:bg-page"
            >
              <Wand2 size={18} aria-hidden /> Try Sample Schedule
            </button>
            <input
              ref={input}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload a PDF or image of your schedule"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFile(file)
                e.target.value = ''
              }}
            />
          </div>
          <p className="mt-4 text-sm text-muted">PDF, PNG, JPG or WEBP. You can edit every course after it is read.</p>
        </div>

        <div className="rise relative" style={{ animationDelay: '90ms' }}>
          <div className="rounded-2xl border border-line bg-panel p-4 shadow-[0_24px_60px_-28px_rgba(16,26,44,0.35)] sm:p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-base font-bold">1st Sem AY 2026-2027</h2>
              <span className="text-xs text-muted">4 courses</span>
            </div>
            <PreviewTimetable />
          </div>
        </div>
      </section>

      <section aria-labelledby="features" className="border-t border-line bg-panel">
        <div className="mx-auto max-w-[1200px] px-4 py-16 lg:py-20">
          <h2 id="features" className="max-w-2xl font-display text-3xl font-bold tracking-tight text-balance">
            Everything between “here is my PDF” and “it’s in my calendar”
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="rise rounded-xl border border-line bg-page p-5" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
                  <f.icon size={20} aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold leading-snug">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <button type="button" onClick={() => navigate('planner')} className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline">
              <ScanSearch size={16} aria-hidden /> Open the planner <ArrowRight size={15} aria-hidden />
            </button>
            <button type="button" onClick={() => navigate('guide')} className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline">
              <CalendarSync size={16} aria-hidden /> How to import into your calendar <ArrowRight size={15} aria-hidden />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
