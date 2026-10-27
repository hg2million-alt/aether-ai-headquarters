import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Card, ConnectionBanner, PageHeader } from '../components/ui'
import { useSnapshot } from '../data/source'
import { formatDateTime } from '../lib/format'
import { ago, STATUS_PT } from '../lib/labels'
import { isNight } from '../lib/office'
import type { AgentId, AgentStatus } from '../lib/types'
import { PixelOffice, type FocusRequest, type Zoom } from '../office2d/PixelOffice'
import { ROOMS, type RoomId } from '../office2d/world'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const btn = (on: boolean) => `min-h-12 rounded-xl border text-[9px] uppercase tracking-[0.04em] ${on ? 'border-white bg-elevated text-white' : 'border-line text-fg-2'}`

export function Office() {
  const snap = useSnapshot()
  const box = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [tabOn, setTabOn] = useState(!document.hidden)
  const [reduced] = useState(reducedMotion)
  const statuses = useMemo(() => Object.fromEntries(snap.agents.map((a) => [a.id, a.status])) as Record<AgentId, AgentStatus>, [snap])
  const [selected, setSelected] = useState<AgentId | null>(null)
  const [zoom, setZoom] = useState<Zoom>(2)
  const [follow, setFollow] = useState(false)
  const [names, setNames] = useState(false)
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

  const pick = (id: AgentId) => {
    setSelected((cur) => (cur === id ? null : id)) // tocar de novo esconde o nome
    setFollow(true)
  }
  const jump = (room: RoomId) => {
    setFollow(false)
    setFocus((f) => ({ room, n: (f?.n ?? 0) + 1 }))
  }

  const agent = snap.agents.find((a) => a.id === selected)
  const last = agent ? snap.activity.find((e) => e.agentId === agent.id) : undefined

  return (
    <>
      <PageHeader title="Escritório" subtitle="Toque num agente para ver o nome. Arraste para explorar." />
      <ConnectionBanner state={snap.connection} />
      <div ref={box} className="border-y border-line bg-bg-2">
        <PixelOffice
          states={statuses}
          night={isNight(statuses)}
          selected={selected}
          onSelect={pick}
          active={visible && tabOn}
          reducedMotion={reduced}
          zoom={zoom}
          follow={follow && selected !== null}
          focus={focus}
          showNames={names}
          onUserPan={() => setFollow(false)}
          onLabels={setLabels}
        />
      </div>

      <div className="mx-5 mt-4 grid grid-cols-4 gap-1.5" role="group" aria-label="Ir para a sala">
        {ROOMS.map((r) => (
          <button key={r.id} onClick={() => jump(r.id)} className={btn(false)}>{r.name}</button>
        ))}
      </div>
      <div className="mx-5 mt-2 grid grid-cols-5 gap-1.5" role="group" aria-label="Zoom e câmera">
        {([1, 2, 3] as const).map((z) => (
          <button key={z} onClick={() => setZoom(z)} aria-pressed={zoom === z} className={btn(zoom === z)}>{z}×</button>
        ))}
        <button onClick={() => setFollow((f) => !f)} aria-pressed={follow} disabled={!selected} className={btn(follow) + ' disabled:opacity-40'}>Seguir</button>
        <button onClick={() => setNames((n) => !n)} aria-pressed={names} className={btn(names)}>Nomes</button>
      </div>

      <div className="mx-5 mt-4 grid grid-cols-5 gap-1.5" role="group" aria-label="Selecionar agente">
        {snap.agents.map((a) => (
          <button key={a.id} onClick={() => pick(a.id)} aria-pressed={selected === a.id} className={btn(selected === a.id)}>{a.name}</button>
        ))}
      </div>

      {agent ? (
        <Card className="mx-5 mt-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-light uppercase tracking-[0.2em] text-white">{agent.name}</p>
              <p className="mt-1 text-xs text-fg-2">{agent.role}</p>
            </div>
            <Badge>{STATUS_PT[agent.status]}</Badge>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-fg-3">Agora</p>
          <p className="mt-1 text-sm text-fg">{agent.status === 'unknown' ? 'Sem sinal da automação' : (labels[agent.id] ?? '—')}</p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-fg-3">Último evento</p>
          <p className="mt-1 text-sm text-fg">{last ? last.activity : 'Sem eventos ainda'}</p>
          {last && <p className="mt-1 text-xs tabular-nums text-fg-3">{formatDateTime(last.timestamp)} · {ago(last.timestamp)}</p>}
        </Card>
      ) : (
        <p className="mx-5 mt-4 text-center text-xs text-fg-3">Nenhum agente selecionado.</p>
      )}
    </>
  )
}
