import type { AgentId, AgentStatus } from '../lib/types'
import { Sim, ACTIVITY_LABEL, type AgentSim } from './behavior'
import { bubbleSprite, charSprite, handsSprite, headSprite, nameTag, SPRITE_BASE, SPRITE_W, STAND_BASE, STAND_W, standSprite, type StandAct } from './characters'
import { buildFurniture, type Ent, type RenderCtx } from './furniture'
import { AGENT_ORDER, DESK_W, FURN, deskX } from './layout'
import { buildPartitions } from './partitions'
import { Pix, proj, rgb } from './raster'
import { buildBackground, C } from './room'
import type { Sprite } from './sprite'
import { STYLES } from './styles'
import { COLS, ORIGIN, ROOM_FOCUS, ROWS, WORLD_H, WORLD_W, type RoomId } from './world'

const O = ORIGIN
export type Statuses = Partial<Record<AgentId, AgentStatus>>

interface Item { depth: number; draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number) => void; x0: number; y0: number; x1: number; y1: number }

const AGENT_NAMES: Record<AgentId, string> = { scout: 'SCOUT', atlas: 'ATLAS', sentinel: 'SENTINEL', nova: 'NOVA', mercury: 'MERCURY' }
const FRAME_STEP = 8 // quadros de animação por segundo

/** Mundo completo: fundo, móveis, divisórias, agentes e câmera. */
export class World {
  readonly bg = buildBackground().toCanvas()
  readonly furn: Ent[] = buildFurniture()
  readonly parts: Sprite[] = buildPartitions()
  readonly lights: HTMLCanvasElement
  readonly sim: Sim
  private statics: { depth: number; ent?: Ent; sprite?: Sprite }[]

  constructor(statuses: Statuses) {
    this.sim = new Sim(statuses)
    this.statics = [...this.furn.map((e) => ({ depth: e.depth, ent: e })), ...this.parts.map((s) => ({ depth: s.depth, sprite: s }))].sort((a, b) => a.depth - b.depth)
    const l = new Pix(WORLD_W, WORLD_H)
    for (const u of [16, 112, 224, 336, 464]) l.glow(O.ox + u, O.oy + Math.floor(u / 2) - 39, 11, C.warm, 0.8)
    for (const u of [16, 144, 176, 304]) l.glow(O.ox - 1 - u, O.oy + Math.floor(u / 2) - 39, 11, C.warm, 0.8)
    AGENT_ORDER.forEach((_, i) => { const p = proj(O, deskX(i) + 0.15, 2.18, 16); l.glow(p[0] - 3, p[1] - 7, 10, rgb('#ffcf80'), 0.8) })
    for (const f of FURN.filter((f) => f.kind === 'arcade')) { const p = proj(O, f.gx + 0.5, f.gy + 0.9, 20); l.glow(p[0], p[1], 9, rgb('#7fa8ff'), 0.7) }
    this.lights = l.toCanvas()
  }

  update(dt: number, statuses: Statuses) {
    this.sim.update(Math.min(dt, 0.25), statuses)
  }

  /** Executa a simulação até todos chegarem (modo sem animação). */
  settle(statuses: Statuses) {
    for (let t = 0; t < 120; t += 0.25) {
      this.sim.update(0.25, statuses)
      if (this.sim.agents.every((a) => !a.walking)) break
    }
  }

  get anim() {
    return Math.floor(this.sim.time * FRAME_STEP)
  }

  private ctxFor(statuses: Statuses): RenderCtx {
    const occupied = new Set<string>()
    for (const a of this.sim.agents) if (!a.walking) occupied.add(a.spot.id)
    const deskOn = AGENT_ORDER.map((id) => {
      const a = this.sim.agents.find((x) => x.id === id)!
      return !a.walking && a.act === 'desk' && statuses[id] === 'working'
    })
    return { anim: this.anim, occupied, deskOn }
  }

  /** Posição (px do mundo) do tronco do agente, para seguir com a câmera. */
  agentPoint(id: AgentId): [number, number] {
    const a = this.sim.agents.find((x) => x.id === id)!
    return proj(O, a.x, a.y, a.act === 'bed' && !a.walking ? 10 : 18)
  }

  roomPoint(room: RoomId): [number, number] {
    return proj(O, ROOM_FOCUS[room][0], ROOM_FOCUS[room][1], 10)
  }

  label(id: AgentId): string {
    const a = this.sim.agents.find((x) => x.id === id)!
    return a.walking ? `Andando · ${ACTIVITY_LABEL[a.act]}` : ACTIVITY_LABEL[a.act]
  }

  private agentItems(a: AgentSim, st: AgentStatus, anim: number, selected: AgentId | null, showNames: boolean): Item[] {
    const style = STYLES[a.id]
    const items: Item[] = []
    const add = (depth: number, x: number, y: number, w: number, h: number, draw: Item['draw']) => items.push({ depth, x0: x, y0: y, x1: x + w, y1: y + h, draw })
    const blit = (cv: HTMLCanvasElement, x: number, y: number, mirror = false): Item['draw'] => (ctx, cx, cy) => {
      if (!mirror) ctx.drawImage(cv, x - cx, y - cy)
      else {
        ctx.save()
        ctx.translate(x - cx + cv.width, y - cy)
        ctx.scale(-1, 1)
        ctx.drawImage(cv, 0, 0)
        ctx.restore()
      }
    }
    let headTop = 0, ax = 0
    const depth = a.x + a.y
    if (a.walking || a.act === 'coffee' || a.act === 'arcade' || a.act === 'foosball') {
      const [x, y] = proj(O, a.x, a.y, 0)
      const view = a.dir === 'NE' || a.dir === 'NW' ? 'back' : 'front'
      const mirror = a.dir === 'SW' || a.dir === 'NW'
      const act: StandAct = a.walking ? 'walk' : a.act === 'coffee' ? 'coffee' : a.act === 'arcade' ? 'arcade' : 'foos'
      const cv = standSprite(a.id, style, view, act, anim)
      add(depth, x - STAND_W / 2, y - STAND_BASE, cv.width, cv.height, blit(cv, x - STAND_W / 2, y - STAND_BASE, mirror))
      headTop = y - STAND_BASE + 2; ax = x
      if (!a.walking && a.act === 'coffee') {
        const [sx, sy] = proj(O, a.x, 1.0, 27)
        add(depth + 0.2, sx - 4, sy - 12, 8, 12, (ctx, cx, cy) => {
          ctx.fillStyle = 'rgba(255,255,255,0.75)'
          for (let k = 0; k < 3; k++) ctx.fillRect(sx - cx + ((anim + k * 2) % 3) - 1, sy - cy - 2 - ((anim + k * 3) % 8), 1, 2)
        })
      }
    } else if (a.act === 'bed') {
      const i = Number(a.spot.id.split(':')[1])
      const [x, y] = proj(O, 0.82, 10.9 + 1.75 * i + 0.65, 11)
      const hd = headSprite(a.id, style)
      const bd = 0.2 + 1.2 + 10.9 + 1.75 * i + 0.65
      add(bd + 0.01, x - 9, y - 11, hd.width, hd.height, blit(hd, x - 9, y - 11))
      headTop = y - 12; ax = x
    } else {
      const z = a.spot.seatZ ?? 11
      const [x, y] = proj(O, a.x, a.y, z)
      const cv = charSprite(a.id, style, st, anim >> 0, a.act === 'read' ? 'read' : a.act === 'eat' ? 'eat' : undefined)
      add(depth, x - SPRITE_W / 2, y - SPRITE_BASE, cv.width, cv.height, blit(cv, x - SPRITE_W / 2, y - SPRITE_BASE))
      headTop = y - SPRITE_BASE + 5; ax = x
      if (a.act === 'desk') {
        const i = AGENT_ORDER.indexOf(a.id)
        const hs = handsSprite(style, st, anim)
        if (hs) {
          const [hx, hy] = proj(O, deskX(i) + DESK_W / 2 + 0.05, 2.55, 17)
          add(deskX(i) + DESK_W + 3.2, hx - 7, hy - 4, hs.width, hs.height, blit(hs, hx - 7, hy - 4))
        }
      }
    }
    // balão de estado (só na mesa ou na cama) e seta de seleção
    const bst: AgentStatus | null = a.walking ? null : a.act === 'desk' ? st : a.act === 'bed' ? 'sleeping' : null
    const bub = bst ? bubbleSprite(bst, anim) : null
    let top = headTop
    if (bub) {
      const bx = ax - 3, by = headTop - bub.height - 1 + (anim % 4 < 2 ? 0 : 1)
      add(1e4, bx, by, bub.width, bub.height, blit(bub, bx, by))
      top = by
    }
    if (selected === a.id || showNames) {
      const tag = nameTag(AGENT_NAMES[a.id], STYLES[a.id].shirt[2])
      const ty = top - tag.height - 1 + (selected === a.id && anim % 4 >= 2 ? 1 : 0)
      const tx = ax - Math.floor(tag.width / 2)
      add(1e4 + (selected === a.id ? 2 : 1), tx, ty, tag.width, tag.height, blit(tag, tx, ty))
    }
    return items
  }

  /** Desenha a região (cx, cy, vw, vh) do mundo. */
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, vw: number, vh: number, statuses: Statuses, night: boolean, selected: AgentId | null, showNames = false) {
    ctx.fillStyle = '#0b0b0b'
    ctx.fillRect(0, 0, vw, vh)
    ctx.drawImage(this.bg, cx, cy, vw, vh, 0, 0, vw, vh)
    const rc = this.ctxFor(statuses)
    const items: Item[] = []
    const vis = (x0: number, y0: number, x1: number, y1: number) => x1 >= cx && x0 <= cx + vw && y1 >= cy && y0 <= cy + vh
    for (const s of this.statics) {
      const sp = s.sprite ?? s.ent!.frames[s.ent!.pick ? s.ent!.pick(rc) : 0]
      if (!vis(sp.x, sp.y, sp.x + sp.canvas.width, sp.y + sp.canvas.height)) continue
      items.push({ depth: s.depth, x0: sp.x, y0: sp.y, x1: sp.x + sp.canvas.width, y1: sp.y + sp.canvas.height, draw: (c, x, y) => c.drawImage(sp.canvas, sp.x - x, sp.y - y) })
    }
    for (const a of this.sim.agents) for (const it of this.agentItems(a, statuses[a.id] ?? 'unknown', this.anim, selected, showNames)) if (vis(it.x0, it.y0, it.x1, it.y1)) items.push(it)
    items.sort((a, b) => a.depth - b.depth)
    for (const it of items) it.draw(ctx, cx, cy)
    if (night) {
      ctx.fillStyle = 'rgba(14,20,52,0.45)'
      ctx.fillRect(0, 0, vw, vh)
      ctx.globalCompositeOperation = 'screen'
      ctx.drawImage(this.lights, cx, cy, vw, vh, 0, 0, vw, vh)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  /** Agente sob o ponto (px do mundo), se houver. */
  hit(wx: number, wy: number): AgentId | null {
    let best: { id: AgentId; d: number } | null = null
    for (const a of this.sim.agents) {
      const walkingOrStanding = a.walking || a.act === 'coffee' || a.act === 'arcade' || a.act === 'foosball'
      const [x, y] = walkingOrStanding ? proj(O, a.x, a.y, 0) : a.act === 'bed' ? proj(O, 0.82, 10.9 + 1.75 * Number(a.spot.id.split(':')[1]) + 0.65, 11) : proj(O, a.x, a.y, a.spot.seatZ ?? 11)
      const top = walkingOrStanding ? y - 38 : a.act === 'bed' ? y - 14 : y - 32
      if (Math.abs(wx - x) <= 13 && wy >= top - 4 && wy <= y + 8) {
        const d = a.x + a.y
        if (!best || d > best.d) best = { id: a.id, d }
      }
    }
    return best?.id ?? null
  }
}

export const WORLD = { W: WORLD_W, H: WORLD_H, COLS, ROWS }
