import { CalendarDays, Moon, Rocket, Sun } from 'lucide-react'
import type { Route } from '../hooks/useRoute'

interface Props {
  route: Route
  href: (r: Route) => string
  dark: boolean
  onToggleTheme: () => void
}

const LINKS: { route: Route; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'planner', label: 'Planner' },
  { route: 'guide', label: 'Calendar Guide' },
]

export default function Navbar({ route, href, dark, onToggleTheme }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-panel/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:gap-6">
        <a href={href('home')} className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink" aria-hidden>
            <CalendarDays size={17} strokeWidth={2.4} />
          </span>
          <span className="hidden min-[420px]:inline">Text-to-Schedule</span>
        </a>

        <ul className="ml-1 flex flex-1 items-center gap-0.5 sm:gap-1">
          {LINKS.map((l) => (
            <li key={l.route}>
              <a
                href={href(l.route)}
                aria-current={route === l.route ? 'page' : undefined}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:text-ink sm:px-3 ${
                  route === l.route ? 'bg-page text-ink' : 'text-muted'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="press rounded-lg border border-line p-2 transition-colors hover:bg-page"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <a
          href={href('planner')}
          className="press inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
        >
          <Rocket size={15} aria-hidden />
          <span className="hidden sm:inline">Launch Planner</span>
          <span className="sm:hidden">Launch</span>
        </a>
      </nav>
    </header>
  )
}
