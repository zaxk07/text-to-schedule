import { useCallback, useEffect, useState } from 'react'

export type Route = 'home' | 'planner' | 'guide'

const PATHS: Record<Route, string> = { home: '#/', planner: '#/planner', guide: '#/guide' }

function read(): Route {
  const h = window.location.hash.replace(/^#\/?/, '').split(/[?#]/)[0]
  return h === 'planner' || h === 'guide' ? h : 'home'
}

/** Hash routing: every URL is `/` plus a fragment, so a refresh on Vercel can never 404. */
export function useRoute() {
  const [route, setRoute] = useState<Route>(read)

  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((to: Route) => {
    if (window.location.hash !== PATHS[to]) window.location.hash = PATHS[to]
  }, [])

  const href = useCallback((r: Route) => PATHS[r], [])

  return { route, navigate, href }
}
