import { useEffect, useMemo, useRef } from 'react'
import type { AgentId, AgentStatus } from '../lib/types'
import { Scene } from './scene'
import { SCENE_H, SCENE_W } from './room'

const TICK_MS = 250

export function PixelOffice({
  states, night = false, selected = null, onSelect, active = true, reducedMotion = false, scale = 2,
}: {
  states: Partial<Record<AgentId, AgentStatus>>
  night?: boolean
  selected?: AgentId | null
  onSelect?: (id: AgentId) => void
  active?: boolean
  reducedMotion?: boolean
  scale?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const scene = useMemo(() => new Scene(), [])
  const tick = useRef(0)
  const props = useRef({ states, night, selected })
  props.current = { states, night, selected }

  const paint = () => {
    const ctx = ref.current?.getContext('2d')
    if (ctx) scene.draw(ctx, props.current.states, tick.current, props.current.night, props.current.selected)
  }

  useEffect(paint) // repinta quando estados/seleção/noite mudam

  useEffect(() => {
    if (!active || reducedMotion) return
    const id = setInterval(() => {
      tick.current++
      paint()
    }, TICK_MS)
    return () => clearInterval(id)
  })

  return (
    <canvas
      ref={ref}
      width={SCENE_W}
      height={SCENE_H}
      role="img"
      aria-label="Escritório em pixel art com as estações dos agentes"
      style={{ imageRendering: 'pixelated', width: SCENE_W * scale, height: SCENE_H * scale, touchAction: 'pan-y' }}
      onPointerUp={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width) * SCENE_W, y = ((e.clientY - r.top) / r.height) * SCENE_H
        const hit = scene.hitBoxes().find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)
        if (hit) onSelect?.(hit.id)
      }}
    />
  )
}
