import { BoxGeometry, CapsuleGeometry, CylinderGeometry, MeshBasicMaterial, MeshLambertMaterial, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/**
 * Ambientação quente do escritório (tijolo, madeira, luz âmbar) — exceção deliberada
 * à regra monocromática, restrita à cena 3D por decisão do dono do projeto.
 */
const L = (color: string) => new MeshLambertMaterial({ color })
const U = (color: string) => new MeshBasicMaterial({ color }) // sem iluminação (luzes/telas)

export const unit = new BoxGeometry(1, 1, 1)

const cache = new Map<string, BufferGeometry>()
const memo = (key: string, make: () => BufferGeometry) => {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)!
}

/** Geometrias compartilhadas dos robôs. `sph`/`cyl` têm diâmetro 1 (use `scale`); cilindro tem o eixo em y. */
export const geo = {
  box: unit,
  sph: new SphereGeometry(0.5, 14, 10),
  cyl: new CylinderGeometry(0.5, 0.5, 1, 14),
  arc: new TorusGeometry(0.27, 0.028, 6, 20, Math.PI),
  rbox: (w: number, h: number, d: number, r: number) => memo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r)),
  caps: (r: number, l: number) => memo(`cp${r},${l}`, () => new CapsuleGeometry(r, l, 4, 10)),
}

export const m = {
  // estrutura
  slab: L('#8d9094'), brick: L('#8c4a37'), brickLine: L('#6f3a2b'), wood: L('#b9824b'), plank: L('#9a6b3b'), carpet: L('#5d6167'),
  frame: L('#2a2a2d'), glass: U('#a9c2d4'), warm: U('#ffd08a'),
  // móveis
  deskTop: L('#c99458'), deskDark: L('#2b2c30'), chair: L('#1e1f22'), metal: L('#6c7076'), paper: L('#e8e4da'), cardboard: L('#8a5a2e'),
  sofa: L('#5a6470'), pot: L('#6d7075'), leaf: L('#4f8f4a'), leaf2: L('#3b7a3d'),
  bk1: L('#b04a3a'), bk2: L('#3a6ea5'), bk3: L('#d9b44a'),
  tv: L('#18191c'), tvLine: U('#bfe6ff'), screenOn: U('#8fd3ff'), screenOff: U('#050505'),
  // robôs
  robot: L('#dcdee1'), joint: L('#4a4d52'), eye: U('#ffffff'),
  khaki: L('#a38a58'), khakiDark: L('#7d6a40'), olive: L('#6b6a3a'),
  hoodie: L('#3a3d44'), headset: L('#17181a'), lens: U('#6fb6e0'),
  coat: L('#f2f2f0'), navy: L('#27406b'), orange: L('#d9702f'),
  suit: L('#232c44'), shirt: L('#ececec'), tie: L('#a8332f'), hair: L('#2b2118'),
  // interação
  hit: new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  marker: U('#ffffff'),
}
export type MatKey = keyof typeof m
