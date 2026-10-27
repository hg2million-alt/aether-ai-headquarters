import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Card, Label, PageHeader, SimBanner } from '../components/ui'
import { useSnapshot } from '../data/source'
import { formatDateTime } from '../lib/format'
import { isNight } from '../lib/office'
import type { AgentId, AgentStatus } from '../lib/types'
import { PixelOffice, type FocusRequest, type Zoom } from '../office2d/PixelOffice'
import { ROOMS, type RoomId } from '../office2d/world'

const AGENTS: AgentId[] = ['scout', 'atlas', 'sentinel', 'nova', 'mercury']
const states: AgentStatus[] = ['working', 'idle', 'sleeping', 'completed', 'failed', 'unknown']
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const btn = (on: boolean) => `min-h-12 rounded-xl border text-[10px] uppercase tracking-[0.08em] ${on ? 'border-white bg-elevated text-white' : 'border-line text-fg-2'}`

export function Office() {
  const snap = useSnapshot()
  const box = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [tabOn, setTabOn] = useState(!document.hidden)
  const [reduced] = useState(reducedMotion)
  const initial = useMemo(() => Object.fromEntries(snap.agents.map((a) => [a.id, a.status])) as Record<AgentId, AgentStatus>, [snap])
  const [statuses, setStatuses] = useState(initial)
  const [selected, setSelected] = useState<AgentId>('atlas')
  const [zoom, setZoom] = useState<Zoom>(2)
  const [follow, setFollow] = useState(false)
  const [focus, setFocus] = useState<FocusRequest | null>({ room: 'work', n: 0 })
  const [labels, setLabels] = useState<Partial<Record<AgentId, string>>>({})

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

  const night = isNight(statuses)
  const agent = snap.agents.find((a) => a.id === selected)!
  const last = snap.activity.filter((e) => e.agentId === selected).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  const status = statuses[selected]
  const jump = (room: RoomId) => {
    setFollow(false)
    setFocus((f) => ({ room, n: (f?.n ?? 0) + 1 }))
  }
  const all = (s: AgentStatus) => setStatuses(Object.fromEntries(AGENTS.map((id) => [id, s])) as Record<AgentId, AgentStatus>)

  return (
    <>
      <PageHeader title="Escritório" subtitle="Quatro salas em pixel art. Arraste para explorar." />
      <SimBanner />
      <div ref={box} className="border-y border-line bg-bg-2">
        <PixelOffice
          states={statuses}
          night={night}
          selected={selected}
          onSelect={(id) => { setSelected(id); setFollow(true) }}
          active={visible && tabOn}
          reducedMotion={reduced}
          zoom={zoom}
          follow={follow}
          focus={focus}
          onUserPan={() => setFollow(false)}
          onLabels={setLabels}
        />
      </div>
      {night && <p className="mx-5 mt-3 text-center text-[11px] uppercase tracking-[0.12em] text-fg-2">Modo noturno · todos dormindo</p>}

      <div className="mx-5 mt-4 grid grid-cols-4 gap-1.5" role="group" aria-label="Ir para a sala">
        {ROOMS.map((r) => (
          <button key={r.id} onClick={() => jump(r.id)} className={btn(false) + ' text-[9px] tracking-[0.04em]'}>{r.name}</button>
        ))}
      </div>
      <div className="mx-5 mt-2 grid grid-cols-4 gap-1.5" role="group" aria-label="Zoom e câmera">
        {([1, 2, 3] as const).map((z) => (
          <button key={z} onClick={() => setZoom(z)} aria-pressed={zoom === z} className={btn(zoom === z)}>{z}×</button>
        ))}
        <button onClick={() => setFollow((f) => !f)} aria-pressed={follow} className={btn(follow) + ' text-[9px] tracking-[0.04em]'}>Seguir</button>
      </div>

      <div className="mx-5 mt-4 grid grid-cols-5 gap-1.5" role="group" aria-label="Selecionar agente">
        {snap.agents.map((a) => (
          <button key={a.id} onClick={() => { setSelected(a.id); setFollow(true) }} aria-pressed={selected === a.id} className={btn(selected === a.id) + ' text-[9px] tracking-[0.04em]'}>{a.name}</button>
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
        <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-fg-3">Agora (animação)</p>
        <p className="mt-1 text-sm text-fg">{labels[selected] ?? '—'}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-fg-3">Último evento (simulado)</p>
        <p className="mt-1 text-sm text-fg">{last ? last.activity : 'Sem eventos registrados.'}</p>
        {last && <p className="mt-1 text-xs tabular-nums text-fg-3">{formatDateTime(last.timestamp)}</p>}
      </Card>

      <div className="mx-5 mt-4">
        <Label>Simular estado de {agent.name}</Label>
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Estado simulado">
          {states.map((s) => (
            <button key={s} onClick={() => setStatuses((p) => ({ ...p, [selected]: s }))} aria-pressed={status === s} className={btn(status === s)}>{s}</button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => all('idle')} className={btn(false)}>Todos ociosos</button>
          <button onClick={() => all('sleeping')} className={btn(false)}>Todos dormem</button>
          <button onClick={() => all('working')} className={btn(false)}>Todos trabalham</button>
          <button onClick={() => setStatuses(initial)} className={btn(false)}>Restaurar</button>
        </div>
      </div>
    </>
  )
}
