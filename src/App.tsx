import { useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { Wordmark } from './components/Wordmark'
import { currentRoute, type RouteId } from './lib/nav'
import { Agents, Dashboard, History, Office, Settings } from './pages/Pages'

const views: Record<RouteId, () => React.JSX.Element> = {
  dashboard: Dashboard,
  office: Office,
  agents: Agents,
  history: History,
  settings: Settings,
}

export default function App() {
  const [route, setRoute] = useState<RouteId>(currentRoute)
  useEffect(() => {
    const on = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const View = views[route]

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <BottomNav active={route} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-line px-5 pb-3 text-center text-xs" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
          <Wordmark />
        </div>
        <main className="mx-auto w-full max-w-3xl flex-1 pb-28 md:pb-10">
          <View />
        </main>
      </div>
    </div>
  )
}
