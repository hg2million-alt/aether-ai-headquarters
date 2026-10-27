import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Label, PageHeader, SimBanner } from '../components/ui'
import { Fallback2D } from '../office/Fallback2D'
import { hasWebGL, prefersReducedMotion } from '../office/webgl'
import type { AgentStatus } from '../lib/types'

const OfficeScene = lazy(() => import('../office/OfficeScene'))

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <Fallback2D reason="Não foi possível iniciar a cena 3D." /> : this.props.children
  }
}

const previews: AgentStatus[] = ['working', 'idle', 'sleeping', 'unknown']

export function Office() {
  const box = useRef<HTMLDivElement>(null)
  const [webgl] = useState(hasWebGL)
  const [reduced] = useState(prefersReducedMotion)
  const [visible, setVisible] = useState(true)
  const [tabOn, setTabOn] = useState(!document.hidden)
  const [status, setStatus] = useState<AgentStatus>('working')

  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    const vis = () => setTabOn(!document.hidden)
    document.addEventListener('visibilitychange', vis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  return (
    <>
      <PageHeader title="Escritório" subtitle="Escritório virtual isométrico." />
      <SimBanner />
      <div ref={box} className="mx-5 aspect-square max-h-[28rem] overflow-hidden rounded-2xl border border-line bg-bg-2">
        {webgl ? (
          <Boundary>
            <Suspense fallback={<p className="p-6 text-center text-xs text-fg-3">Carregando cena…</p>}>
              <OfficeScene status={status} active={visible && tabOn} reducedMotion={reduced} />
            </Suspense>
          </Boundary>
        ) : (
          <Fallback2D reason="WebGL indisponível neste dispositivo." />
        )}
      </div>
      <div className="mx-5 mt-4">
        <Label>Pré-visualização de animação · ATLAS (simulada)</Label>
        <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Estado de pré-visualização">
          {previews.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`min-h-12 rounded-xl border text-[10px] uppercase tracking-[0.08em] ${
                status === s ? 'border-white bg-elevated text-white' : 'border-line text-fg-2'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
