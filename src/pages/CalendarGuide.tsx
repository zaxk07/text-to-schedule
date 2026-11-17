import type { ReactNode } from 'react'
import { Archive, CalendarPlus, Download, Settings, Smartphone, Trash2, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Route } from '../hooks/useRoute'

interface Step {
  icon: LucideIcon
  title: string
  body: ReactNode
}

const GOOGLE: Step[] = [
  { icon: Download, title: 'Export your .ics file', body: <>In the Planner, press <b>Export .ics</b>. The file saves to your Downloads folder.</> },
  { icon: CalendarPlus, title: 'Create a new calendar', body: <>Open Google Calendar on a computer. Next to <b>Other calendars</b>, click <b>+</b> then <b>Create new calendar</b>. Name it “Sem 1 2026-27”.</> },
  { icon: Upload, title: 'Import into that calendar', body: <>Click the gear, then <b>Settings → Import &amp; export</b>. Choose the file, pick your new calendar under <b>Add to calendar</b>, and press <b>Import</b>.</> },
]

const SAMSUNG: Step[] = [
  { icon: Download, title: 'Get the file on your phone', body: <>Export the .ics on your phone, or send it to yourself by email or Drive and download it.</> },
  { icon: Smartphone, title: 'Open it with Samsung Calendar', body: <>Tap the downloaded .ics file and choose <b>Samsung Calendar</b>. If asked, pick <b>Import</b>.</> },
  { icon: Settings, title: 'Choose where it lands', body: <>Select a separate calendar (add one under <b>Manage calendars</b> first) so the semester stays apart from your personal events.</> },
]

const ARCHIVE: Step[] = [
  { icon: Archive, title: 'Hide it after finals', body: <>Untick the semester calendar in the sidebar (Google) or in <b>Manage calendars</b> (Samsung). Your events stay, just out of view.</> },
  { icon: Trash2, title: 'Delete it when you are done', body: <>Google: <b>Settings → your calendar → Delete</b>. Samsung: <b>Manage calendars → the calendar → Delete</b>. Every class disappears in one step, and your personal events are untouched.</> },
]

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-5 grid gap-3">
      {steps.map((s, i) => (
        <li key={s.title} className="rise flex gap-4 rounded-xl border border-line bg-panel p-4" style={{ animationDelay: `${i * 60}ms` }}>
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <s.icon size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold">
              <span className="mr-2 tabular-nums text-muted">{i + 1}.</span>
              {s.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function CalendarGuide({ navigate }: { navigate: (to: Route) => void }) {
  return (
    <div className="mx-auto max-w-[820px] px-4 py-12 sm:py-16">
      <h1 className="rise font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">Calendar Guide</h1>
      <p className="mt-4 max-w-[38rem] text-lg leading-relaxed text-muted">
        Import your schedule into its own semester calendar. When finals end, delete that one calendar and your personal events stay clean.
      </p>

      <section className="mt-12" aria-labelledby="g-google">
        <h2 id="g-google" className="font-display text-2xl font-bold">Google Calendar</h2>
        <Steps steps={GOOGLE} />
      </section>
      <section className="mt-12" aria-labelledby="g-samsung">
        <h2 id="g-samsung" className="font-display text-2xl font-bold">Samsung Calendar</h2>
        <Steps steps={SAMSUNG} />
      </section>
      <section className="mt-12" aria-labelledby="g-archive">
        <h2 id="g-archive" className="font-display text-2xl font-bold">After finals: archive or delete</h2>
        <Steps steps={ARCHIVE} />
      </section>

      <div className="mt-12 rounded-xl border border-line bg-panel p-5">
        <p className="font-semibold">Don’t have your .ics file yet?</p>
        <button
          type="button"
          onClick={() => navigate('planner')}
          className="press mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90"
        >
          Open the Planner
        </button>
      </div>
    </div>
  )
}
