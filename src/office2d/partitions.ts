import { isoBox, rgb, shade } from './raster'
import { bake, boxBounds, type Sprite } from './sprite'
import { DOORS, isDoorTile, ORIGIN, PARTITIONS } from './world'

const wall = {
  top: rgb('#efe6d2'), left: rgb('#d6cab4'), right: rgb('#b9ad97'), outline: rgb('#3b2f26'), hi: rgb('#fffaf0'),
}
const post = { top: rgb('#a8723c'), left: rgb('#8a5a30'), right: rgb('#6b4426'), outline: rgb('#2f1f12'), hi: rgb('#c98f52') }
const H = 14
const T = 0.2

/** Divisórias baixas em segmentos de 1 tile (ordenáveis por profundidade) + batentes das portas. */
export function buildPartitions(): Sprite[] {
  const out: Sprite[] = []
  for (const part of PARTITIONS) {
    for (let t = part.from; t < part.to; t++) {
      if (isDoorTile(part.axis, part.pos, t)) continue
      const b = part.axis === 'y' ? { gx: t, gy: part.pos, w: 1, d: T } : { gx: part.pos, gy: t, w: T, d: 1 }
      const style = {
        top: wall.top, outline: wall.outline, hi: wall.hi,
        left: (_u: number, v: number) => (v < 2 ? rgb('#8a6a44') : shade(wall.left, v === H - 1 ? 1.06 : 1)),
        right: (_u: number, v: number) => (v < 2 ? rgb('#6b5033') : shade(wall.right, v === H - 1 ? 1.06 : 1)),
      }
      out.push(bake(boxBounds(b.gx, b.gy, b.w, b.d, H), b.gx + b.w + b.gy + b.d, (p) => isoBox(p, ORIGIN, { ...b, h: H }, style)))
    }
  }
  for (const d of DOORS) {
    for (const t of [d.a - 0.2, d.b]) {
      const b = d.axis === 'y' ? { gx: t, gy: d.pos, w: 0.2, d: T } : { gx: d.pos, gy: t, w: T, d: 0.2 }
      out.push(bake(boxBounds(b.gx, b.gy, b.w, b.d, 26), b.gx + b.w + b.gy + b.d, (p) => isoBox(p, ORIGIN, { ...b, h: 26 }, post)))
    }
  }
  return out
}
