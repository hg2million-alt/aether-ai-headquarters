import type { AgentId, AgentStatus } from '../lib/types'
import { AGENT_ORDER, spotsOf, SPOTS, type Activity, type Spot } from './layout.ts'
import { findPath, type Pt } from './path.ts'
import { hash } from './rand.ts'

/**
 * Comportamento determinístico dos agentes (sem IA, sem Math.random):
 * trabalhando → mesa; dormindo → cama; ocioso → circula entre salas com atividades variadas.
 */
export type Dir = 'NE' | 'NW' | 'SE' | 'SW'
export const LEISURE: Activity[] = ['read', 'coffee', 'eat', 'arcade', 'foosball']
export const SPEED = 2.6 // tiles/s

export interface AgentSim {
  id: AgentId
  x: number
  y: number
  dir: Dir
  spot: Spot
  act: Activity
  path: Pt[]
  walking: boolean
  /** tempo na atividade atual (s) e ciclo de lazer */
  t: number
  cycle: number
  leisureUntil: number
}

export const ACTIVITY_LABEL: Record<Activity, string> = {
  desk: 'Na mesa de trabalho', bed: 'Dormindo na cama', read: 'Lendo no sofá', coffee: 'Tomando café', eat: 'Comendo no refeitório', arcade: 'Jogando fliperama', foosball: 'Jogando pebolim',
}

const idx = (id: AgentId) => AGENT_ORDER.indexOf(id)
const spotById = (id: string) => SPOTS.find((s) => s.id === id)!
const faceDir = (s: Spot): Dir => (s.face === 'N' ? 'NE' : 'SE')

export function dirOf(dx: number, dy: number): Dir {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'SE' : 'NW'
  return dy >= 0 ? 'SW' : 'NE'
}

export class Sim {
  readonly agents: AgentSim[] = []
  time = 0

  constructor(statuses: Partial<Record<AgentId, AgentStatus>>) {
    for (const id of AGENT_ORDER) {
      const st = statuses[id] ?? 'unknown'
      const a: AgentSim = { id, x: 0, y: 0, dir: 'SE', spot: spotById(`desk:${idx(id)}`), act: 'desk', path: [], walking: false, t: 0, cycle: 0, leisureUntil: 0 }
      const want = this.choose(a, st)
      a.spot = want
      a.act = want.act
      a.x = want.x
      a.y = want.y
      a.dir = faceDir(want)
      a.leisureUntil = this.leisureLength(a)
      this.agents.push(a)
    }
  }

  private leisureLength(a: AgentSim) {
    return 10 + hash(idx(a.id), a.cycle, 9) * 10
  }

  private taken(except: AgentSim): Set<string> {
    const s = new Set<string>()
    for (const o of this.agents) if (o !== except) s.add(o.spot.id)
    return s
  }

  /** Escolhe a vaga desejada para o estado (determinístico; evita vagas ocupadas). */
  private choose(a: AgentSim, st: AgentStatus): Spot {
    const i = idx(a.id)
    if (st === 'sleeping') return spotById(`bed:${i}`)
    if (st !== 'idle') return spotById(`desk:${i}`)
    const busy = this.taken(a)
    let k = Math.floor(hash(i, a.cycle, 3) * LEISURE.length)
    if (LEISURE[k] === a.act) k = (k + 1) % LEISURE.length
    for (let n = 0; n < LEISURE.length; n++) {
      const list = spotsOf(LEISURE[(k + n) % LEISURE.length])
      const off = Math.floor(hash(i, a.cycle, 5) * list.length)
      for (let m = 0; m < list.length; m++) {
        const s = list[(off + m) % list.length]
        if (!busy.has(s.id)) return s
      }
    }
    return a.spot
  }

  private goTo(a: AgentSim, to: Spot) {
    const from: Pt = a.walking ? [a.x, a.y] : a.spot.approach
    const pts: Pt[] = []
    if (!a.walking) pts.push([a.spot.approach[0], a.spot.approach[1]])
    const mid = findPath(from, to.approach) ?? [from, to.approach]
    for (const p of mid) pts.push(p)
    pts.push([to.x, to.y])
    a.path = pts
    a.spot = to
    a.act = to.act
    a.walking = true
    a.t = 0
  }

  update(dt: number, statuses: Partial<Record<AgentId, AgentStatus>>) {
    this.time += dt
    for (const a of this.agents) {
      const st = statuses[a.id] ?? 'unknown'
      if (!a.walking) {
        a.t += dt
        // ciclo de lazer: ao terminar, escolhe outra atividade
        if (st === 'idle' && a.t > a.leisureUntil) {
          a.cycle++
          a.leisureUntil = this.leisureLength(a)
        }
      }
      const want = this.choose(a, st)
      const needsChange = a.spot.id !== want.id && (!a.walking || a.path.length === 0 || a.path[a.path.length - 1][0] !== want.x || a.path[a.path.length - 1][1] !== want.y)
      if (needsChange && (st !== 'idle' || !a.walking || want.act !== a.act)) {
        if (st !== 'idle' || !a.walking) this.goTo(a, want)
      }
      this.move(a, dt)
    }
  }

  private move(a: AgentSim, dt: number) {
    if (!a.walking) return
    let step = SPEED * dt
    while (step > 0 && a.path.length) {
      const [tx, ty] = a.path[0]
      const d = Math.hypot(tx - a.x, ty - a.y)
      if (d > 0.001) a.dir = dirOf(tx - a.x, ty - a.y)
      if (d <= step) {
        a.x = tx; a.y = ty
        a.path.shift()
        step -= d
      } else {
        a.x += ((tx - a.x) / d) * step
        a.y += ((ty - a.y) / d) * step
        step = 0
      }
    }
    if (!a.path.length) {
      a.walking = false
      a.dir = faceDir(a.spot)
      a.t = 0
    }
  }
}
