import { obstacles } from './layout.ts'
import { COLS, ROWS } from './world.ts'

/** Busca de caminho A* em grade de 0,5 tile (determinística). Módulo puro. */
const RES = 2
const NX = COLS * RES, NY = ROWS * RES

export type Pt = [number, number]

let grid: Uint8Array | null = null

function blockedGrid(): Uint8Array {
  if (grid) return grid
  const g = new Uint8Array(NX * NY)
  const obs = obstacles()
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const x0 = i / RES, y0 = j / RES, x1 = x0 + 1 / RES, y1 = y0 + 1 / RES
      const edge = x0 < 0.25 || y0 < 0.25 || x1 > COLS - 0.25 || y1 > ROWS - 0.25
      if (edge || obs.some((o) => x0 < o.x1 && x1 > o.x0 && y0 < o.y1 && y1 > o.y0)) g[j * NX + i] = 1
    }
  grid = g
  return g
}

export const isFree = (x: number, y: number) => {
  const i = Math.floor(x * RES), j = Math.floor(y * RES)
  return i >= 0 && j >= 0 && i < NX && j < NY && !blockedGrid()[j * NX + i]
}

/** Segmento livre? (amostragem a cada 0,1 tile) */
function clear(a: Pt, b: Pt): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1))
  for (let k = 0; k <= n; k++) if (!isFree(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n)) return false
  return true
}

/** Caminho de `from` até `to` (ambos devem estar em células livres). Retorna null se inalcançável. */
export function findPath(from: Pt, to: Pt): Pt[] | null {
  const g = blockedGrid()
  const cell = (p: Pt) => Math.floor(p[1] * RES) * NX + Math.floor(p[0] * RES)
  const s = cell(from), t = cell(to)
  if (g[s] || g[t]) return null
  const gScore = new Float32Array(NX * NY).fill(Infinity)
  const prev = new Int32Array(NX * NY).fill(-1)
  const open: number[] = [s]
  gScore[s] = 0
  const h = (c: number) => Math.hypot((c % NX) - (t % NX), Math.floor(c / NX) - Math.floor(t / NX))
  const f = new Map<number, number>([[s, h(s)]])
  const closed = new Uint8Array(NX * NY)
  while (open.length) {
    let bi = 0
    for (let k = 1; k < open.length; k++) if ((f.get(open[k]) ?? 0) < (f.get(open[bi]) ?? 0) || ((f.get(open[k]) ?? 0) === (f.get(open[bi]) ?? 0) && open[k] < open[bi])) bi = k
    const cur = open.splice(bi, 1)[0]
    if (cur === t) break
    closed[cur] = 1
    const cx = cur % NX, cy = Math.floor(cur / NX)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = cx + dx, ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) continue
        const n = ny * NX + nx
        if (g[n] || closed[n]) continue
        if (dx && dy && (g[cy * NX + nx] || g[ny * NX + cx])) continue // sem cortar quina
        const ng = gScore[cur] + (dx && dy ? 1.4142 : 1)
        if (ng < gScore[n]) {
          gScore[n] = ng
          prev[n] = cur
          f.set(n, ng + h(n))
          if (!open.includes(n)) open.push(n)
        }
      }
  }
  if (prev[t] < 0 && s !== t) return null
  const cells: number[] = []
  for (let c = t; c !== -1; c = prev[c]) cells.push(c)
  cells.reverse()
  const pts: Pt[] = cells.map((c) => [((c % NX) + 0.5) / RES, (Math.floor(c / NX) + 0.5) / RES])
  // suaviza (puxa o fio) mantendo apenas pontos necessários
  const out: Pt[] = [pts[0]]
  let anchor = 0
  for (let k = 2; k < pts.length; k++) {
    if (!clear(pts[anchor], pts[k])) {
      out.push(pts[k - 1])
      anchor = k - 1
    }
  }
  out.push(pts[pts.length - 1])
  return out
}
