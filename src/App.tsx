import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import Navbar from './components/Navbar'
import { useIngest } from './hooks/useIngest'
import { useRoute } from './hooks/useRoute'
import { useSchedule } from './hooks/useSchedule'
import { useTheme } from './hooks/useTheme'
import CalendarGuide from './pages/CalendarGuide'
import Home from './pages/Home'
import Planner from './pages/Planner'

export default function App() {
  const s = useSchedule()
  const { dark, toggle } = useTheme()
  const ingest = useIngest(s.setText)
  const { route, navigate, href } = useRoute()
  const [title, setTitle] = useState('1st Sem AY 2026-2027')
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [exportError, setExportError] = useState('')
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exported) return
    const t = setTimeout(() => setExported(false), 1800)
    return () => clearTimeout(t)
  }, [exported])

  async function download() {
    const node = tableRef.current
    if (!node) return
    setExporting(true)
    setExported(false)
    setExportError('')
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--panel').trim() || '#ffffff'
      const url = await toPng(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true })
      const a = document.createElement('a')
      a.download = `${(title || 'schedule').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'schedule'}.png`
      a.href = url
      a.click()
      setExported(true)
    } catch {
      setExportError('Could not create the image. Try again, or take a screenshot instead.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar route={route} href={href} dark={dark} onToggleTheme={toggle} />
      <div key={route} className="page-enter">
        {route === 'home' && (
          <Home
            navigate={navigate}
            onTrySample={() => {
              s.loadSample()
              navigate('planner')
            }}
            onFile={(file) => {
              navigate('planner')
              void ingest.ingest(file)
            }}
          />
        )}
        {route === 'planner' && (
          <Planner
            s={s}
            ingest={ingest}
            title={title}
            onTitle={setTitle}
            onDownload={download}
            exporting={exporting}
            exported={exported}
            exportError={exportError}
            tableRef={tableRef}
          />
        )}
        {route === 'guide' && <CalendarGuide navigate={navigate} />}
      </div>
    </div>
  )
}
