import { BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Matrix4, Quaternion, Shape, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { layout } from '../lib/office'
import type { AgentId } from '../lib/types'
import type { MatKey } from './materials'

export const RX = 7.2 // largura (x)
export const RZ = 5.4 // profundidade (z)
export const WALL_H = 3

type V3 = [number, number, number]
const items: { k: MatKey; g: BufferGeometry }[] = []
const q = new Quaternion()

function push(k: MatKey, g: BufferGeometry, p: V3, sc: V3 = [1, 1, 1]) {
  const geo = g.index ? g.toNonIndexed() : g // todas não indexadas para fundir
  geo.applyMatrix4(new Matrix4().compose(new Vector3(...p), q, new Vector3(...sc)))
  items.push({ k, g: geo })
}

const box = (k: MatKey, p: V3, s: V3) => push(k, new BoxGeometry(...s), p)
const rbox = (k: MatKey, p: V3, s: V3, r = 0.04) =>
  push(k, new RoundedBoxGeometry(s[0], s[1], s[2], 2, Math.min(r, Math.min(...s) / 2 - 0.002)), p)
const cyl = (k: MatKey, p: V3, rt: number, rb: number, h: number, sc?: V3) => push(k, new CylinderGeometry(rt, rb, h, 14), p, sc)
const sph = (k: MatKey, p: V3, r: number, sc?: V3) => push(k, new SphereGeometry(r, 10, 8), p, sc)

/** Laje de cantos arredondados (tampos, tapetes, base do diorama). */
function slab(k: MatKey, p: V3, w: number, d: number, h: number, r: number) {
  const s = new Shape()
  const x = w / 2, y = d / 2
  s.moveTo(-x + r, -y)
  s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false)
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false)
  const g = new ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 6 })
  g.translate(0, 0, -h / 2)
  g.rotateX(-Math.PI / 2)
  push(k, g, p)
}

/** Planta de folhagem em esferas sobrepostas, em vaso cônico. */
function plant(x: number, z: number, h = 1) {
  cyl('pot', [x, 0.2, z], 0.24, 0.17, 0.4)
  cyl('chair', [x, 0.41, z], 0.2, 0.2, 0.03)
  const leaves: [number, number, number, number, MatKey][] = [
    [0, 0.65, 0, 0.3, 'leaf2'], [0.17, 0.75, 0.06, 0.2, 'leaf'], [-0.15, 0.8, -0.05, 0.22, 'leaf'],
    [0.04, 1.0, 0.1, 0.22, 'leaf2'], [-0.06, 1.15, -0.08, 0.2, 'leaf'], [0.02, 1.35, 0, 0.15, 'leaf2'],
  ]
  for (const [dx, y, dz, r, k] of leaves) sph(k, [x + dx, 0.2 + y * h, z + dz], r, [1, 1.1, 1])
}

// ── casca: base arredondada, piso, paredes de tijolo, janelas, arandelas, telão ──
slab('slab', [0, -0.15, 0], RX + 0.4, RZ + 0.4, 0.3, 0.25)
box('wood', [0, 0.01, 0], [RX, 0.04, RZ])
for (let i = 1; i < 12; i++) box('plank', [-RX / 2 + i * 0.6, 0.035, 0], [0.02, 0.01, RZ])
box('brick', [0, WALL_H / 2, -RZ / 2 - 0.08], [RX + 0.4, WALL_H, 0.16])
box('brick', [-RX / 2 - 0.08, WALL_H / 2, 0], [0.16, WALL_H, RZ])
rbox('slab', [0, WALL_H + 0.03, -RZ / 2 - 0.08], [RX + 0.4, 0.08, 0.22], 0.035)
rbox('slab', [-RX / 2 - 0.08, WALL_H + 0.03, 0], [0.22, 0.08, RZ], 0.035)
for (let y = 0.3; y < WALL_H; y += 0.3) {
  box('brickLine', [0, y, -RZ / 2 + 0.005], [RX, 0.025, 0.01])
  box('brickLine', [-RX / 2 + 0.005, y, 0], [0.01, 0.025, RZ])
}
for (const x of [-2.5, 2.5]) {
  rbox('frame', [x, 1.75, -RZ / 2 + 0.02], [1.5, 1.3, 0.04], 0.02)
  box('glass', [x, 1.75, -RZ / 2 + 0.045], [1.34, 1.14, 0.01])
  box('frame', [x, 1.75, -RZ / 2 + 0.055], [0.04, 1.14, 0.01])
  box('frame', [x, 1.75, -RZ / 2 + 0.055], [1.34, 0.04, 0.01])
  rbox('slab', [x, 1.08, -RZ / 2 + 0.1], [1.6, 0.05, 0.18], 0.02) // peitoril
}
for (const z of [-0.5, 1.9]) {
  rbox('frame', [-RX / 2 + 0.02, 1.75, z], [0.04, 1.3, 1.5], 0.02)
  box('glass', [-RX / 2 + 0.045, 1.75, z], [0.01, 1.14, 1.34])
  box('frame', [-RX / 2 + 0.055, 1.75, z], [0.01, 1.14, 0.04])
  box('frame', [-RX / 2 + 0.055, 1.75, z], [0.01, 0.04, 1.34])
  rbox('slab', [-RX / 2 + 0.1, 1.08, z], [0.18, 0.05, 1.6], 0.02)
}
for (const x of [-1.4, 1.4]) {
  cyl('frame', [x, 2.15, -RZ / 2 + 0.05], 0.03, 0.03, 0.1, [1, 1, 1])
  sph('warm', [x, 2.15, -RZ / 2 + 0.14], 0.12, [1, 1.3, 0.9])
}
for (const z of [-1.9, 0.7]) {
  cyl('frame', [-RX / 2 + 0.05, 2.15, z], 0.03, 0.03, 0.1)
  sph('warm', [-RX / 2 + 0.14, 2.15, z], 0.12, [0.9, 1.3, 1])
}
rbox('tv', [0, 2.15, -RZ / 2 + 0.04], [2.0, 0.85, 0.06], 0.03)
for (let i = 0; i < 3; i++) box('tvLine', [-0.5 + i * 0.1, 2.35 - i * 0.2, -RZ / 2 + 0.075], [0.8 + i * 0.3, 0.05, 0.01])

// ── mesas, cadeiras e adereços (espaço local da mesa, escala 0.7) ──
function desk(id: AgentId) {
  const { x, z } = layout[id]
  const P = (p: V3): V3 => [x + p[0] * 0.7, p[1] * 0.7, z + 1.19 + p[2] * 0.7]
  return {
    slab: (k: MatKey, p: V3, w: number, d: number, h: number, r: number) => slab(k, P(p), w * 0.7, d * 0.7, h * 0.7, r * 0.7),
    rbox: (k: MatKey, p: V3, s: V3, r?: number) => rbox(k, P(p), [s[0] * 0.7, s[1] * 0.7, s[2] * 0.7], r === undefined ? undefined : r * 0.7),
    cyl: (k: MatKey, p: V3, rt: number, rb: number, h: number, sc?: V3) => cyl(k, P(p), rt * 0.7, rb * 0.7, h * 0.7, sc),
    sph: (k: MatKey, p: V3, r: number, sc?: V3) => sph(k, P(p), r * 0.7, sc),
  }
}
for (const id of Object.keys(layout) as AgentId[]) {
  const { x, z } = layout[id]
  slab('carpet', [x, 0.045, z + 1.0], 2.1, 2.7, 0.02, 0.35)
  const d = desk(id)
  d.slab('deskTop', [0, 0.78, -1.7], 2.7, 1.2, 0.08, 0.22)
  for (const lx of [-1.15, 1.15]) for (const lz of [-2.05, -1.35]) d.cyl('deskDark', [lx, 0.37, lz], 0.04, 0.04, 0.74)
  d.rbox('deskDark', [0, 0.5, -2.2], [2.3, 0.6, 0.05], 0.02)
  d.cyl('deskDark', [0, 0.82, -1.9], 0.22, 0.24, 0.03) // base do monitor
  d.cyl('deskDark', [0, 0.97, -1.9], 0.04, 0.04, 0.3) // haste
  d.rbox('deskDark', [0, 1.38, -1.9], [1.1, 0.65, 0.06], 0.04) // moldura do monitor
  d.rbox('chair', [0, 0.84, -1.45], [0.7, 0.04, 0.22], 0.02) // teclado
  d.sph('chair', [0.55, 0.85, -1.45], 0.05, [1, 0.6, 1.4]) // mouse
  d.cyl('chair', [0, 0.45, -0.5], 0.36, 0.34, 0.09) // assento
  d.rbox('chair', [0, 0.72, -0.13], [0.7, 0.6, 0.08], 0.12) // encosto
  d.cyl('chair', [0, 0.22, -0.5], 0.04, 0.04, 0.4)
  d.cyl('chair', [0, 0.06, -0.5], 0.3, 0.3, 0.05)
}
// SCOUT: mapa e globo
desk('scout').rbox('paper', [-0.9, 0.84, -1.6], [0.5, 0.015, 0.4], 0.006)
desk('scout').cyl('metal', [0.9, 0.88, -1.7], 0.07, 0.1, 0.1)
desk('scout').sph('metal', [0.9, 1.03, -1.7], 0.14)
// ATLAS: segundo monitor
desk('atlas').rbox('deskDark', [1.05, 1.3, -1.9], [0.8, 0.5, 0.05], 0.03)
desk('atlas').cyl('deskDark', [1.05, 0.95, -1.9], 0.04, 0.04, 0.3)
// SENTINEL: prancheta
desk('sentinel').rbox('cardboard', [-0.9, 0.84, -1.6], [0.35, 0.025, 0.45], 0.012)
desk('sentinel').rbox('paper', [-0.9, 0.86, -1.6], [0.28, 0.012, 0.38], 0.005)
// NOVA: foguete em miniatura
desk('nova').cyl('paper', [0.95, 1.0, -1.7], 0.07, 0.07, 0.34)
desk('nova').cyl('orange', [0.95, 1.26, -1.7], 0.0, 0.07, 0.18)
// MERCURY: telefone e maleta
desk('mercury').rbox('deskDark', [-0.9, 0.84, -1.55], [0.16, 0.04, 0.3], 0.02)
desk('mercury').rbox('cardboard', [1.0, 0.18, -0.4], [0.55, 0.3, 0.18], 0.05)

// ── decoração de apoio ──
slab('carpet', [-2.9, 0.045, 1.2], 2.3, 2.6, 0.02, 1.0) // tapete da sala de descanso
rbox('sofa', [-3.0, 0.24, 1.2], [0.9, 0.32, 2.0], 0.14)
rbox('sofa', [-3.42, 0.58, 1.2], [0.22, 0.56, 2.0], 0.1)
rbox('sofa', [-3.0, 0.42, 0.2], [0.9, 0.55, 0.16], 0.07)
rbox('sofa', [-3.0, 0.42, 2.2], [0.9, 0.55, 0.16], 0.07)
cyl('deskTop', [-2.3, 0.3, 1.2], 0.42, 0.42, 0.05) // mesa de centro redonda
cyl('deskDark', [-2.3, 0.14, 1.2], 0.05, 0.05, 0.28)
cyl('deskDark', [-2.3, 0.02, 1.2], 0.2, 0.2, 0.04)
rbox('deskDark', [-3.4, 0.8, -2.0], [0.4, 1.6, 1.0], 0.03) // estante
for (const [i, k] of (['bk1', 'bk2', 'bk3', 'bk2', 'bk1', 'bk3'] as MatKey[]).entries()) {
  rbox(k, [-3.18, 0.55 + Math.floor(i / 3) * 0.55, -2.35 + (i % 3) * 0.33], [0.04, 0.35, 0.22], 0.012)
}
sph('leaf', [-3.4, 1.78, -2.1], 0.16, [1, 0.8, 1]) // planta sobre a estante
sph('leaf2', [-3.35, 1.88, -1.9], 0.13)
cyl('deskTop', [3.1, 0.95, 1.7], 0.5, 0.5, 0.06) // mesa alta redonda
cyl('deskDark', [3.1, 0.47, 1.7], 0.05, 0.05, 0.94)
cyl('deskDark', [3.1, 0.02, 1.7], 0.28, 0.28, 0.04)
for (const zz of [1.2, 2.2]) {
  cyl('chair', [2.45, 0.58, zz], 0.18, 0.18, 0.07)
  cyl('chair', [2.45, 0.28, zz], 0.035, 0.035, 0.56)
  cyl('chair', [2.45, 0.02, zz], 0.15, 0.15, 0.04)
}
rbox('metal', [3.3, 0.5, -0.9], [0.5, 1.0, 0.7], 0.05) // arquivo
cyl('paper', [3.3, 0.45, 0.3], 0.17, 0.17, 0.9) // bebedouro
cyl('glass', [3.3, 1.07, 0.3], 0.14, 0.14, 0.3)
sph('glass', [3.3, 1.22, 0.3], 0.14)
plant(-3.3, 2.5, 1.1)
plant(3.4, -2.4, 1.3)
plant(3.3, 2.5, 0.9)
plant(-3.3, -1.0, 1.4)

/** Une as peças estáticas em uma malha por material (dezenas de draw calls em vez de centenas). */
function build(): [MatKey, BufferGeometry][] {
  const groups = new Map<MatKey, BufferGeometry[]>()
  for (const it of items) groups.set(it.k, [...(groups.get(it.k) ?? []), it.g])
  return [...groups].map(([k, gs]) => [k, mergeGeometries(gs, false)] as [MatKey, BufferGeometry])
}

export const staticMeshes = build()
