import { hash, isoBox, Pix, proj, rgb, shade, type RGB } from './raster'
import { C, ORIGIN, paintPlant, SCENE_H, SCENE_W } from './room'

const O = ORIGIN
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

/** Móvel com gavetas: linhas horizontais e puxadores. */
function drawers(base: RGB, h: number) {
  return (u: number, v: number): RGB => {
    if (v === Math.floor(h / 2)) return wood.dark
    if ((v === Math.floor(h / 4) || v === Math.floor((h * 3) / 4)) && Math.abs(u - 8) <= 1) return handle
    return woodSide(base, v, h)
  }
}

export interface DeskOpts { gx: number; gy: number; on: boolean; w?: number }

/** Mesa de escritório completa: tampo, pedestal com gavetas, teclado, monitor, caneca e luminária. */
export function buildDesk({ gx, gy, on, w: W = 1.6 }: DeskOpts): Pix {
  const p = new Pix(SCENE_W, SCENE_H)
  // estrutura sob o tampo
  isoBox(p, O, { gx: gx + 0.15, gy: gy + 0.04, w: W - 0.7, d: 0.05, z: 2, h: 11 }, { top: wood.dark, left: shade(wood.left, 0.7), right: shade(wood.right, 0.7), outline: line })
  isoBox(p, O, { gx: gx + 0.05, gy: gy + 0.05, w: 0.1, d: 0.9, h: 13 }, { top: wood.top[1], left: (_u, v) => woodSide(wood.left, v, 13), right: (_u, v) => woodSide(wood.right, v, 13), outline: line })
  isoBox(p, O, { gx: gx + W - 0.55, gy: gy + 0.05, w: 0.5, d: 0.9, h: 13 }, { top: wood.top[1], left: drawers(wood.left, 13), right: drawers(wood.right, 13), outline: line })
  // tampo
  isoBox(p, O, { gx, gy, w: W, d: 1, z: 13, h: 3 }, { top: woodTop, left: (_u, v) => woodSide(wood.left, v, 3), right: (_u, v) => woodSide(wood.right, v, 3), outline: line, hi: wood.hi })

  // teclado
  isoBox(p, O, { gx: gx + W / 2 - 0.3, gy: gy + 0.5, w: 0.5, d: 0.2, z: 16, h: 1 }, {
    top: (x, y) => (Math.floor(x * 16) % 2 === 0 && Math.floor(y * 16) % 2 === 0 ? rgb('#9d978a') : rgb('#d8d3c8')),
    left: rgb('#b8b2a4'), right: rgb('#948e80'), outline: beige.line,
  })
  // caneca
  isoBox(p, O, { gx: gx + W - 0.7, gy: gy + 0.6, w: 0.13, d: 0.13, z: 16, h: 3 }, { top: rgb('#5a3a22'), left: rgb('#f0ede6'), right: rgb('#cfcabd'), outline: beige.line })
  // luminária de mesa
  const lb = proj(O, gx + 0.15, gy + 0.18, 16)
  p.rect(lb[0] - 2, lb[1] - 1, 5, 2, rgb('#3a3f4a'))
  p.line(lb[0], lb[1] - 1, lb[0] + 1, lb[1] - 9, rgb('#3a3f4a'))
  p.line(lb[0] + 1, lb[1] - 9, lb[0] - 3, lb[1] - 12, rgb('#3a3f4a'))
  p.rect(lb[0] - 6, lb[1] - 14, 6, 3, rgb('#b0453a'))
  p.rect(lb[0] - 5, lb[1] - 14, 4, 1, rgb('#d9685a'))
  p.set(lb[0] - 4, lb[1] - 11, rgb('#fff0c8'))
  if (on) p.glow(lb[0] - 3, lb[1] - 7, 9, C.warm, 0.8)

  // monitor principal (de costas para a câmera): base, haste e painel achatado
  isoBox(p, O, { gx: gx + 0.42, gy: gy + 0.3, w: 0.22, d: 0.16, z: 16, h: 1 }, { top: beige.top, left: beige.left, right: beige.right, outline: beige.line })
  isoBox(p, O, { gx: gx + 0.5, gy: gy + 0.35, w: 0.06, d: 0.06, z: 17, h: 4 }, { top: beige.top, left: beige.left, right: beige.right, outline: beige.line })
  isoBox(p, O, { gx: gx + 0.25, gy: gy + 0.4, w: 0.56, d: 0.1, z: 20, h: 11 }, {
    top: beige.top,
    left: (u, v) => (v === 3 && u > 5 && u < 14 ? rgb('#7d776b') : v === 5 && u > 5 && u < 14 ? rgb('#7d776b') : u === 3 && v === 8 ? (on ? rgb('#6fe09a') : rgb('#5a554b')) : beige.left),
    right: beige.right, outline: beige.line, hi: rgb('#f1ece0'),
  })
  return p
}

/** Cadeira de escritório: encosto alto logo atrás da pessoa, assento e base. */
export function buildChair(cx: number, cy: number): Pix {
  const p = new Pix(SCENE_W, SCENE_H)
  const steel = { top: rgb('#8792a8'), left: rgb('#64708a'), right: rgb('#4c566d'), outline: rgb('#232833'), hi: rgb('#a9b4c9') }
  isoBox(p, O, { gx: cx + 0.38, gy: cy + 0.3, w: 0.08, d: 0.08, z: 1, h: 8 }, steel)
  isoBox(p, O, { gx: cx + 0.15, gy: cy + 0.15, w: 0.55, d: 0.5, z: 0, h: 1 }, { ...steel, top: rgb('#3a404c') })
  isoBox(p, O, { gx: cx, gy: cy + 0.05, w: 0.8, d: 0.6, z: 9, h: 3 }, steel)
  isoBox(p, O, { gx: cx + 0.05, gy: cy, w: 0.7, d: 0.09, z: 12, h: 13 }, steel)
  return p
}

/** Área de descanso e decoração da frente (desenhada depois das estações): sofá, mesa de centro e plantas. */
export function buildProps(): Pix {
  const p = new Pix(SCENE_W, SCENE_H)
  const leather = { top: rgb('#c96a3b'), left: rgb('#9a4624'), right: rgb('#7a371b'), outline: rgb('#3a1a0c'), hi: rgb('#e38a58') }
  const gx = 0.1, gy = 3.2
  const seamL = (base: RGB) => (u: number, v: number): RGB => (v === 0 ? shade(base, 0.8) : u % 16 === 0 ? shade(base, 0.82) : base)
  isoBox(p, O, { gx, gy, w: 1.55, d: 0.28, z: 5, h: 12 }, { ...leather, left: seamL(leather.left), right: seamL(leather.right) }) // encosto
  isoBox(p, O, { gx, gy: gy + 0.1, w: 1.55, d: 0.8, z: 0, h: 6 }, { ...leather, left: seamL(leather.left), right: seamL(leather.right) }) // base
  isoBox(p, O, { gx: gx + 0.12, gy: gy + 0.2, w: 1.3, d: 0.68, z: 6, h: 2 }, { ...leather, top: rgb('#d27846'), outline: rgb('#4a2210') }) // almofada
  isoBox(p, O, { gx: gx - 0.05, gy, w: 0.2, d: 0.98, z: 0, h: 11 }, leather) // braço esq.
  isoBox(p, O, { gx: gx + 1.4, gy, w: 0.2, d: 0.98, z: 0, h: 11 }, leather) // braço dir.
  isoBox(p, O, { gx: gx + 0.35, gy: gy + 0.3, w: 0.2, d: 0.12, z: 8, h: 4 }, { top: rgb('#e8d9b0'), left: rgb('#cdbd92'), right: rgb('#a89a72'), outline: rgb('#4a3f26') }) // almofadinha
  // mesa de centro com livro e caneca
  isoBox(p, O, { gx: gx + 0.35, gy: gy + 1.1, w: 0.8, d: 0.5, z: 5, h: 2 }, { top: woodTop, left: (_u, v) => woodSide(wood.left, v, 2), right: (_u, v) => woodSide(wood.right, v, 2), outline: line, hi: wood.hi })
  for (const [lx, ly] of [[0.4, 1.15], [1.05, 1.15], [0.4, 1.5], [1.05, 1.5]]) isoBox(p, O, { gx: gx + lx, gy: gy + ly, w: 0.06, d: 0.06, z: 0, h: 5 }, { top: wood.dark, left: wood.dark, right: shade(wood.dark, 0.8), outline: line })
  isoBox(p, O, { gx: gx + 0.5, gy: gy + 1.2, w: 0.25, d: 0.17, z: 7, h: 1 }, { top: rgb('#3f6fa8'), left: rgb('#2f5686'), right: rgb('#264670'), outline: rgb('#17283f') })
  isoBox(p, O, { gx: gx + 0.9, gy: gy + 1.25, w: 0.1, d: 0.1, z: 7, h: 3 }, { top: rgb('#5a3a22'), left: rgb('#f0ede6'), right: rgb('#cfcabd'), outline: beige.line })
  // plantas da frente
  const a = proj(O, 5.8, 2.5)
  paintPlant(p, a[0], a[1] + 2, true)
  return p
}
