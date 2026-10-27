/** Projeção isométrica 2:1 (tile 32×16). Módulo puro, sem DOM (usado também pela lógica de comportamento). */
export const TILE_W = 32
export const TILE_H = 16
export interface Origin { ox: number; oy: number }

export const proj = (o: Origin, gx: number, gy: number, z = 0): [number, number] => [
  o.ox + Math.round((gx - gy) * (TILE_W / 2)),
  o.oy + Math.round((gx + gy) * (TILE_H / 2)) - z,
]

/** Inverso (no plano do chão): pixel do mundo → tile. */
export const unproj = (o: Origin, x: number, y: number): [number, number] => {
  const X = (x - o.ox) / (TILE_W / 2), Y = (y - o.oy) / (TILE_H / 2)
  return [(X + Y) / 2, (Y - X) / 2]
}
