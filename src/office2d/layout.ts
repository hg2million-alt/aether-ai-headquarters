import type { AgentId } from '../lib/types'
import { DOORS, PARTITIONS, type RoomId } from './world.ts'

/** Planta do escritório: móveis (com pegada de colisão) e pontos de atividade. Módulo puro (sem DOM). */
export type FurnKind = 'desk' | 'table' | 'counter' | 'fridge' | 'sofa' | 'coffeetable' | 'bed' | 'shelf' | 'arcade' | 'foos' | 'bean' | 'plant' | 'meeting'
export interface Furn { kind: FurnKind; gx: number; gy: number; w: number; d: number; i?: number; big?: boolean }

export const AGENT_ORDER: AgentId[] = ['scout', 'atlas', 'sentinel', 'nova', 'mercury']
export const DESK_W = 1.6
export const deskX = (i: number) => 1.0 + 2.5 * i
const DESK_Y = 2.0

export const FURN: Furn[] = [
  // trabalho
  ...AGENT_ORDER.map((_, i): Furn => ({ kind: 'desk', gx: deskX(i), gy: DESK_Y, w: DESK_W, d: 1, i })),
  { kind: 'meeting', gx: 8.0, gy: 6.4, w: 4.2, d: 1.8 },
  { kind: 'shelf', gx: 0.25, gy: 5.0, w: 0.6, d: 3.0 },
  { kind: 'plant', gx: 13.2, gy: 3.8, w: 0.6, d: 0.6, big: true },
  { kind: 'plant', gx: 0.4, gy: 0.5, w: 0.6, d: 0.6 },
  { kind: 'plant', gx: 13.1, gy: 9.0, w: 0.6, d: 0.6 },
  // refeitório
  { kind: 'counter', gx: 16.0, gy: 0.2, w: 8.0, d: 1.0 },
  { kind: 'fridge', gx: 24.4, gy: 0.2, w: 1.1, d: 1.0 },
  ...[0, 1, 2].map((j): Furn => ({ kind: 'table', gx: 16.2 + 4 * j, gy: 5.0, w: 1.6, d: 1, i: j })),
  { kind: 'plant', gx: 29.0, gy: 0.5, w: 0.6, d: 0.6, big: true },
  { kind: 'plant', gx: 14.6, gy: 9.0, w: 0.6, d: 0.6 },
  { kind: 'plant', gx: 29.0, gy: 8.8, w: 0.6, d: 0.6 },
  // descanso
  ...[0, 1, 2, 3, 4].map((i): Furn => ({ kind: 'bed', gx: 0.2, gy: 10.9 + 1.75 * i, w: 2.4, d: 1.3, i })),
  { kind: 'sofa', gx: 4.2, gy: 13.0, w: 1.6, d: 0.9, i: 0 },
  { kind: 'sofa', gx: 6.9, gy: 13.0, w: 1.6, d: 0.9, i: 1 },
  { kind: 'coffeetable', gx: 5.65, gy: 14.6, w: 1.4, d: 0.6 },
  { kind: 'shelf', gx: 2.8, gy: 10.3, w: 3.2, d: 0.6 },
  { kind: 'plant', gx: 9.1, gy: 10.6, w: 0.6, d: 0.6 },
  { kind: 'plant', gx: 9.1, gy: 19.0, w: 0.6, d: 0.6, big: true },
  // games
  ...[0, 1, 2].map((i): Furn => ({ kind: 'arcade', gx: 23.0 + 1.3 * i, gy: 10.25, w: 1.0, d: 0.9, i })),
  { kind: 'foos', gx: 14.0, gy: 14.5, w: 2.4, d: 1.2, i: 0 },
  { kind: 'foos', gx: 19.0, gy: 14.5, w: 2.4, d: 1.2, i: 1 },
  { kind: 'bean', gx: 26.0, gy: 15.5, w: 1.0, d: 1.0, i: 0 },
  { kind: 'bean', gx: 27.4, gy: 17.0, w: 1.0, d: 1.0, i: 1 },
  { kind: 'plant', gx: 29.0, gy: 19.0, w: 0.6, d: 0.6, big: true },
  { kind: 'plant', gx: 10.8, gy: 19.0, w: 0.6, d: 0.6 },
]

export type Activity = 'desk' | 'bed' | 'read' | 'coffee' | 'eat' | 'arcade' | 'foosball'
export interface Spot { id: string; act: Activity; x: number; y: number; approach: [number, number]; face: 'N' | 'S'; room: RoomId; seatZ?: number }

export const SPOTS: Spot[] = [
  ...AGENT_ORDER.map((_, i): Spot => ({ id: `desk:${i}`, act: 'desk', x: deskX(i) + 0.85, y: DESK_Y - 0.25, approach: [deskX(i) + 2.05, 1.55], face: 'S', room: 'work', seatZ: 11 })),
  ...[0, 1, 2, 3, 4].map((i): Spot => ({ id: `bed:${i}`, act: 'bed', x: 1.4, y: 10.9 + 1.75 * i + 0.65, approach: [3.0, 10.9 + 1.75 * i + 0.65], face: 'S', room: 'rest' })),
  { id: 'read:0', act: 'read', x: 5.0, y: 13.55, approach: [4.4, 15.6], face: 'S', room: 'rest', seatZ: 8 },
  { id: 'read:1', act: 'read', x: 7.7, y: 13.55, approach: [8.4, 15.6], face: 'S', room: 'rest', seatZ: 8 },
  { id: 'coffee:0', act: 'coffee', x: 18.2, y: 1.8, approach: [18.2, 3.0], face: 'N', room: 'dine' },
  { id: 'coffee:1', act: 'coffee', x: 20.2, y: 1.8, approach: [20.2, 3.0], face: 'N', room: 'dine' },
  ...[0, 1, 2].flatMap((j): Spot[] => [0.45, 1.15].map((o, k) => ({ id: `eat:${j * 2 + k}`, act: 'eat' as const, x: 16.2 + 4 * j + o, y: 4.75, approach: [16.2 + 4 * j + 2.2, 4.5] as [number, number], face: 'S' as const, room: 'dine' as const, seatZ: 11 }))),
  ...[0, 1, 2].map((i): Spot => ({ id: `arcade:${i}`, act: 'arcade', x: 23.5 + 1.3 * i, y: 11.65, approach: [23.5 + 1.3 * i, 12.9], face: 'N', room: 'play' })),
  ...[0, 1].flatMap((t): Spot[] => [
    { id: `foosball:${t * 4}`, act: 'foosball', x: 14.0 + 5 * t + 0.8, y: 14.0, approach: [14.0 + 5 * t + 0.8, 12.8], face: 'S', room: 'play' },
    { id: `foosball:${t * 4 + 1}`, act: 'foosball', x: 14.0 + 5 * t + 1.7, y: 14.0, approach: [14.0 + 5 * t + 1.7, 12.8], face: 'S', room: 'play' },
    { id: `foosball:${t * 4 + 2}`, act: 'foosball', x: 14.0 + 5 * t + 0.8, y: 16.2, approach: [14.0 + 5 * t + 0.8, 17.3], face: 'N', room: 'play' },
    { id: `foosball:${t * 4 + 3}`, act: 'foosball', x: 14.0 + 5 * t + 1.7, y: 16.2, approach: [14.0 + 5 * t + 1.7, 17.3], face: 'N', room: 'play' },
  ]),
]

export const spotsOf = (act: Activity) => SPOTS.filter((s) => s.act === act)

/** Retângulos bloqueados para o caminhar (móveis + divisórias, exceto portas). */
export function obstacles(): { x0: number; y0: number; x1: number; y1: number }[] {
  const out = FURN.filter((f) => f.kind !== 'bean').map((f) => ({ x0: f.gx, y0: f.gy, x1: f.gx + f.w, y1: f.gy + f.d }))
  for (const p of PARTITIONS) {
    const doors = DOORS.filter((d) => d.axis === p.axis && d.pos === p.pos)
    let t = p.from
    const edges = [...doors.map((d) => [d.a, d.b] as const)].sort((a, b) => a[0] - b[0])
    for (const [a, b] of [...edges, [p.to, p.to] as const]) {
      if (a > t) out.push(p.axis === 'y' ? { x0: t, y0: p.pos - 0.1, x1: a, y1: p.pos + 0.3 } : { x0: p.pos - 0.1, y0: t, x1: p.pos + 0.3, y1: a })
      t = b
    }
  }
  return out
}
