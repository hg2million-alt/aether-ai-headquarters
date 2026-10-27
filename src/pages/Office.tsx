import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Badge, Card, Label, PageHeader, SimBanner } from '../components/ui'
import { mockSnapshot as snap } from '../data/mock'
import { formatDateTime } from '../lib/format'
import { isNight } from '../lib/office'
import type { AgentId, AgentStatus } from '../lib/types'
import { Fallback2D } from '../office/Fallback2D'
import { hasWebGL, prefersReducedMotion } from '../office/webgl'

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

const states: AgentStatus[] = ['working', 'idle', 'sleeping', 'completed', 'failed', 'unknown']
const initial = Object.fromEntries(snap.agents.map((a) => [a.id, a.status])) as Record<AgentId, AgentStatus>

export function Office() {
  const box = useRef<HTMLDivElement>(null)
  const [webgl] = useState(hasWebGL)
  const [reduced] = useState(prefersReducedMotion)
  const [visible, setVisible] = useState(true)
  const [tabOn, setTabOn] = useState(!document.hidden)
  const [statuses, setStatuses] = useState(initial)
  const [selected, setSelected] = useState<AgentId>('atlas')

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

  const night = useMemo(() => isNight(statuses), [statuses])
  const agent = snap.agents.find((a) => a.id === selected)!
  const last = snap.activity.filter((e) => e.agentId === selected).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  const set = (s: AgentStatus) => setStatuses((p) => ({ ...p, [selected]: s }))
  const all = (s: AgentStatus) => setStatuses(Object.fromEntries(snap.agents.map((a) => [a.id, s])) as Record<AgentId, AgentStatus>)

  return (
    <>
      <PageHeader title="Escritório" subtitle="Escritório aberto da Æther: uma mesa por função." />
      <SimBanner />
      <div ref={box} className="mx-5 aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-bg-2">
        {webgl ? (
          <Boundary>
            <Suspense fallback={<p className="p-6 text-center text-xs text-fg-3">Carregando cena…</p>}>
              <OfficeScene statuses={statuses} selected={selected} night={night} onSelect={setSelected} active={visible && tabOn} reducedMotion={reduced} />
            </Suspense>
          </Boundary>
        ) : (
          <Fallback2D reason="WebGL indisponível neste dispositivo." />
        )}
      </div>
      {night && <p className="mx-5 mt-3 text-center text-[11px] uppercase tracking-[0.12em] text-fg-2">Modo noturno · todos descansando</p>}

      <div className="mx-5 mt-4 grid grid-cols-5 gap-1.5" role="group" aria-label="Selecionar agente">
        {snap.agents.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a.id)}
            aria-pressed={selected === a.id}
            className={`min-h-12 rounded-xl border text-[9px] uppercase tracking-[0.04em] ${selected === a.id ? 'border-white bg-elevated text-white' : 'border-line text-fg-2'}`}
          >
            {a.name}
          </button>
        ))}
      </div>

      <Card className="mx-5 mt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-light uppercase tracking-[0.2em] text-white">{agent.name}</p>
            <p className="mt-1 text-xs text-fg-2">{agent.role}</p>
          </div>
          <Badge>{statuses[selected]}</Badge>
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-fg-3">Último evento (simulado)</p>
        <p className="mt-1 text-sm text-fg">{last ? last.activity : 'Sem eventos registrados.'}</p>
        {last && <p className="mt-1 text-xs tabular-nums text-fg-3">{formatDateTime(last.timestamp)}</p>}
      </Card>

      <div className="mx-5 mt-4">
        <Label>Simular estado de {agent.name}</Label>
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Estado simulado">
          {states.map((s) => (
            <button
              key={s}
              onClick={() => set(s)}
              aria-pressed={statuses[selected] === s}
              className={`min-h-12 rounded-xl border text-[10px] uppercase tracking-[0.08em] ${statuses[selected] === s ? 'border-white bg-elevated text-white' : 'border-line text-fg-2'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => all('sleeping')} className="min-h-12 rounded-xl border border-line text-[10px] uppercase tracking-[0.08em] text-fg-2">Todos descansam</button>
          <button onClick={() => setStatuses(initial)} className="min-h-12 rounded-xl border border-line text-[10px] uppercase tracking-[0.08em] text-fg-2">Restaurar</button>
        </div>
      </div>
    </>
  )
}
