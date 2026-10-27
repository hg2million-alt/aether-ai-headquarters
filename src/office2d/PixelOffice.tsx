import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AgentId, AgentStatus } from '../lib/types'
import { World } from './render'
import { AGENT_ORDER } from './layout'
import { WORLD_H, WORLD_W, type RoomId } from './world'

const STEP_MS = 125 // 8 quadros/s: caminhada fluida sem custo alto
const VIEW_H = 340 // altura da janela (px CSS)

export type Zoom = 1 | 2 | 3
export interface FocusRequest { room: RoomId; n: number }

export function PixelOffice({
  states, night = false, selected = null, onSelect, active = true, reducedMotion = false, zoom = 2, follow = false, focus = null, showNames = false, onUserPan, onLabels,
}: {
  states: Partial<Record<AgentId, AgentStatus>>
  night?: boolean
  selected?: AgentId | null
  onSelect?: (id: AgentId) => void
  active?: boolean
  reducedMotion?: boolean
  zoom?: Zoom
  follow?: boolean
  focus?: FocusRequest | null
  showNames?: boolean
  onUserPan?: () => void
  onLabels?: (labels: Partial<Record<AgentId, string>>) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const [cssW, setCssW] = useState(360)
  const world = useMemo(() => new World(states), []) // eslint-disable-line react-hooks/exhaustive-deps
  const cam = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const live = useRef({ states, night, selected, follow, zoom, showNames })
  live.current = { states, night, selected, follow, zoom, showNames }
  const lastLabels = useRef('')

  const vw = Math.max(60, Math.floor(cssW / zoom))
  const vh = Math.floor(VIEW_H / zoom)

  const clamp = useCallback((x: number, y: number): [number, number] => [
    Math.min(Math.max(x, vw / 2 - 40), WORLD_W - vw / 2 + 40),
    Math.min(Math.max(y, vh / 2 - 30), WORLD_H - vh / 2 + 30),
  ], [vw, vh])

  const render = useCallback(() => {
    const ctx = cv.current?.getContext('2d')
    if (!ctx) return
    const L = live.current
    if (!cam.current) {
      const [x, y] = world.roomPoint('work')
      cam.current = { x, y, tx: x, ty: y }
    }
    const c = cam.current
    if (L.follow && L.selected) {
      const [x, y] = world.agentPoint(L.selected)
      ;[c.tx, c.ty] = clamp(x, y)
    }
    c.x += (c.tx - c.x) * 0.22
    c.y += (c.ty - c.y) * 0.22
    ctx.imageSmoothingEnabled = false
    world.draw(ctx, Math.round(c.x - vw / 2), Math.round(c.y - vh / 2), vw, vh, L.states, L.night, L.selected, L.showNames)
    if (onLabels) {
      const m: Partial<Record<AgentId, string>> = {}
      for (const id of AGENT_ORDER) m[id] = world.label(id)
      const s = JSON.stringify(m)
      if (s !== lastLabels.current) {
        lastLabels.current = s
        onLabels(m)
      }
    }
  }, [world, vw, vh, clamp, onLabels])

  // largura disponível
  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setCssW(el.clientWidth || 360)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // pular para uma sala
  useEffect(() => {
    if (!focus) return
    const [x, y] = clamp(...world.roomPoint(focus.room))
    const c = cam.current ?? { x, y, tx: x, ty: y }
    c.tx = x; c.ty = y
    if (reducedMotion) { c.x = x; c.y = y }
    cam.current = c
    render()
  }, [focus, world, clamp, reducedMotion, render])

  // simulação + repintura
  useEffect(() => {
    if (reducedMotion) {
      world.settle(states)
      render()
      return
    }
    if (!active) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      world.update((now - last) / 1000, live.current.states)
      last = now
      render()
    }, STEP_MS)
    return () => clearInterval(id)
  }, [active, reducedMotion, world, states, render])

  useEffect(render, [render, night, selected, follow, zoom, vw, vh, showNames])

  const drag = useRef<{ x: number; y: number; moved: number } | null>(null)

  return (
    <div ref={box} className="flex w-full justify-center">
      <canvas
        ref={cv}
        width={vw}
        height={vh}
        role="img"
        aria-label="Escritório em pixel art com quatro salas: trabalho, refeitório, descanso e games"
        style={{ imageRendering: 'pixelated', width: vw * zoom, height: vh * zoom, touchAction: 'none', cursor: 'grab' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, y: e.clientY, moved: 0 }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d || !cam.current) return
          const dx = e.clientX - d.x, dy = e.clientY - d.y
          d.x = e.clientX; d.y = e.clientY
          d.moved += Math.abs(dx) + Math.abs(dy)
          if (d.moved > 6) {
            if (live.current.follow) onUserPan?.()
            const [nx, ny] = clamp(cam.current.tx - dx / zoom, cam.current.ty - dy / zoom)
            cam.current.tx = nx; cam.current.ty = ny; cam.current.x = nx; cam.current.y = ny
            render()
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          if (!d || d.moved > 6 || !cam.current) return
          const r = e.currentTarget.getBoundingClientRect()
          const wx = cam.current.x - vw / 2 + ((e.clientX - r.left) / r.width) * vw
          const wy = cam.current.y - vh / 2 + ((e.clientY - r.top) / r.height) * vh
          const hit = world.hit(wx, wy)
          if (hit) onSelect?.(hit)
        }}
      />
    </div>
  )
}
