/** Rasterizador mínimo para pixel art: tudo é escrito pixel a pixel (sem antialiasing). */
export type RGB = [number, number, number]

const cache = new Map<string, RGB>()
export function rgb(hex: string): RGB {
  let c = cache.get(hex)
  if (!c) {
    c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
    cache.set(hex, c)
  }
  return c
}

export const shade = (c: RGB, k: number): RGB => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))]
export const mix = (a: RGB, b: RGB, t: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]

import { hash } from './rand'
export { hash }

/** Camada de pixels RGBA. */
export class Pix {
  readonly data: Uint8ClampedArray
  /** `offX/offY`: posição do canto superior esquerdo no mundo (as coordenadas de desenho são do mundo). */
  constructor(readonly w: number, readonly h: number, readonly offX = 0, readonly offY = 0) {
    this.data = new Uint8ClampedArray(w * h * 4)
  }
  set(x: number, y: number, c: RGB, a = 255) {
    x -= this.offX; y -= this.offY
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a
  }
  get(x: number, y: number): RGB | null {
    x -= this.offX; y -= this.offY
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null
    const i = (y * this.w + x) * 4
    return this.data[i + 3] === 0 ? null : [this.data[i], this.data[i + 1], this.data[i + 2]]
  }
  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c)
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.set(x0, y0, c)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) { err += dy; x0 += sx }
      if (e2 <= dx) { err += dx; y0 += sy }
    }
  }
  /** Preenche polígono convexo testando o centro de cada pixel; `fn` pode variar a cor por pixel. */
  poly(pts: [number, number][], fn: (x: number, y: number) => RGB | null) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5
        let pos = 0, neg = 0
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length]
          const cr = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0])
          if (cr > 0.001) pos++
          else if (cr < -0.001) neg++
        }
        if (pos === 0 || neg === 0) {
          const c = fn(x, y)
          if (c) this.set(x, y, c)
        }
      }
    }
  }
  /** Elipse com contorno e sombreamento de 3 tons (luz vinda de cima à esquerda). */
  blob(cx: number, cy: number, rx: number, ry: number, light: RGB, mid: RGB, dark: RGB, outline: RGB) {
    for (let y = -ry - 1; y <= ry + 1; y++) {
      for (let x = -rx - 1; x <= rx + 1; x++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry)
        if (d > 1.18) continue
        if (d > 0.86) { this.set(cx + x, cy + y, outline); continue }
        const lit = (-x - y * 1.4) / (rx + ry)
        this.set(cx + x, cy + y, lit > 0.22 ? light : lit < -0.18 ? dark : mid)
      }
    }
  }
  /** Brilho pontilhado (Bayer 4×4): clareia/aquece sem gradiente suave. */
  glow(cx: number, cy: number, r: number, c: RGB, strength = 1) {
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
    for (let y = -r; y <= r; y++) {
      for (let x = -r * 2; x <= r * 2; x++) {
        const d = Math.sqrt((x / 2) * (x / 2) + y * y) / r
        if (d >= 1) continue
        const t = (1 - d) * strength
        if (t * 16 > bayer[((cy + y) & 3) * 4 + ((cx + x) & 3)]) {
          const px = cx + x, py = cy + y
          const old = this.get(px, py)
          if (old) this.set(px, py, mix(old, c, 0.35))
          else this.set(px, py, c, 90)
        }
      }
    }
  }
  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = this.w
    c.height = this.h
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(this.w, this.h)
    img.data.set(this.data)
    ctx.putImageData(img, 0, 0)
    return c
  }
}

import { proj, TILE_W, TILE_H, type Origin } from './iso'
export { proj, TILE_W, TILE_H, type Origin }

export interface BoxStyle {
  top: RGB | ((gx: number, gy: number) => RGB)
  left: RGB | ((u: number, v: number) => RGB | null)
  right: RGB | ((u: number, v: number) => RGB | null)
  outline: RGB
  hi?: RGB
}

/**
 * Caixa isométrica em coordenadas de tile (gx, gy) e altura em pixels. A face "left" olha para +gy,
 * a "right" para +gx. As funções de face recebem (u, v): px ao longo da face e altura em px.
 */
export function isoBox(p: Pix, o: Origin, b: { gx: number; gy: number; w: number; d: number; h: number; z?: number }, s: BoxStyle) {
  const z = b.z ?? 0
  const A = proj(o, b.gx, b.gy, z + b.h), B = proj(o, b.gx + b.w, b.gy, z + b.h)
  const C = proj(o, b.gx + b.w, b.gy + b.d, z + b.h), D = proj(o, b.gx, b.gy + b.d, z + b.h)
  const Cb = proj(o, b.gx + b.w, b.gy + b.d, z), Db = proj(o, b.gx, b.gy + b.d, z), Bb = proj(o, b.gx + b.w, b.gy, z)
  const topZ = z + b.h
  p.poly([A, B, C, D], (x, y) => {
    if (typeof s.top !== 'function') return s.top
    const X = (x - o.ox + 0.5) / (TILE_W / 2), Y = (y + topZ - o.oy + 0.5) / (TILE_H / 2)
    return s.top((X + Y) / 2, (Y - X) / 2)
  })
  p.poly([D, C, Cb, Db], (x, y) => {
    const u = x - D[0], v = Db[1] + (x - Db[0]) / 2 - y
    return typeof s.left === 'function' ? s.left(u, Math.floor(v)) : s.left
  })
  p.poly([B, C, Cb, Bb], (x, y) => {
    const u = B[0] - x, v = Bb[1] + (Bb[0] - x) / 2 - y
    return typeof s.right === 'function' ? s.right(u, Math.floor(v)) : s.right
  })
  // arestas: contorno externo + realce nas bordas superiores
  const hex = [A, B, Bb, Cb, Db, D]
  for (let i = 0; i < hex.length; i++) p.line(hex[i][0], hex[i][1], hex[(i + 1) % hex.length][0], hex[(i + 1) % hex.length][1], s.outline)
  p.line(D[0], D[1], C[0], C[1], s.hi ?? s.outline)
  p.line(C[0], C[1], B[0], B[1], s.hi ?? s.outline)
  p.line(C[0], C[1], Cb[0], Cb[1], s.outline)
}

/** Gancho para a função de planta (evita dependência circular room ↔ furniture). */
export const paintPlantRef: { fn: (p: Pix, x: number, y: number, big: boolean) => void } = { fn: () => {} }
