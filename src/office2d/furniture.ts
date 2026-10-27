import { AGENT_ORDER, DESK_W, deskX, FURN, SPOTS, type Furn } from './layout'
import { hash, isoBox, paintPlantRef, proj, rgb, shade, type Pix, type RGB } from './raster'
import { bake, boxBounds, type Sprite } from './sprite'
import { ORIGIN } from './world'

const O = ORIGIN

/** Contexto de render que escolhe a variante de cada móvel (animação/ocupação). */
export interface RenderCtx { anim: number; occupied: Set<string>; deskOn: boolean[] }
export interface Ent { depth: number; frames: Sprite[]; pick?: (c: RenderCtx) => number }

const line = rgb('#3b2314')
const wood = { top: ['#cf9559', '#c98f52', '#c28a4c'].map(rgb), seam: rgb('#a8723c'), left: rgb('#9a6537'), right: rgb('#7c4e29'), hi: rgb('#e9b172'), dark: rgb('#5e3a1c') }
const beige = { top: rgb('#e2dccf'), left: rgb('#bcb4a5'), right: rgb('#9a9488'), line: rgb('#3a342c') }
const handle = rgb('#e6d6a6')
const frac = (n: number) => n - Math.floor(n)

function woodTop(gx: number, gy: number): RGB {
  const k = Math.floor(gy * 8)
  if (frac(gy * 8) < 0.12) return wood.seam
  if (hash(Math.floor(gx * 10), k) > 0.94) return wood.seam
  return wood.top[k % 3]
}
const woodSide = (base: RGB, v: number, h: number): RGB => (v >= h - 1 ? wood.hi : v <= 0 ? shade(base, 0.8) : base)
const plain = (base: RGB, h: number) => (_u: number, v: number): RGB => woodSide(base, v, h)
const woodStyle = (h: number) => ({ top: woodTop, left: plain(wood.left, h), right: plain(wood.right, h), outline: line, hi: wood.hi })

function drawers(base: RGB, h: number) {
  return (u: number, v: number): RGB => {
    if (v === Math.floor(h / 2)) return wood.dark
    if ((v === Math.floor(h / 4) || v === Math.floor((h * 3) / 4)) && Math.abs(u - 8) <= 1) return handle
    return woodSide(base, v, h)
  }
}

/** Mesa de escritório (monitor, teclado, caneca, luminária). `on` acende o LED/tela. */
function drawDesk(p: Pix, gx: number, gy: number, on: boolean) {
  const W = DESK_W
  isoBox(p, O, { gx: gx + 0.15, gy: gy + 0.04, w: W - 0.7, d: 0.05, z: 2, h: 11 }, { top: wood.dark, left: shade(wood.left, 0.7), right: shade(wood.right, 0.7), outline: line })
  isoBox(p, O, { gx: gx + 0.05, gy: gy + 0.05, w: 0.1, d: 0.9, h: 13 }, { top: wood.top[1], left: plain(wood.left, 13), right: plain(wood.right, 13), outline: line })
  isoBox(p, O, { gx: gx + W - 0.55, gy: gy + 0.05, w: 0.5, d: 0.9, h: 13 }, { top: wood.top[1], left: drawers(wood.left, 13), right: drawers(wood.right, 13), outline: line })
  isoBox(p, O, { gx, gy, w: W, d: 1, z: 13, h: 3 }, woodStyle(3))
  isoBox(p, O, { gx: gx + W / 2 - 0.3, gy: gy + 0.5, w: 0.5, d: 0.2, z: 16, h: 1 }, {
    top: (x, y) => (Math.floor(x * 16) % 2 === 0 && Math.floor(y * 16) % 2 === 0 ? rgb('#9d978a') : rgb('#d8d3c8')), left: rgb('#b8b2a4'), right: rgb('#948e80'), outline: beige.line,
  })
  isoBox(p, O, { gx: gx + W - 0.7, gy: gy + 0.6, w: 0.13, d: 0.13, z: 16, h: 3 }, { top: rgb('#5a3a22'), left: rgb('#f0ede6'), right: rgb('#cfcabd'), outline: beige.line })
  const lb = proj(O, gx + 0.15, gy + 0.18, 16)
  p.rect(lb[0] - 2, lb[1] - 1, 5, 2, rgb('#3a3f4a'))
  p.line(lb[0], lb[1] - 1, lb[0] + 1, lb[1] - 9, rgb('#3a3f4a'))
  p.line(lb[0] + 1, lb[1] - 9, lb[0] - 3, lb[1] - 12, rgb('#3a3f4a'))
  p.rect(lb[0] - 6, lb[1] - 14, 6, 3, rgb('#b0453a'))
  p.rect(lb[0] - 5, lb[1] - 14, 4, 1, rgb('#d9685a'))
  p.set(lb[0] - 4, lb[1] - 11, rgb('#fff0c8'))
  isoBox(p, O, { gx: gx + 0.42, gy: gy + 0.3, w: 0.22, d: 0.16, z: 16, h: 1 }, { top: beige.top, left: beige.left, right: beige.right, outline: beige.line })
  isoBox(p, O, { gx: gx + 0.5, gy: gy + 0.35, w: 0.06, d: 0.06, z: 17, h: 4 }, { top: beige.top, left: beige.left, right: beige.right, outline: beige.line })
  isoBox(p, O, { gx: gx + 0.25, gy: gy + 0.4, w: 0.56, d: 0.1, z: 20, h: 11 }, {
    top: beige.top,
    left: (u, v) => ((v === 3 || v === 5) && u > 5 && u < 14 ? rgb('#7d776b') : u === 3 && v === 8 ? (on ? rgb('#6fe09a') : rgb('#5a554b')) : beige.left),
    right: beige.right, outline: beige.line, hi: rgb('#f1ece0'),
  })
  if (on) p.glow(lb[0] - 3, lb[1] - 7, 8, rgb('#ffcf80'), 0.5)
}

/** Cadeira de escritório (origem = canto do encosto). */
function drawChair(p: Pix, cx: number, cy: number) {
  const steel = { top: rgb('#8792a8'), left: rgb('#64708a'), right: rgb('#4c566d'), outline: rgb('#232833'), hi: rgb('#a9b4c9') }
  isoBox(p, O, { gx: cx + 0.38, gy: cy + 0.3, w: 0.08, d: 0.08, z: 1, h: 8 }, steel)
  isoBox(p, O, { gx: cx + 0.15, gy: cy + 0.15, w: 0.55, d: 0.5, z: 0, h: 1 }, { ...steel, top: rgb('#3a404c') })
  isoBox(p, O, { gx: cx, gy: cy + 0.05, w: 0.8, d: 0.6, z: 9, h: 3 }, steel)
  isoBox(p, O, { gx: cx + 0.05, gy: cy, w: 0.7, d: 0.09, z: 12, h: 13 }, steel)
}

function drawTable(p: Pix, gx: number, gy: number, seats: { x: number }[]) {
  for (const [lx, ly] of [[0.08, 0.08], [W2 - 0.18, 0.08], [0.08, 0.82], [W2 - 0.18, 0.82]]) isoBox(p, O, { gx: gx + lx, gy: gy + ly, w: 0.1, d: 0.1, h: 13 }, { top: wood.dark, left: wood.dark, right: shade(wood.dark, 0.8), outline: line })
  isoBox(p, O, { gx, gy, w: W2, d: 1, z: 13, h: 3 }, woodStyle(3))
  for (const s of seats) {
    const pc = proj(O, s.x, gy + 0.3, 16)
    p.blob(pc[0], pc[1], 4, 2, rgb('#ffffff'), rgb('#f0ede6'), rgb('#cfcabd'), rgb('#7a746a'))
    p.rect(pc[0] - 1, pc[1] - 1, 2, 1, rgb('#d98a58')) // comida
    p.rect(pc[0] + 5, pc[1] - 2, 1, 2, rgb('#c8c8d0')) // garfo
  }
  const cup = proj(O, gx + W2 / 2, gy + 0.55, 16)
  p.rect(cup[0] - 1, cup[1] - 3, 3, 3, rgb('#f0ede6'))
  p.set(cup[0], cup[1] - 4, rgb('#9a6a3a'))
}
const W2 = DESK_W

function shelfFace(h: number, orient: 'long') {
  void orient
  const pal = ['#b04a3a', '#3a6ea5', '#d9b44a', '#4f8a5b', '#8a6fa5', '#d98a58', '#e8d9b0'].map(rgb)
  return (u: number, v: number): RGB => {
    const row = Math.floor(v / 9), r = v % 9
    if (r === 0 || v >= h - 1) return shade(wood.dark, v >= h - 1 ? 1.3 : 1)
    if (u % 40 === 0 && r < 8) return shade(wood.dark, 0.9)
    const bi = Math.floor(u / 3)
    const bh = 5 + Math.floor(hash(bi, row) * 3)
    if (r > bh) return rgb('#2a1c12')
    return shade(pal[Math.floor(hash(bi, row, 4) * pal.length)], r === bh ? 1.2 : u % 3 === 0 ? 0.85 : 1)
  }
}

const mk = (b: ReturnType<typeof boxBounds>, depth: number, draw: (p: Pix) => void) => bake(b, depth, draw)
const ent = (frames: Sprite[], depth: number, pick?: Ent['pick']): Ent => ({ frames, depth, pick })
const plantEnt = (f: Furn): Ent => {
  const [x, y] = proj(O, f.gx + 0.3, f.gy + 0.3)
  const b = { x0: x - 24, y0: y - 48, x1: x + 24, y1: y + 6 }
  return ent([bake(b, f.gx + f.gy + 0.6, (p) => paintPlantRef.fn(p, x, y + 4, !!f.big))], f.gx + f.gy + 0.6)
}

const arcadeScreen = (frame: number) => (u: number, v: number): RGB => {
  if (v < 5) return rgb('#1a1f33')
  if (v >= 31) return v === 33 ? rgb('#6a4a9a') : rgb('#2a1f4a')
  if (v >= 27) return u > 1 && u < 15 ? (frame === 0 ? rgb('#3a2f66') : hash(u + frame, v) > 0.45 ? rgb('#ffd24a') : rgb('#e8547a')) : rgb('#1a1f33') // marquee
  if (v >= 12 && v < 27 && u > 1 && u < 14) {
    if (frame === 0) return rgb('#0b0f14')
    const iu = u - 2, iv = v - 12
    const invader = ((iu + frame * 2) % 5 < 3 && iv % 4 < 2 && iv > 4 && iv < 12) || (iv === 2 && Math.abs(iu - 5 - frame) < 1)
    return invader ? rgb('#7fe0a0') : iv > 12 && iv < 14 && Math.abs(iu - 5 + frame) < 2 ? rgb('#7fc8e0') : rgb('#101a2a')
  }
  if (v >= 6 && v < 12) return u === 4 || u === 11 ? rgb('#e8547a') : u === 7 || u === 8 ? rgb('#d9b44a') : rgb('#3a3f58')
  return rgb('#232842')
}

/** Constrói todos os móveis do mundo como entidades ordenáveis por profundidade. */
export function buildFurniture(): Ent[] {
  const out: Ent[] = []
  const seatOf = (id: string) => SPOTS.find((s) => s.id === id)!
  const beds = ['#4a6fa5', '#a5524a', '#4f8a5b', '#8a6fa5', '#c9953a'].map(rgb)

  // cadeiras de mesa e de refeitório
  for (const s of SPOTS.filter((s) => s.act === 'desk' || s.act === 'eat')) {
    const cx = s.x - 0.4, cy = s.y - 0.55
    out.push(ent([mk(boxBounds(cx, cy, 0.8, 0.8, 30, 0, 6), s.x + s.y - 0.5, (p) => drawChair(p, cx, cy))], s.x + s.y - 0.5))
  }

  for (const f of FURN) {
    const fd = f.gx + f.w + f.gy + f.d // profundidade da quina da frente
    const cd = f.gx + f.w / 2 + f.gy + f.d / 2 // centro
    const bd = f.gx + f.gy // fundo
    switch (f.kind) {
      case 'desk': {
        const i = f.i!
        const b = boxBounds(f.gx, f.gy, f.w, f.d, 36, 0, 8)
        out.push(ent([false, true].map((on) => mk(b, fd, (p) => drawDesk(p, f.gx, f.gy, on))), fd, (c) => (c.deskOn[i] ? 1 : 0)))
        break
      }
      case 'table': {
        const seats = SPOTS.filter((s) => s.act === 'eat' && s.id.startsWith('eat:') && Math.floor(Number(s.id.split(':')[1]) / 2) === f.i)
        out.push(ent([mk(boxBounds(f.gx, f.gy, f.w, f.d, 22, 0, 8), fd, (p) => drawTable(p, f.gx, f.gy, seats))], fd))
        break
      }
      case 'counter': {
        const b = boxBounds(f.gx, f.gy, f.w, f.d, 34, 0, 8)
        out.push(ent([mk(b, bd + 1, (p) => {
          const cab = { top: rgb('#d8d0c4'), outline: rgb('#2e241c'), hi: rgb('#f2ece0'), left: (u: number, v: number) => (v === 13 ? rgb('#f2ece0') : u % 16 === 0 ? rgb('#4a3626') : v === 6 && u % 16 > 5 && u % 16 < 11 ? handle : rgb('#7a5a3c')), right: rgb('#5a4430') }
          isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, h: 14 }, cab)
          for (const x of [17.9, 19.9]) { // máquinas de café
            isoBox(p, O, { gx: x, gy: f.gy + 0.25, w: 0.6, d: 0.5, z: 14, h: 10 }, { top: rgb('#4a4f5c'), left: (u, v) => (v === 6 && u > 3 && u < 8 ? rgb('#e8547a') : v === 3 ? rgb('#2a2f3a') : rgb('#6a7080')), right: rgb('#3a3f4c'), outline: rgb('#1a1d24'), hi: rgb('#8a90a0') })
          }
          const sink = proj(O, 22.6, f.gy + 0.5, 14)
          p.blob(sink[0], sink[1], 6, 2, rgb('#9aa0ac'), rgb('#7a808c'), rgb('#5a606c'), rgb('#2a2f3a'))
          p.rect(sink[0] - 1, sink[1] - 7, 2, 5, rgb('#b8bec8'))
        })], bd + 1))
        break
      }
      case 'fridge':
        out.push(ent([mk(boxBounds(f.gx, f.gy, f.w, f.d, 38, 0, 6), bd + 1, (p) => isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, h: 38 }, { top: rgb('#dfe3ea'), left: (u, v) => (v === 25 ? rgb('#8a909c') : (u === 4 && v > 28 && v < 34) || (u === 4 && v > 8 && v < 18) ? rgb('#5a606c') : v >= 37 ? rgb('#f4f6fa') : rgb('#c9ced8')), right: rgb('#a4aab6'), outline: rgb('#2a2f3a'), hi: rgb('#f4f6fa') }))], bd + 1))
        break
      case 'shelf': {
        const long = f.d > f.w
        const h = 30
        const face = shelfFace(h, 'long')
        out.push(ent([mk(boxBounds(f.gx, f.gy, f.w, f.d, h, 0, 6), long ? cd : bd + 1, (p) => isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, h }, { top: wood.top[0], left: long ? rgb('#5a3a22') : face, right: long ? face : rgb('#5a3a22'), outline: line, hi: wood.hi }))], long ? cd : bd + 1))
        break
      }
      case 'sofa': {
        const i = f.i!
        const seat = seatOf(`read:${i}`)
        const lea = { top: rgb('#c96a3b'), left: rgb('#9a4624'), right: rgb('#7a371b'), outline: rgb('#3a1a0c'), hi: rgb('#e38a58') }
        const seam = (base: RGB) => (u: number, v: number): RGB => (v === 0 ? shade(base, 0.8) : u % 16 === 0 ? shade(base, 0.82) : base)
        const L = { ...lea, left: seam(lea.left), right: seam(lea.right) }
        const b = boxBounds(f.gx - 0.1, f.gy, f.w + 0.3, f.d, 24, 0, 6)
        const sd = seat.x + seat.y
        out.push(ent([mk(b, sd - 0.3, (p) => {
          isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: 0.28, z: 5, h: 12 }, L)
          isoBox(p, O, { gx: f.gx, gy: f.gy + 0.1, w: f.w, d: 0.5, z: 0, h: 6 }, L)
          isoBox(p, O, { gx: f.gx + 0.12, gy: f.gy + 0.2, w: f.w - 0.25, d: 0.45, z: 6, h: 2 }, { ...lea, top: rgb('#d27846'), outline: rgb('#4a2210') })
          isoBox(p, O, { gx: f.gx - 0.05, gy: f.gy, w: 0.2, d: f.d, z: 0, h: 11 }, L)
          isoBox(p, O, { gx: f.gx + f.w - 0.15, gy: f.gy, w: 0.2, d: f.d, z: 0, h: 11 }, L)
        })], sd - 0.3))
        out.push(ent([mk(b, sd + 0.3, (p) => isoBox(p, O, { gx: f.gx + 0.05, gy: f.gy + 0.6, w: f.w - 0.1, d: 0.3, z: 0, h: 8 }, { ...L, top: rgb('#d27846') }))], sd + 0.3))
        break
      }
      case 'coffeetable':
        out.push(ent([mk(boxBounds(f.gx, f.gy, f.w, f.d, 12, 0, 6), cd, (p) => {
          for (const [lx, ly] of [[0.05, 0.05], [f.w - 0.15, 0.05], [0.05, f.d - 0.15], [f.w - 0.15, f.d - 0.15]]) isoBox(p, O, { gx: f.gx + lx, gy: f.gy + ly, w: 0.1, d: 0.1, h: 6 }, { top: wood.dark, left: wood.dark, right: shade(wood.dark, 0.8), outline: line })
          isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, z: 6, h: 2 }, woodStyle(2))
          isoBox(p, O, { gx: f.gx + 0.2, gy: f.gy + 0.15, w: 0.3, d: 0.22, z: 8, h: 1 }, { top: rgb('#3f6fa8'), left: rgb('#2f5686'), right: rgb('#264670'), outline: rgb('#17283f') })
          isoBox(p, O, { gx: f.gx + 0.9, gy: f.gy + 0.2, w: 0.12, d: 0.12, z: 8, h: 3 }, { top: rgb('#5a3a22'), left: rgb('#f0ede6'), right: rgb('#cfcabd'), outline: beige.line })
        })], cd))
        break
      case 'bed': {
        const i = f.i!, D = cd
        const baseB = boxBounds(f.gx, f.gy, f.w, f.d, 24, 0, 6)
        out.push(ent([mk(baseB, D - 0.02, (p) => {
          isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, h: 5 }, woodStyle(5))
          isoBox(p, O, { gx: f.gx + 0.05, gy: f.gy + 0.05, w: f.w - 0.1, d: f.d - 0.1, z: 5, h: 3 }, { top: rgb('#ece8de'), left: rgb('#d4cfc2'), right: rgb('#b8b2a4'), outline: rgb('#4a4638') })
          isoBox(p, O, { gx: f.gx, gy: f.gy, w: 0.15, d: f.d, z: 5, h: 14 }, woodStyle(14))
          isoBox(p, O, { gx: f.gx + 0.25, gy: f.gy + 0.3, w: 0.6, d: 0.7, z: 8, h: 2 }, { top: rgb('#f8f5ee'), left: rgb('#e0dccf'), right: rgb('#c4bfb0'), outline: rgb('#5a564a') })
        })], D - 0.02))
        const bl = (hh: number) => mk(baseB, D + 0.02, (p) => isoBox(p, O, { gx: f.gx + 0.95, gy: f.gy + 0.08, w: f.w - 1.05, d: f.d - 0.16, z: 8, h: hh }, { top: beds[i], left: shade(beds[i], 0.8), right: shade(beds[i], 0.65), outline: shade(beds[i], 0.4), hi: shade(beds[i], 1.25) }))
        const id = `bed:${i}`
        out.push(ent([bl(2), bl(3)], D + 0.02, (c) => (c.occupied.has(id) ? (c.anim >> 2) & 1 : 0)))
        break
      }
      case 'arcade': {
        const id = `arcade:${f.i}`
        const b = boxBounds(f.gx, f.gy, f.w, f.d, 36, 0, 6)
        const frames = [0, 1, 2].map((fr) => mk(b, bd + 1, (p) => isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, h: 35 }, { top: rgb('#2a2f4a'), left: arcadeScreen(fr), right: (_u, v) => (v % 8 < 2 ? rgb('#e8547a') : rgb('#232842')), outline: rgb('#0e1020'), hi: rgb('#4a5080') })))
        out.push(ent(frames, bd + 1, (c) => (c.occupied.has(id) ? 1 + (c.anim & 1) : 0)))
        break
      }
      case 'foos': {
        const b = boxBounds(f.gx, f.gy, f.w, f.d, 22, 0, 10)
        out.push(ent([mk(b, cd, (p) => {
          for (const [lx, ly] of [[0.1, 0.1], [f.w - 0.25, 0.1], [0.1, f.d - 0.25], [f.w - 0.25, f.d - 0.25]]) isoBox(p, O, { gx: f.gx + lx, gy: f.gy + ly, w: 0.15, d: 0.15, h: 10 }, { top: wood.dark, left: wood.dark, right: shade(wood.dark, 0.8), outline: line })
          isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, z: 9, h: 3 }, {
            top: (x, y) => { const u = (x - f.gx) / f.w, v = (y - f.gy) / f.d; return Math.abs(u - 0.5) < 0.015 || Math.abs(Math.hypot((u - 0.5) * 2, v - 0.5) - 0.3) < 0.03 ? rgb('#e8f0e0') : (Math.floor(u * 8) % 2 ? rgb('#3f8a4f') : rgb('#4a9a5a')) },
            left: plain(wood.left, 3), right: plain(wood.right, 3), outline: line, hi: wood.hi,
          })
          for (const rx of [0.45, 0.95, 1.4, 1.9]) {
            isoBox(p, O, { gx: f.gx + rx, gy: f.gy - 0.25, w: 0.07, d: f.d + 0.5, z: 13, h: 1 }, { top: rgb('#c8ccd4'), left: rgb('#9aa0ac'), right: rgb('#7a808c'), outline: rgb('#2a2f3a') })
            const team = rx < 1.2 ? rgb('#d9453a') : rgb('#3a6ea5')
            for (const py of [0.25, 0.55, 0.85]) { const pp = proj(O, f.gx + rx + 0.03, f.gy + py, 15); p.rect(pp[0] - 1, pp[1] - 3, 3, 5, team); p.set(pp[0], pp[1] - 4, rgb('#f0d0a8')) }
            isoBox(p, O, { gx: f.gx + rx - 0.02, gy: f.gy + f.d + 0.25, w: 0.11, d: 0.12, z: 12, h: 3 }, { top: rgb('#2a2f3a'), left: rgb('#2a2f3a'), right: rgb('#1a1d24'), outline: rgb('#0e1020') })
          }
        })], cd))
        break
      }
      case 'bean': {
        const [x, y] = proj(O, f.gx + 0.5, f.gy + 0.5)
        const cols = f.i === 0 ? ['#f0954a', '#d9702f', '#a8501c'] : ['#5aa6c9', '#3a86a9', '#256680']
        out.push(ent([bake({ x0: x - 14, y0: y - 18, x1: x + 14, y1: y + 8 }, cd, (p) => {
          p.blob(x, y - 4, 11, 7, rgb(cols[0]), rgb(cols[1]), rgb(cols[2]), rgb('#2a1c18'))
          p.blob(x + 1, y - 9, 7, 5, rgb(cols[0]), rgb(cols[1]), rgb(cols[2]), rgb('#2a1c18'))
        })], cd))
        break
      }
      case 'meeting':
        out.push(ent([mk(boxBounds(f.gx, f.gy, f.w, f.d, 22, 0, 8), cd, (p) => {
          for (const [lx, ly] of [[0.3, 0.3], [f.w - 0.5, 0.3], [0.3, f.d - 0.5], [f.w - 0.5, f.d - 0.5]]) isoBox(p, O, { gx: f.gx + lx, gy: f.gy + ly, w: 0.2, d: 0.2, h: 13 }, { top: wood.dark, left: wood.dark, right: shade(wood.dark, 0.8), outline: line })
          isoBox(p, O, { gx: f.gx, gy: f.gy, w: f.w, d: f.d, z: 13, h: 3 }, woodStyle(3))
          for (const lx of [0.6, 1.9, 3.1]) isoBox(p, O, { gx: f.gx + lx, gy: f.gy + 0.6, w: 0.4, d: 0.3, z: 16, h: 1 }, { top: rgb('#cfd3da'), left: rgb('#a4a8b0'), right: rgb('#848890'), outline: rgb('#2a2f3a') })
        })], cd))
        break
      case 'plant':
        out.push(plantEnt(f))
        break
    }
  }
  void AGENT_ORDER; void deskX
  return out.sort((a, b) => a.depth - b.depth)
}
