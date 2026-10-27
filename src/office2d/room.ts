import { hash, mix, Pix, proj, rgb, shade, type Origin, type RGB } from './raster'

/** Sala 6×5 tiles. Largura = (6+5)·16 = 176 px; escala inteira 2× cabe em 360 px. */
export const SCENE_W = 176
export const SCENE_H = 156
export const ORIGIN: Origin = { ox: 80, oy: 58 }
export const COLS = 6
export const ROWS = 5
const WALL_H = 56
const SLAB = 8

export const C = {
  line: rgb('#2a1c18'),
  wood: ['#a8703c', '#b98048', '#c78e52', '#9c6535'].map(rgb),
  seam: rgb('#6b4226'),
  brick: ['#9a523d', '#a95e45', '#8a4733', '#b5694e'].map(rgb),
  mortar: rgb('#bfb09f'),
  capLight: rgb('#d9d0c1'),
  capDark: rgb('#a39a8b'),
  base: rgb('#4a2f1e'),
  frame: rgb('#26262b'),
  frameHi: rgb('#43434b'),
  stone: rgb('#b9b0a2'),
  warm: rgb('#ffd28a'),
  slabL: rgb('#7a4d2a'),
  slabR: rgb('#5d3a1f'),
}

const frac = (n: number) => n - Math.floor(n)

/** Piso de tábuas: 4 fileiras por tile, juntas deslocadas, 4 tons de madeira. */
function floorColor(fx: number, fy: number): RGB {
  const row = Math.floor(fy * 4)
  const off = hash(row) * 3
  const seg = Math.floor((fx + off) / 1.5)
  const f = frac(fy * 4)
  if (f < 0.2) return C.seam
  if (frac((fx + off) / 1.5) < 0.045) return C.seam
  const base = C.wood[Math.floor(hash(row, seg) * 4)]
  if (f < 0.42) return shade(base, 1.1) // realce logo abaixo da fresta
  if (hash(Math.floor(fx * 14), row, 3) > 0.93) return shade(base, 0.9) // veio
  return base
}

function paintFloor(p: Pix) {
  const { ox, oy } = ORIGIN
  const T = proj(ORIGIN, 0, 0), R = proj(ORIGIN, COLS, 0), B = proj(ORIGIN, COLS, ROWS), L = proj(ORIGIN, 0, ROWS)
  p.poly([T, R, B, L], (x, y) => {
    const X = (x - ox + 0.5) / 16, Y = (y - oy + 0.5) / 8
    return floorColor((X + Y) / 2, (Y - X) / 2)
  })
  // espessura da laje
  p.poly([L, B, [B[0], B[1] + SLAB], [L[0], L[1] + SLAB]], (x, y) => (y - L[1] - (x - L[0]) / 2 < 2 ? shade(C.slabL, 1.15) : C.slabL))
  p.poly([B, R, [R[0], R[1] + SLAB], [B[0], B[1] + SLAB]], (x, y) => (y - R[1] - (R[0] - x) / 2 < 2 ? shade(C.slabR, 1.15) : C.slabR))
  p.line(L[0], L[1], B[0], B[1], C.line)
  p.line(B[0], B[1], R[0], R[1], C.line)
  p.line(L[0], L[1] + SLAB, B[0], B[1] + SLAB, C.line)
  p.line(B[0], B[1] + SLAB, R[0], R[1] + SLAB, C.line)
  p.line(L[0], L[1], L[0], L[1] + SLAB, C.line)
  p.line(B[0], B[1], B[0], B[1] + SLAB, C.line)
  p.line(R[0], R[1], R[0], R[1] + SLAB, C.line)
}

type WallPainter = (u: number, v: number) => RGB | null

/** Janela grande com esquadria escura e a cidade ao fundo. */
function windowPainter(u0: number, u1: number, v0: number, v1: number): WallPainter {
  const mid = Math.floor((u0 + u1) / 2)
  return (u, v) => {
    if (u < u0 - 2 || u > u1 + 1 || v < v0 - 3 || v > v1 + 2) return null
    if (v < v0) return v >= v0 - 2 ? C.stone : v === v0 - 3 ? C.line : null // peitoril
    if (u < u0 || u > u1 || v > v1) return u < u0 - 1 || u > u1 + 0 ? C.line : C.frame
    if (u <= u0 + 1 || u >= u1 - 1 || v >= v1 - 1 || v <= v0 + 1) return C.frame
    if (Math.abs(u - mid) <= 1 || Math.abs(v - (v0 + Math.floor((v1 - v0) * 0.55))) <= 0) return C.frameHi
    // céu e prédios distantes
    const h = v - v0
    const bw = 7, bi = Math.floor((u - u0) / bw)
    const bh = 5 + Math.floor(hash(bi, 4) * 12)
    if (h < bh) {
      const lit = hash(u, v, 9) > 0.86 && (u - u0) % bw > 0 && (u - u0) % bw < bw - 1
      if (lit) return rgb('#ecdca0')
      return [rgb('#7a96ab'), rgb('#6a8499'), rgb('#58707f')][bi % 3]
    }
    return mix(rgb('#9fcbe2'), rgb('#d6ecf6'), 1 - (v - v0) / (v1 - v0))
  }
}

/** Painel digital na parede, com "código" e um gráfico. */
function panelPainter(u0: number, v0: number, w: number, h: number, mirror = false): WallPainter {
  return (u0raw, v) => {
    const u = mirror ? 2 * u0 + w - 1 - u0raw : u0raw
    if (u < u0 || u >= u0 + w || v < v0 || v >= v0 + h) return null
    if (u === u0 || u === u0 + w - 1 || v === v0 || v === v0 + h - 1) return C.frame
    if (u === u0 + 1 || v === v0 + 1 || u === u0 + w - 2 || v === v0 + h - 2) return C.frameHi
    const lu = u - u0 - 3, lv = h - 1 - (v - v0) - 3, lb = v - v0 - 3
    if (lu < w / 2 - 2 && lv >= 0) {
      const line = Math.floor(lv / 3)
      if (lv % 3 === 0 && lu < 4 + hash(line, 1) * (w / 2 - 8)) return line % 3 === 0 ? rgb('#7fe0a0') : rgb('#4fb078')
    } else if (lu > w / 2) {
      const bar = Math.floor((lu - w / 2) / 3)
      const bh = 2 + Math.floor(hash(bar, 6) * (h - 8))
      if (lb >= 0 && lb < bh && (lu - w / 2) % 3 < 2) return rgb('#7fc8e0')
    }
    return rgb('#0e2a26')
  }
}

function sconcePainter(uc: number, vc: number): WallPainter {
  return (u, v) => {
    const du = u - uc, dv = v - vc
    if (Math.abs(du) <= 1 && dv >= -1 && dv <= 3) return dv >= 1 ? C.warm : rgb('#fff0c8')
    if (Math.abs(du) <= 2 && dv >= -3 && dv <= -2) return C.line
    if (du === 0 && dv === -1) return C.line
    return null
  }
}

/** Parede de tijolo aparente (u = px ao longo da parede, v = altura em px). */
function brickAt(u: number, v: number, dark: number): RGB {
  const row = Math.floor(v / 4)
  const uu = u + (row % 2) * 5
  const bi = Math.floor(uu / 10)
  if (v % 4 === 0) return shade(C.mortar, dark * 0.78)
  if (uu % 10 === 0) return shade(C.mortar, dark * 0.9)
  const base = C.brick[Math.floor(hash(bi, row) * 4)]
  const c = v % 4 === 3 ? shade(base, 1.12) : base
  return shade(c, dark)
}

function paintWalls(p: Pix) {
  const { ox, oy } = ORIGIN
  const decos: { tr: WallPainter[]; tl: WallPainter[] } = {
    tr: [windowPainter(30, 80, 16, 48), sconcePainter(14, 38), sconcePainter(90, 38)],
    tl: [panelPainter(20, 20, 40, 26, true), sconcePainter(10, 38), sconcePainter(70, 38)],
  }
  const wall = (x: number, edge: number, u: number, list: WallPainter[], dark: number) => {
    for (let v = 0; v < WALL_H; v++) {
      const y = edge - v
      let c: RGB | null = null
      for (const d of list) {
        c = d(u, v)
        if (c) break
      }
      if (!c) c = v < 3 ? shade(C.base, dark * (v === 2 ? 1.25 : 1)) : brickAt(u, v, dark)
      if (v >= WALL_H - 3) c = v === WALL_H - 1 ? C.line : shade(v === WALL_H - 2 ? C.capLight : C.capDark, dark)
      p.set(x, y, c)
    }
  }
  for (let x = ox; x < ox + COLS * 16; x++) wall(x, oy + Math.floor((x - ox) / 2) - 1, x - ox, decos.tr, 1)
  for (let x = ox - ROWS * 16; x < ox; x++) wall(x, oy + Math.floor((ox - 1 - x) / 2) - 1, ox - 1 - x, decos.tl, 0.8)
  for (let v = 0; v < WALL_H; v++) {
    p.set(ox, oy - v - 1, C.line)
    p.set(ox + COLS * 16 - 1, oy + COLS * 8 - v - 2, C.line)
    p.set(ox - ROWS * 16, oy + ROWS * 8 - v - 1, C.line)
  }
}

/** Planta em vaso: folhas em elipses com 3 tons, vaso em degradê de terracota. */
export function paintPlant(p: Pix, x: number, y: number, big = false) {
  const lo = rgb('#82c985'), mi = rgb('#4a9a4f'), da = rgb('#2f6b3a'), ol = rgb('#1f3f27')
  const potL = rgb('#d98a58'), potM = rgb('#b5653a'), potD = rgb('#8f4a28')
  // vaso (trapézio)
  for (let r = 0; r < 8; r++) {
    const half = 6 - Math.floor(r / 3) - (r > 5 ? 1 : 0)
    for (let i = -half; i <= half; i++) p.set(x + i, y - 8 + r, i === -half || i === half ? C.line : r < 2 ? potL : i > half - 3 ? potD : potM)
  }
  for (let i = -6; i <= 6; i++) p.set(x + i, y - 8, C.line)
  p.rect(x - 5, y - 8, 11, 1, rgb('#5a3a22'))
  // folhas
  const leaves: [number, number, number, number][] = big
    ? [[0, -26, 5, 8], [-8, -20, 6, 5], [8, -20, 6, 5], [-5, -14, 5, 5], [5, -14, 5, 5], [0, -18, 5, 6]]
    : [[0, -17, 4, 6], [-6, -13, 5, 4], [6, -13, 5, 4], [0, -11, 4, 4]]
  for (const [dx, dy, rx, ry] of leaves) p.blob(x + dx, y + dy, rx, ry, lo, mi, da, ol)
}

export function buildRoom(): Pix {
  const p = new Pix(SCENE_W, SCENE_H)
  paintFloor(p)
  paintWalls(p)
  // luz da janela no piso (retalho pontilhado)
  const lightPatch = [proj(ORIGIN, 2.6, 0.15), proj(ORIGIN, 4.7, 0.15), proj(ORIGIN, 5.5, 2.4), proj(ORIGIN, 3.4, 2.4)]
  p.poly(lightPatch, (x, y) => {
    const c = p.get(x, y)
    const edge = (x + y) % 2 === 0
    return c ? shade(c, edge ? 1.06 : 1.14) : null
  })
  // luz quente das arandelas nas paredes
  p.glow(ORIGIN.ox + 14, ORIGIN.oy + 7 - 38, 7, C.warm, 0.6)
  p.glow(ORIGIN.ox + 90, ORIGIN.oy + 45 - 38, 7, C.warm, 0.6)
  p.glow(ORIGIN.ox - 10, ORIGIN.oy + 5 - 38, 7, C.warm, 0.6)
  p.glow(ORIGIN.ox - 70, ORIGIN.oy + 35 - 38, 7, C.warm, 0.6)
  const b = proj(ORIGIN, 5.75, 0.45)
  paintPlant(p, b[0], b[1] + 4, true)
  return p
}
