import type { Origin } from './iso.ts'

/** Mundo 30×20 tiles = 600 tiles (20× a sala original de 30). Módulo puro (sem DOM). */
export const COLS = 30 // gx: ao longo da parede direita
export const ROWS = 20 // gy: ao longo da parede esquerda
export const WALL_H = 56
export const SLAB = 8
export const ORIGIN: Origin = { ox: ROWS * 16, oy: WALL_H + 2 }
export const WORLD_W = (COLS + ROWS) * 16
export const WORLD_H = ORIGIN.oy + (COLS + ROWS) * 8 + SLAB + 2

export type RoomId = 'work' | 'dine' | 'rest' | 'play'
export interface Room { id: RoomId; name: string; x0: number; y0: number; x1: number; y1: number }

export const ROOMS: Room[] = [
  { id: 'work', name: 'Trabalho', x0: 0, y0: 0, x1: 14, y1: 10 },
  { id: 'dine', name: 'Refeitório', x0: 14, y0: 0, x1: 30, y1: 10 },
  { id: 'rest', name: 'Descanso', x0: 0, y0: 10, x1: 10, y1: 20 },
  { id: 'play', name: 'Games', x0: 10, y0: 10, x1: 30, y1: 20 },
]

export const roomAt = (gx: number, gy: number): Room | undefined => ROOMS.find((r) => gx >= r.x0 && gx < r.x1 && gy >= r.y0 && gy < r.y1)

/** Portas nas divisórias: linha (gx = pos) ou coluna (gy = pos), com intervalo [a, b] livre. */
export interface Door { axis: 'x' | 'y'; pos: number; a: number; b: number }
export const DOORS: Door[] = [
  { axis: 'y', pos: 10, a: 6, b: 8 }, // trabalho ↔ descanso (parede em gy=10)
  { axis: 'y', pos: 10, a: 20, b: 22 }, // refeitório ↔ games
  { axis: 'x', pos: 14, a: 4, b: 6 }, // trabalho ↔ refeitório (parede em gx=14)
  { axis: 'x', pos: 10, a: 14, b: 16 }, // descanso ↔ games (parede em gx=10)
]

/** Divisórias: eixo 'y' = parede ao longo de gx em gy=pos; 'x' = ao longo de gy em gx=pos. */
export const PARTITIONS: { axis: 'x' | 'y'; pos: number; from: number; to: number }[] = [
  { axis: 'y', pos: 10, from: 0, to: 30 },
  { axis: 'x', pos: 14, from: 0, to: 10 },
  { axis: 'x', pos: 10, from: 10, to: 20 },
]

export const isDoorTile = (axis: 'x' | 'y', pos: number, t: number) => DOORS.some((d) => d.axis === axis && d.pos === pos && t >= d.a && t < d.b)

/** Ponto (tile) para onde a câmera vai ao pular para cada sala. */
export const ROOM_FOCUS: Record<RoomId, [number, number]> = { work: [7, 3.6], dine: [22, 4.6], rest: [5, 14.6], play: [20, 14.6] }
