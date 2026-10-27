import { useEffect, useRef } from 'react'
import type { AgentId, AgentStatus } from '../lib/types'
import { bubbleSprite, charSprite, handsSprite, standSprite } from '../office2d/characters'
import { AGENT_ORDER } from '../office2d/layout'
import { STYLES } from '../office2d/styles'

const W = 32
const H = 40
const IDLE_ACTS = ['read', 'coffee', 'eat', 'arcade', 'walk'] as const
const STEP_MS = 125
const IDLE_TICKS = 32 // 4 s por atividade de descanso

/**
 * Retrato animado do agente (só o boneco, sem mapa). Cada estado tem sua animação; ocioso alterna
 * entre as atividades de descanso. Usa os mesmos sprites do escritório.
 */
export function AgentAvatar({ id, status }: { id: AgentId; status: AgentStatus }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const style = STYLES[id]
    const offset = AGENT_ORDER.indexOf(id)
    const draw = (tick: number) => {
      ctx.clearRect(0, 0, W, H)
      let bubbleState: AgentStatus | null = status
      if (status === 'idle') {
        const act = IDLE_ACTS[(Math.floor(tick / IDLE_TICKS) + offset) % IDLE_ACTS.length]
        bubbleState = null
        if (act === 'read' || act === 'eat') {
          const cv = charSprite(id, style, 'idle', tick, act)
          ctx.drawImage(cv, Math.round((W - cv.width) / 2), H - 4 - cv.height)
        } else {
          const cv = standSprite(id, style, act === 'walk' ? 'front' : 'back', act === 'walk' ? 'walk' : act === 'coffee' ? 'coffee' : 'arcade', tick)
          ctx.drawImage(cv, Math.round((W - cv.width) / 2), H - 2 - cv.height)
        }
      } else {
        // sem sinal: respira e pisca (pose de repouso) mantendo o balão "?"
        const cv = charSprite(id, style, status === 'unknown' ? 'idle' : status, tick)
        const x = Math.round((W - cv.width) / 2), y = H - 4 - cv.height
        ctx.drawImage(cv, x, y)
        const hands = status === 'working' ? handsSprite(style, status, tick) : null
        if (hands) ctx.drawImage(hands, Math.round((W - hands.width) / 2), y + 20)
      }
      const bub = bubbleState ? bubbleSprite(bubbleState, tick) : null
      if (bub) ctx.drawImage(bub, W - bub.width - 1, 1)
    }
    draw(0)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let tick = 0
    const t = setInterval(() => {
      if (document.hidden) return
      draw(++tick)
    }, STEP_MS)
    return () => clearInterval(t)
  }, [id, status])

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      role="img"
      aria-label={`Retrato animado de ${id}`}
      className="shrink-0 rounded-xl border border-line bg-elevated"
      style={{ imageRendering: 'pixelated', width: W * 2.5, height: H * 2.5 }}
    />
  )
}
