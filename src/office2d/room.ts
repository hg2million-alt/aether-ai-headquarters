import { textPixel, textWidth } from './font'
import { hash, mix, paintPlantRef, Pix, proj, rgb, shade, type RGB } from './raster'
import { COLS, ORIGIN, ROOMS, ROWS, SLAB, WALL_H, WORLD_H, WORLD_W, type RoomId } from './world'

export { ORIGIN, COLS, ROWS, WORLD_W, WORLD_H }

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

/** Tinta de piso por sala: madeira (trabalho), azulejo xadrez (refeitório), carpete (descanso), borracha (games). */
const FLOORS: Record<RoomId, (fx: number, fy: number) => RGB> = {
  work(fx, fy) {
    const row = Math.floor(fy * 4), off = hash(row) * 3, seg = Math.floor((fx + off) / 1.5), f = frac(fy * 4)
    if (f < 0.2 || frac((fx + off) / 1.5) < 0.045) return C.seam
    const base = C.wood[Math.floor(hash(row, seg) * 4)]
    if (f < 0.42) return shade(base, 1.1)
    return hash(Math.floor(fx * 14), row, 3) > 0.93 ? shade(base, 0.9) : base
  },
  dine(fx, fy) {
    const tx = Math.floor(fx), ty = Math.floor(fy)
    if (frac(fx) < 0.04 || frac(fy) < 0.07) return rgb('#a89878') // rejunte
    const base = (tx + ty) % 2 === 0 ? rgb('#eadfc6') : rgb('#cdb892')
    return hash(Math.floor(fx * 8), Math.floor(fy * 8), tx * 7 + ty) > 0.9 ? shade(base, 0.94) : base
  },
  rest(fx, fy) {
    const inRug = fx > 3 && fx < 9 && fy > 12 && fy < 17.5
    const base = inRug ? rgb('#7a5a86') : rgb('#4b5f7a')
    if (inRug && (Math.min(fx - 3, 9 - fx, fy - 12, 17.5 - fy) < 0.2)) return rgb('#e0c98a')
    const n = hash(Math.floor(fx * 6), Math.floor(fy * 6))
    return n > 0.8 ? shade(base, 1.1) : n < 0.15 ? shade(base, 0.88) : base
  },
  play(fx, fy) {
    const tx = Math.floor(fx / 2), ty = Math.floor(fy / 2)
    const base = (tx + ty) % 2 === 0 ? rgb('#3f6f73') : rgb('#4d8184')
    if (frac(fx / 2) < 0.03 || frac(fy / 2) < 0.05) return rgb('#2c4f52')
    return hash(Math.floor(fx * 6), Math.floor(fy * 6)) > 0.88 ? shade(base, 1.08) : base
  },
}

/** Nome de cada sala pintado no piso (letras isométricas de 0,22 tile). */
const LABELS: { room: RoomId; text: string; gx: number; gy: number; color: RGB }[] = [
  { room: 'work', text: 'TRABALHO', gx: 0.8, gy: 7.6, color: rgb('#ecd9ae') },
  { room: 'dine', text: 'REFEITORIO', gx: 15.2, gy: 7.6, color: rgb('#b0613a') },
  { room: 'rest', text: 'DESCANSO', gx: 0.8, gy: 18.5, color: rgb('#c6d4ea') },
  { room: 'play', text: 'GAMES', gx: 11.2, gy: 18.5, color: rgb('#f4eaa6') },
]
const K = 0.22

function floorColor(fx: number, fy: number): RGB {
  const room = ROOMS.find((r) => fx >= r.x0 && fx < r.x1 && fy >= r.y0 && fy < r.y1)
  if (!room) return rgb('#000000')
  for (const l of LABELS) {
    if (l.room === room.id && textPixel(l.text, Math.floor((fx - l.gx) / K), Math.floor((fy - l.gy) / K))) return l.color
  }
  return FLOORS[room.id](fx, fy)
}

function paintFloor(p: Pix) {
  const { ox, oy } = ORIGIN
  const T = proj(ORIGIN, 0, 0), R = proj(ORIGIN, COLS, 0), B = proj(ORIGIN, COLS, ROWS), L = proj(ORIGIN, 0, ROWS)
  p.poly([T, R, B, L], (x, y) => {
    const X = (x - ox + 0.5) / 16, Y = (y - oy + 0.5) / 8
    return floorColor((X + Y) / 2, (Y - X) / 2)
  })
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

function windowPainter(u0: number, u1: number, v0: number, v1: number): WallPainter {
  const mid = Math.floor((u0 + u1) / 2)
  return (u, v) => {
    if (u < u0 - 2 || u > u1 + 1 || v < v0 - 3 || v > v1 + 2) return null
    if (v < v0) return v >= v0 - 2 ? C.stone : v === v0 - 3 ? C.line : null
    if (u < u0 || u > u1 || v > v1) return u < u0 - 1 || u > u1 + 0 ? C.line : C.frame
    if (u <= u0 + 1 || u >= u1 - 1 || v >= v1 - 1 || v <= v0 + 1) return C.frame
    if (Math.abs(u - mid) <= 1 || Math.abs(v - (v0 + Math.floor((v1 - v0) * 0.55))) <= 0) return C.frameHi
    if ((u1 - u0) > 60 && Math.abs(u - (u0 + Math.floor((u1 - u0) / 4))) <= 0) return C.frameHi
    const h = v - v0, bw = 7, bi = Math.floor((u - u0 + u0 * 3) / bw)
    const bh = 5 + Math.floor(hash(bi, 4) * 12)
    if (h < bh) {
      const lit = hash(u, v, 9) > 0.86 && (u - u0) % bw > 0 && (u - u0) % bw < bw - 1
      if (lit) return rgb('#ecdca0')
      return [rgb('#7a96ab'), rgb('#6a8499'), rgb('#58707f')][bi % 3]
    }
    return mix(rgb('#9fcbe2'), rgb('#d6ecf6'), 1 - (v - v0) / (v1 - v0))
  }
}

function panelPainter(u0: number, v0: number, w: number, h: number, mirror = false): WallPainter {
  return (uRaw, v) => {
    const u = mirror ? 2 * u0 + w - 1 - uRaw : uRaw
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

/** Quadro/poster simples na parede. */
function posterPainter(u0: number, v0: number, w: number, h: number, c1: string, c2: string): WallPainter {
  return (u, v) => {
    if (u < u0 || u >= u0 + w || v < v0 || v >= v0 + h) return null
    if (u === u0 || u === u0 + w - 1 || v === v0 || v === v0 + h - 1) return rgb('#3b2a1e')
    const t = (v - v0) / h
    return hash(u, v, 5) > 0.93 ? rgb('#f4efe2') : mix(rgb(c1), rgb(c2), t)
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

function brickAt(u: number, v: number, dark: number): RGB {
  const row = Math.floor(v / 4), uu = u + (row % 2) * 5, bi = Math.floor(uu / 10)
  if (v % 4 === 0) return shade(C.mortar, dark * 0.78)
  if (uu % 10 === 0) return shade(C.mortar, dark * 0.9)
  const base = C.brick[Math.floor(hash(bi, row) * 4)]
  return shade(v % 4 === 3 ? shade(base, 1.12) : base, dark)
}

/** Decoração das duas paredes de tijolo (u em px ao longo da parede = tiles × 16). */
const SCONCES_TR = [16, 112, 224, 336, 464]
const SCONCES_TL = [16, 144, 176, 304]
const WALL_TR: WallPainter[] = [
  windowPainter(32, 96, 16, 48), windowPainter(128, 192, 16, 48), windowPainter(256, 320, 16, 48), windowPainter(384, 448, 16, 48),
  ...SCONCES_TR.map((u) => sconcePainter(u, 38)),
]
const WALL_TL: WallPainter[] = [
  panelPainter(48, 20, 64, 28, true), windowPainter(184, 248, 16, 48), posterPainter(268, 22, 20, 26, '#d98a58', '#7a5a86'), posterPainter(294, 22, 14, 18, '#7fb2c9', '#3f6f73'),
  ...SCONCES_TL.map((u) => sconcePainter(u, 38)),
]

function paintWalls(p: Pix) {
  const { ox, oy } = ORIGIN
  const wall = (x: number, edge: number, u: number, list: WallPainter[], dark: number) => {
    for (let v = 0; v < WALL_H; v++) {
      let c: RGB | null = null
      for (const d of list) {
        c = d(u, v)
        if (c) break
      }
      if (!c) c = v < 3 ? shade(C.base, dark * (v === 2 ? 1.25 : 1)) : brickAt(u, v, dark)
      if (v >= WALL_H - 3) c = v === WALL_H - 1 ? C.line : shade(v === WALL_H - 2 ? C.capLight : C.capDark, dark)
      p.set(x, edge - v, c)
    }
  }
  for (let x = ox; x < ox + COLS * 16; x++) wall(x, oy + Math.floor((x - ox) / 2) - 1, x - ox, WALL_TR, 1)
  for (let x = ox - ROWS * 16; x < ox; x++) wall(x, oy + Math.floor((ox - 1 - x) / 2) - 1, ox - 1 - x, WALL_TL, 0.8)
  for (let v = 0; v < WALL_H; v++) {
    p.set(ox, oy - v - 1, C.line)
    p.set(ox + COLS * 16 - 1, oy + COLS * 8 - v - 2, C.line)
    p.set(ox - ROWS * 16, oy + ROWS * 8 - v - 1, C.line)
  }
  // brilho quente das arandelas
  for (const u of SCONCES_TR) p.glow(ox + u, oy + Math.floor(u / 2) - 1 - 38, 7, C.warm, 0.6)
  for (const u of SCONCES_TL) p.glow(ox - 1 - u, oy + Math.floor(u / 2) - 1 - 38, 7, C.warm, 0.6)
}

/** Planta em vaso: folhas em elipses de 3 tons. */
export function paintPlant(p: Pix, x: number, y: number, big = false) {
  const lo = rgb('#82c985'), mi = rgb('#4a9a4f'), da = rgb('#2f6b3a'), ol = rgb('#1f3f27')
  const potL = rgb('#d98a58'), potM = rgb('#b5653a'), potD = rgb('#8f4a28')
  for (let r = 0; r < 8; r++) {
    const half = 6 - Math.floor(r / 3) - (r > 5 ? 1 : 0)
    for (let i = -half; i <= half; i++) p.set(x + i, y - 8 + r, i === -half || i === half ? C.line : r < 2 ? potL : i > half - 3 ? potD : potM)
  }
  for (let i = -6; i <= 6; i++) p.set(x + i, y - 8, C.line)
  p.rect(x - 5, y - 8, 11, 1, rgb('#5a3a22'))
  const leaves: [number, number, number, number][] = big
    ? [[0, -26, 5, 8], [-8, -20, 6, 5], [8, -20, 6, 5], [-5, -14, 5, 5], [5, -14, 5, 5], [0, -18, 5, 6]]
    : [[0, -17, 4, 6], [-6, -13, 5, 4], [6, -13, 5, 4], [0, -11, 4, 4]]
  for (const [dx, dy, rx, ry] of leaves) p.blob(x + dx, y + dy, rx, ry, lo, mi, da, ol)
}

paintPlantRef.fn = paintPlant

/** Fundo do mundo inteiro: pisos das 4 salas, paredes de tijolo com janelas, laje. */
export function buildBackground(): Pix {
  const p = new Pix(WORLD_W, WORLD_H)
  paintFloor(p)
  paintWalls(p)
  return p
}

export { textWidth }
