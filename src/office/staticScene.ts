import { BufferGeometry, Matrix4, Quaternion, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { layout } from '../lib/office'
import type { AgentId } from '../lib/types'
import { unit, type MatKey } from './materials'

export const RX = 7.2 // largura (x)
export const RZ = 5.4 // profundidade (z)
export const WALL_H = 3

type V3 = [number, number, number]
const items: { k: MatKey; p: V3; s: V3 }[] = []
const add = (k: MatKey, p: V3, s: V3) => void items.push({ k, p, s })

/** Peça no espaço local da mesa (escala 0.7, mesmo espaço do robô) convertida para o mundo. */
function st(id: AgentId, k: MatKey, p: V3, s: V3) {
  const { x, z } = layout[id]
  add(k, [x + p[0] * 0.7, p[1] * 0.7, z + 1.19 + p[2] * 0.7], [s[0] * 0.7, s[1] * 0.7, s[2] * 0.7])
}

function plant(x: number, z: number, h = 1) {
  add('pot', [x, 0.2, z], [0.4, 0.4, 0.4])
  add('leaf2', [x, 0.5 * h + 0.1, z], [0.6, 0.35, 0.6])
  add('leaf', [x, 0.85 * h, z], [0.5, 0.4 * h, 0.5])
  add('leaf2', [x, 1.2 * h, z], [0.34, 0.35, 0.34])
  add('leaf', [x, 1.5 * h, z], [0.18, 0.25, 0.18])
}

// ── casca: base, piso de madeira, paredes de tijolo, janelas, arandelas, telão ──
add('slab', [0, -0.15, 0], [RX + 0.4, 0.3, RZ + 0.4])
add('wood', [0, 0.01, 0], [RX, 0.04, RZ])
for (let i = 1; i < 12; i++) add('plank', [-RX / 2 + i * 0.6, 0.035, 0], [0.02, 0.01, RZ])
add('brick', [0, WALL_H / 2, -RZ / 2 - 0.08], [RX + 0.4, WALL_H, 0.16])
add('brick', [-RX / 2 - 0.08, WALL_H / 2, 0], [0.16, WALL_H, RZ])
add('slab', [0, WALL_H + 0.03, -RZ / 2 - 0.08], [RX + 0.4, 0.06, 0.2])
add('slab', [-RX / 2 - 0.08, WALL_H + 0.03, 0], [0.2, 0.06, RZ])
for (let y = 0.3; y < WALL_H; y += 0.3) {
  add('brickLine', [0, y, -RZ / 2 + 0.005], [RX, 0.025, 0.01])
  add('brickLine', [-RX / 2 + 0.005, y, 0], [0.01, 0.025, RZ])
}
for (const x of [-2.5, 2.5]) {
  add('frame', [x, 1.75, -RZ / 2 + 0.02], [1.5, 1.3, 0.04])
  add('glass', [x, 1.75, -RZ / 2 + 0.045], [1.34, 1.14, 0.01])
  add('frame', [x, 1.75, -RZ / 2 + 0.055], [0.04, 1.14, 0.01])
  add('frame', [x, 1.75, -RZ / 2 + 0.055], [1.34, 0.04, 0.01])
}
for (const z of [-0.5, 1.9]) {
  add('frame', [-RX / 2 + 0.02, 1.75, z], [0.04, 1.3, 1.5])
  add('glass', [-RX / 2 + 0.045, 1.75, z], [0.01, 1.14, 1.34])
  add('frame', [-RX / 2 + 0.055, 1.75, z], [0.01, 1.14, 0.04])
  add('frame', [-RX / 2 + 0.055, 1.75, z], [0.01, 0.04, 1.34])
}
for (const x of [-1.4, 1.4]) add('warm', [x, 2.15, -RZ / 2 + 0.06], [0.12, 0.28, 0.08])
for (const z of [-1.9, 0.7]) add('warm', [-RX / 2 + 0.06, 2.15, z], [0.08, 0.28, 0.12])
add('tv', [0, 2.15, -RZ / 2 + 0.04], [2.0, 0.85, 0.06])
for (let i = 0; i < 3; i++) add('tvLine', [-0.5 + i * 0.1, 2.35 - i * 0.2, -RZ / 2 + 0.075], [0.8 + i * 0.3, 0.05, 0.01])

// ── mesas, cadeiras e adereços de cada função ──
for (const id of Object.keys(layout) as AgentId[]) {
  const { x, z } = layout[id]
  add('carpet', [x, 0.04, z + 1.0], [2.0, 0.015, 2.6])
  st(id, 'deskTop', [0, 0.78, -1.7], [2.6, 0.08, 1.1])
  st(id, 'deskDark', [-1.2, 0.37, -1.7], [0.08, 0.74, 1])
  st(id, 'deskDark', [1.2, 0.37, -1.7], [0.08, 0.74, 1])
  st(id, 'deskDark', [0, 0.45, -2.2], [2.4, 0.7, 0.05])
  st(id, 'deskDark', [0, 0.95, -1.9], [0.1, 0.26, 0.1])
  st(id, 'deskDark', [0, 1.38, -1.9], [1.1, 0.65, 0.06])
  st(id, 'chair', [0, 0.84, -1.45], [0.7, 0.03, 0.22]) // teclado
  st(id, 'chair', [0, 0.45, -0.5], [0.7, 0.08, 0.7]) // assento
  st(id, 'chair', [0, 0.7, -0.13], [0.7, 0.6, 0.06]) // encosto
  st(id, 'chair', [0, 0.22, -0.5], [0.08, 0.4, 0.08])
  st(id, 'chair', [0, 0.05, -0.5], [0.7, 0.05, 0.1])
  st(id, 'chair', [0, 0.05, -0.5], [0.1, 0.05, 0.7])
}
// SCOUT: mapa e globo
st('scout', 'paper', [-0.9, 0.84, -1.6], [0.5, 0.01, 0.4])
st('scout', 'metal', [0.9, 1.0, -1.7], [0.2, 0.2, 0.2])
st('scout', 'deskDark', [0.9, 0.88, -1.7], [0.06, 0.12, 0.06])
// ATLAS: segundo monitor
st('atlas', 'deskDark', [1.05, 1.3, -1.9], [0.8, 0.5, 0.05])
// SENTINEL: prancheta
st('sentinel', 'cardboard', [-0.9, 0.84, -1.6], [0.35, 0.02, 0.45])
st('sentinel', 'paper', [-0.9, 0.855, -1.6], [0.28, 0.01, 0.38])
// NOVA: modelo de foguete
st('nova', 'paper', [0.95, 0.97, -1.7], [0.14, 0.36, 0.14])
st('nova', 'orange', [0.95, 1.2, -1.7], [0.1, 0.12, 0.1])
// MERCURY: telefone e maleta
st('mercury', 'deskDark', [-0.9, 0.83, -1.55], [0.16, 0.03, 0.3])
st('mercury', 'cardboard', [1.0, 0.18, -0.4], [0.55, 0.3, 0.18])

// ── decoração de apoio ──
add('sofa', [-3.0, 0.22, 1.2], [0.9, 0.3, 2.0])
add('sofa', [-3.42, 0.55, 1.2], [0.2, 0.5, 2.0])
add('sofa', [-3.0, 0.4, 0.2], [0.9, 0.5, 0.15])
add('sofa', [-3.0, 0.4, 2.2], [0.9, 0.5, 0.15])
add('deskTop', [-2.3, 0.25, 1.2], [0.6, 0.05, 0.9])
add('deskDark', [-2.3, 0.12, 1.2], [0.5, 0.24, 0.8])
add('deskDark', [-3.4, 0.8, -2.0], [0.4, 1.6, 1.0]) // estante
for (const [i, k] of (['bk1', 'bk2', 'bk3', 'bk2', 'bk1', 'bk3'] as MatKey[]).entries()) {
  add(k, [-3.18, 0.35 + Math.floor(i / 3) * 0.55 + 0.2, -2.35 + (i % 3) * 0.33], [0.02, 0.35, 0.22])
}
add('deskTop', [3.1, 0.95, 1.7], [1.0, 0.06, 0.7]) // mesa alta
add('deskDark', [3.1, 0.47, 1.7], [0.08, 0.94, 0.08])
for (const zz of [1.4, 2.0]) {
  add('chair', [2.55, 0.55, zz], [0.32, 0.06, 0.32])
  add('chair', [2.55, 0.27, zz], [0.06, 0.54, 0.06])
}
add('metal', [3.3, 0.5, -0.9], [0.5, 1.0, 0.7]) // arquivo
add('paper', [3.3, 0.45, 0.3], [0.3, 0.9, 0.3]) // bebedouro
add('glass', [3.3, 1.05, 0.3], [0.26, 0.3, 0.26])
plant(-3.3, 2.5, 1.1)
plant(3.4, -2.4, 1.3)
plant(3.3, 2.5, 0.9)
plant(-3.3, -0.2, 1.4)

/** Une as peças estáticas em uma malha por material (dezenas de draw calls em vez de centenas). */
function build(): [MatKey, BufferGeometry][] {
  const groups = new Map<MatKey, BufferGeometry[]>()
  const q = new Quaternion()
  for (const it of items) {
    const g = unit.clone().applyMatrix4(new Matrix4().compose(new Vector3(...it.p), q, new Vector3(...it.s)))
    groups.set(it.k, [...(groups.get(it.k) ?? []), g])
  }
  return [...groups].map(([k, gs]) => [k, mergeGeometries(gs, false)] as [MatKey, BufferGeometry])
}

export const staticMeshes = build()
