import { proj } from './iso'
import { Pix } from './raster'
import { ORIGIN } from './world'

/** Sprite pré-renderizado posicionado no mundo; `depth` (gx+gy do "pé") define a ordem de desenho. */
export interface Sprite { canvas: HTMLCanvasElement; x: number; y: number; depth: number }

export interface Bounds { x0: number; y0: number; x1: number; y1: number }

/** Retângulo (px do mundo) que contém uma caixa de tiles com altura h. */
export function boxBounds(gx: number, gy: number, w: number, d: number, h: number, z = 0, m = 4): Bounds {
  const pts = [proj(ORIGIN, gx, gy, z + h), proj(ORIGIN, gx + w, gy, z + h), proj(ORIGIN, gx + w, gy + d, z), proj(ORIGIN, gx, gy + d, z), proj(ORIGIN, gx + w, gy + d, z + h), proj(ORIGIN, gx, gy, z)]
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  return { x0: Math.min(...xs) - m, y0: Math.min(...ys) - m, x1: Math.max(...xs) + m, y1: Math.max(...ys) + m }
}

export const union = (a: Bounds, b: Bounds): Bounds => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) })

/** Desenha dentro de uma Pix do tamanho de `b` (coordenadas do mundo) e devolve o sprite. */
export function bake(b: Bounds, depth: number, draw: (p: Pix) => void): Sprite {
  const p = new Pix(b.x1 - b.x0, b.y1 - b.y0, b.x0, b.y0)
  draw(p)
  return { canvas: p.toCanvas(), x: b.x0, y: b.y0, depth }
}
