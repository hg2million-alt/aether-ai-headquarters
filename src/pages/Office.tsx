import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Card, Label, PageHeader, SimBanner } from '../components/ui'
import { useSnapshot } from '../data/source'
import { formatDateTime } from '../lib/format'
import { isNight } from '../lib/office'
import type { AgentId, AgentStatus } from '../lib/types'
import { PixelOffice } from '../office2d/PixelOffice'
import { SCENE_W } from '../office2d/room'

/** Cena piloto: apenas duas estações. As demais entram após validar a qualidade da arte. */
const PILOT: AgentId[] = ['scout', 'atlas']
const states: AgentStatus[] = ['working', 'idle', 'sleeping', 'completed', 'failed', 'unknown']
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Office() {
  const snap = useSnapshot()
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(2)
  const [visible, setVisible] = useState(true)
  const [tabOn, setTabOn] = useState(!document.hidden)
  const [reduced] = useState(reducedMotion)
  const pilot = useMemo(() => snap.agents.filter((a) => PILOT.includes(a.id)), [snap])
  const initial = useMemo(() => Object.fromEntries(pilot.map((a) => [a.id, a.status])) as Partial<Record<AgentId, AgentStatus>>, [pilot])
  const [statuses, setStatuses] = useState(initial)
  const [selected, setSelected] = useState<AgentId>('atlas')

  useEffect(() => {
    const el = box.current
    if (!el) return
    // escala inteira em telas comuns; fracionária só em telas densas (pixels de 3+ px físicos não distorcem)
    const fit = () => {
      const s = el.clientWidth / SCENE_W
      setScale(Math.max(1, Math.min(4, window.devicePixelRatio >= 2 ? s : Math.floor(s))))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    const vis = () => setTabOn(!document.hidden)
    document.addEventListener('visibilitychange', vis)
    return () => {
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  const night = isNight(statuses)
  const agent = pilot.find((a) => a.id === selected)!
  const last = snap.activity.filter((e) => e.agentId === selected).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  const status = statuses[selected] ?? 'unknown'
  const all = (s: AgentStatus) => setStatuses(Object.fromEntries(PILOT.map((id) => [id, s])) as Partial<Record<AgentId, AgentStatus>>)

  return (
    <>
      <PageHeader title="Escritório" subtitle="Cena piloto em pixel art isométrica." />
      <SimBanner />
      <div ref={box} className="flex justify-center overflow-hidden border-y border-line bg-bg-2">
        <PixelOffice states={statuses} night={night} selected={selected} onSelect={setSelected} active={visible && tabOn} reducedMotion={reduced} scale={scale} />
      </div>
      {night && <p className="mx-5 mt-3 text-center text-[11px] uppercase tracking-[0.12em] text-fg-2">Modo noturno · todos descansando</p>}
      <p className="mx-5 mt-3 text-center text-xs text-fg-3">Piloto: 2 de 5 agentes. Os demais entram após validar a arte.</p>

      <div className="mx-5 mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Selecionar agente">
        {pilot.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a.id)}
            aria-pressed={selected === a.id}
            className={`min-h-12 rounded-xl border text-[10px] uppercase tracking-[0.08em] ${selected === a.id ? 'border-white bg-elevated text-white' : 'border-line text-fg-2'}`}
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
          <Badge>{status}</Badge>
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
              onClick={() => setStatuses((p) => ({ ...p, [selected]: s }))}
              aria-pressed={status === s}
              className={`min-h-12 rounded-xl border text-[10px] uppercase tracking-[0.08em] ${status === s ? 'border-white bg-elevated text-white' : 'border-line text-fg-2'}`}
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
