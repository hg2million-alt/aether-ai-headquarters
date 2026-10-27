import type { AgentStatus } from '../lib/types'
import { GLYPH } from './font'
import { Pix, rgb, type RGB } from './raster'
import type { Activity } from './layout'

/**
 * Sprites de personagens desenhados em grades de pixels (20×30). O mesmo desenho serve a todos os
 * agentes: a paleta e os acessórios mudam por CharStyle. O contorno de 1 px é gerado automaticamente.
 */
export interface CharStyle {
  skin: [string, string]
  hair: [string, string]
  shirt: [string, string, string] // base, sombra, luz
  accent: string
  pants: string
  shoes: string
  hairStyle: 'short' | 'ponytail' | 'curly' | 'swept'
  outfit: 'hoodie' | 'vest' | 'coat' | 'jumpsuit' | 'blazer'
  glasses?: boolean
  headset?: boolean
}

const OUTLINE = rgb('#2a1c18')
const EYE = rgb('#241c22')
const WHITE = rgb('#f6f2ea')
const MOUTH = rgb('#a8504d')

/** Cabeça 14×13 (cabelo H/h/g, pele S/s). */
const HEAD_SHORT = [
  '....HHHHHH....',
  '..HHHHHHHHHH..',
  '.HHhhHHHHHHHg.',
  '.HHhHHHHHHHHg.',
  '.HHHHHHHHHHHg.',
  '.HHHSSSSSSHHg.',
  '.HHSSSSSSSSHg.',
  '.HSSSSSSSSSSs.',
]
const HEAD_PONY = [
  '....HHHHHH....',
  '..HHHHHHHHHH..',
  '.HHhhHHHHHHHg.',
  '.HHhHHHHHHHHg.',
  '.HHHHHHHSSHHg.',
  '.HHHHSSSSSSHg.',
  '.HSSSSSSSSSSs.',
  '.SSSSSSSSSSSs.',
]
const HEAD_CURLY = [
  '...HHHHHHHH...',
  '.HHHhHHHhHHHH.',
  'HHhhHHHHHHHHHg',
  'HHhHHHHHHHHHHg',
  'HHHHHHHHHHHHHg',
  'HHHHSSSSSSHHHg',
  '.HHSSSSSSSSHHg',
  '.HSSSSSSSSSSs.',
]
const HEAD_SWEPT = [
  '...hhHHHHHH...',
  '..hhHHHHHHHH..',
  '.HHhhHHHHHHHg.',
  '.HHhHHHHHHHHg.',
  '.HHHHHHHHHHHg.',
  '.HHHSSSSSSHHg.',
  '.HHSSSSSSSSHg.',
  '.HSSSSSSSSSSs.',
]
const HEAD_FACE = [
  '.SSSSSSSSSSSs.',
  '.SSSSSSSSSSSs.',
  '.SSSSSSSSSSSs.',
  '..SSSSSSSSSs..',
  '...SSSSSSss...',
]

const TORSO = [
  '...LLLLLLLLLC...',
  '..LLLLAAAACCCC..',
  '.LLLLCCAACCCCCc.',
  '.LLLCCCAACCCCCc.',
  'LLLCCCCCCCCCCCcc',
  'LLCCCCCCCCCCCCcc',
  'LCCCCCCCCCCCCCcc',
  'LCCCCCCCCCCCCCcc',
  '.CCCCCCCCCCCCCc.',
  '..cccccccccccc..',
]

function blit(p: Pix, grid: string[], x: number, y: number, pal: Record<string, RGB>) {
  grid.forEach((row, j) => [...row].forEach((ch, i) => pal[ch] && p.set(x + i, y + j, pal[ch])))
}

/** Contorno automático de 1 px em volta de tudo que foi desenhado. */
function outline(p: Pix) {
  const mark: [number, number][] = []
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++)
      if (!p.get(x, y) && (p.get(x + 1, y) || p.get(x - 1, y) || p.get(x, y + 1) || p.get(x, y - 1))) mark.push([x, y])
  for (const [x, y] of mark) p.set(x, y, OUTLINE)
}

type Face = 'neutral' | 'down' | 'closed' | 'happy' | 'frown'

/** Rosto: olhos 2×2 com brilho, sobrancelhas, orelhas e boca conforme a expressão. */
function face(p: Pix, hx: number, hy: number, kind: Face, style: CharStyle, skin: RGB, skinSh: RGB, hairDark: RGB) {
  const px = (x: number, y: number, c: RGB) => p.set(hx + x, hy + y, c)
  const dy = kind === 'down' ? 1 : 0
  px(0, 9, skin); px(13, 9, skinSh) // orelhas
  for (const x0 of [3, 9]) {
    if (kind === 'closed') { px(x0, 9, EYE); px(x0 + 1, 9, EYE) }
    else if (kind === 'happy') { px(x0, 9, EYE); px(x0 + 1, 8, EYE); px(x0 + 2, 9, EYE); px(x0 - 0, 8, skin) }
    else {
      px(x0, 8 + dy, WHITE); px(x0 + 1, 8 + dy, EYE); px(x0, 9 + dy, EYE); px(x0 + 1, 9 + dy, EYE)
    }
    if (kind !== 'happy') {
      const lift = kind === 'frown' ? (x0 < 6 ? 0 : 0) : 0
      px(x0, 7 + lift + dy, hairDark); px(x0 + 1, 7 + lift + dy, hairDark)
    }
  }
  if (kind === 'frown') { px(3, 6, hairDark); px(10, 6, hairDark) }
  px(6, 10 + dy, skinSh); px(7, 10 + dy, skinSh) // nariz
  const mouth: Record<Face, [number, number][]> = {
    neutral: [[6, 12], [7, 12]], down: [[6, 12], [7, 12]], closed: [[6, 12], [7, 12]],
    happy: [[5, 11], [6, 12], [7, 12], [8, 11]], frown: [[5, 12], [6, 11], [7, 11], [8, 12]],
  }
  mouth[kind].forEach(([x, y]) => px(x, y, MOUTH))
  if (kind === 'happy') { px(2, 11, rgb('#e89a8a')); px(11, 11, rgb('#e89a8a')) }
  if (style.glasses) {
    const g = rgb('#2b2b33')
    for (const x0 of [2, 8]) {
      for (let i = 0; i < 4; i++) { px(x0 + i, 7 + dy, g); px(x0 + i, 10 + dy, g) }
      px(x0, 8 + dy, g); px(x0, 9 + dy, g); px(x0 + 3, 8 + dy, g); px(x0 + 3, 9 + dy, g)
    }
    px(6, 8 + dy, g); px(7, 8 + dy, g)
  }
}

export const SPRITE_W = 20
export const SPRITE_H = 30
/** Linha do sprite onde fica a base do tronco (âncora na cadeira). */
export const SPRITE_BASE = 28
const HEAD_X = 3
const TORSO_X = 2

const cache = new Map<string, HTMLCanvasElement>()

/** Sprite (cacheado) do personagem para um estado e um passo de animação (tick). */
export function charSprite(key: string, style: CharStyle, state: AgentStatus, tick: number, act?: Activity): HTMLCanvasElement {
  const phase = state === 'sleeping' || state === 'idle' ? (tick >> 1) % 2 : state === 'working' || state === 'completed' || state === 'failed' ? tick % 2 : 0
  const blink = state === 'idle' && tick % 16 === 9
  const pose = act === 'read' || act === 'eat' ? act : ''
  const ph2 = pose ? (tick >> 1) % 2 : phase
  const id = `${key}|${state}|${pose ? ph2 : phase}|${blink}|${pose}`
  const hit = cache.get(id)
  if (hit) return hit

  const [skin, skinSh] = style.skin.map(rgb)
  const [hair, hairHi] = style.hair.map(rgb)
  const [cB, cS, cL] = style.shirt.map(rgb)
  const accent = rgb(style.accent)
  const hairDark = rgb('#241812')
  const pal: Record<string, RGB> = { S: skin, s: skinSh, H: hair, h: hairHi, g: hairDark, C: cB, c: cS, L: cL, A: accent }

  const p = new Pix(SPRITE_W, SPRITE_H)
  const asleep = state === 'sleeping'
  let hy = 6, hx = HEAD_X, ty = 18
  if (state === 'working') hy = 7
  if (state === 'idle') hy = 6 + phase
  if (asleep) { hy = 11 + phase; ty = 19 }
  if (state === 'failed') { hy = 7; hx = HEAD_X + (phase ? 1 : -1) }
  if (state === 'unknown') hx = HEAD_X + 1

  const torso = () => {
    blit(p, TORSO, TORSO_X, ty, pal)
    if (style.outfit === 'hoodie') {
      for (let j = 0; j < 3; j++) { p.set(TORSO_X + 6, ty + 3 + j, rgb('#e8e8e8')); p.set(TORSO_X + 9, ty + 3 + j, rgb('#e8e8e8')) } // cordões
      p.rect(TORSO_X + 5, ty + 7, 6, 1, cS) // bolso
    } else if (style.outfit === 'coat') {
      p.set(TORSO_X + 5, ty + 2, accent); p.set(TORSO_X + 5, ty + 3, accent); p.set(TORSO_X + 10, ty + 2, accent); p.set(TORSO_X + 10, ty + 3, accent)
      p.rect(TORSO_X + 11, ty + 4, 2, 2, rgb('#5a8fd0')) // crachá
      p.set(TORSO_X + 3, ty + 5, rgb('#c0392b')); p.set(TORSO_X + 3, ty + 6, rgb('#c0392b')) // caneta no bolso
    } else if (style.outfit === 'jumpsuit') {
      for (let j = 1; j < 10; j++) p.set(TORSO_X + 7, ty + j, rgb('#aab4c8')) // zíper
      p.rect(TORSO_X + 10, ty + 3, 3, 2, accent) // emblema
      p.set(TORSO_X + 11, ty + 5, accent)
    } else if (style.outfit === 'blazer') {
      for (let j = 2; j < 8; j++) { p.set(TORSO_X + 7, ty + j, rgb('#a8332f')); p.set(TORSO_X + 8, ty + j, rgb('#a8332f')) } // gravata
      p.set(TORSO_X + 4, ty + 4, cS); p.set(TORSO_X + 11, ty + 4, cS)
    } else {
      for (let j = 3; j < 9; j++) { p.set(TORSO_X + 3, ty + j, accent); p.set(TORSO_X + 4, ty + j, accent); p.set(TORSO_X + 11, ty + j, accent); p.set(TORSO_X + 12, ty + j, accent) } // colete
      p.set(TORSO_X + 4, ty + 5, rgb('#7d6a3f')); p.set(TORSO_X + 11, ty + 5, rgb('#7d6a3f'))
    }
  }
  if (state === 'completed') {
    const up = phase ? 0 : 1
    for (const [x, hx2] of [[0, 1], [18, 19]] as const) {
      for (let y = 10 + up; y < ty + 3; y++) { p.set(x, y, cB); p.set(hx2, y, x === 0 ? cB : cS) }
      p.set(x, 9 + up, skin); p.set(hx2, 9 + up, skin); p.set(x, 8 + up, skin); p.set(hx2, 8 + up, skin)
    }
  }
  torso()
  const top = { short: HEAD_SHORT, ponytail: HEAD_PONY, curly: HEAD_CURLY, swept: HEAD_SWEPT }[style.hairStyle]
  blit(p, [...top, ...HEAD_FACE], hx, hy, pal)
  if (style.hairStyle === 'ponytail') {
    ;[[13, 4], [14, 4], [14, 5], [15, 5], [15, 6], [15, 7], [14, 8], [14, 9]].forEach(([x, y], i) => p.set(hx + x, hy + y + (state === 'working' ? 0 : phase && i > 4 ? 1 : 0), i % 2 ? hairHi : hair))
  }
  if (style.headset) {
    const dark = rgb('#17181a')
    for (let i = 2; i < 12; i++) p.set(hx + i, hy + 1, dark)
    for (let j = 2; j < 9; j++) { p.set(hx + 1, hy + j, dark); p.set(hx + 12, hy + j, dark) }
    for (let j = 8; j < 11; j++) { p.set(hx, hy + j, dark); p.set(hx + 13, hy + j, dark) }
    p.set(hx + 1, hy + 11, dark); p.set(hx + 2, hy + 12, dark); p.set(hx + 3, hy + 12, dark); p.set(hx + 4, hy + 12, rgb('#d9702f'))
  }
  const kind: Face = blink || asleep ? 'closed' : pose === 'eat' ? (ph2 ? 'happy' : 'neutral') : pose === 'read' ? 'down' : state === 'completed' ? 'happy' : state === 'failed' ? 'frown' : state === 'working' ? 'down' : 'neutral'
  face(p, hx, hy, kind, style, skin, skinSh, hairDark)
  if (pose === 'read') {
    const by = ty + 3
    p.rect(TORSO_X + 3, by, 10, 5, rgb('#7a3a2a'))
    p.rect(TORSO_X + 4, by + 1, 4, 3, rgb('#f4efe2')); p.rect(TORSO_X + 8, by + 1, 4, 3, rgb('#f4efe2'))
    for (let k = 0; k < 2; k++) { p.rect(TORSO_X + 5, by + 1 + k * 2, 2, 1, rgb('#a9a395')); p.rect(TORSO_X + 9, by + 1 + k * 2, 2, 1, rgb('#a9a395')) }
    if (ph2) p.rect(TORSO_X + 11, by + 1, 1, 3, rgb('#cfc9b8'))
    p.rect(TORSO_X + 2, by + 3, 2, 2, skin); p.rect(TORSO_X + 12, by + 3, 2, 2, skin)
  }
  if (pose === 'eat') {
    const up = ph2 ? 0 : 5
    p.rect(TORSO_X + 13, ty + 2 + up, 2, 2, skin)
    p.rect(TORSO_X + 14, ty + up - 1, 1, 3, rgb('#c8c8d0'))
    p.rect(TORSO_X + 2, ty + 6, 2, 2, skin)
  }
  if (state === 'failed') { p.set(hx + 13, hy + 5 + phase, rgb('#7ec8e8')); p.set(hx + 13, hy + 6 + phase, rgb('#bfe6f5')) }
  outline(p)

  const c = p.toCanvas()
  cache.set(id, c)
  return c
}

/** Mãos sobre o teclado (desenhadas por cima da mesa). */
export function handsSprite(style: CharStyle, state: AgentStatus, tick: number): HTMLCanvasElement | null {
  if (state === 'completed' || state === 'failed') return null
  const a = state === 'working' ? tick % 2 : 2
  const id = `hands|${style.skin[0]}|${style.shirt[0]}|${a}`
  const hit = cache.get(id)
  if (hit) return hit
  const p = new Pix(14, 7)
  const skin = rgb(style.skin[0]), sleeve = rgb(style.shirt[0])
  const typing = state === 'working'
  const l = typing ? 1 + a : 2, r = typing ? 2 - a : 2
  p.rect(0, l - 1, 4, 2, sleeve); p.rect(0, l + 1, 5, 2, skin)
  p.rect(9, r - 1, 4, 2, sleeve); p.rect(8, r + 1, 5, 2, skin)
  outline(p)
  const c = p.toCanvas()
  cache.set(id, c)
  return c
}

/** Balão de fala com símbolo de estado; `null` quando não há balão. */
export function bubbleSprite(state: AgentStatus, tick: number): HTMLCanvasElement | null {
  const spec: Partial<Record<AgentStatus, { text: string; color: string }>> = {
    working: { text: '</>', color: '#2e7d52' },
    sleeping: { text: tick % 4 < 2 ? 'Zz' : 'zZ', color: '#4a6fa5' },
    completed: { text: 'v', color: '#2e7d52' },
    failed: { text: '!', color: '#b3392f' },
    unknown: { text: '?', color: '#6b6b70' },
  }
  const s = spec[state]
  if (!s) return null
  if (state === 'working' && tick % 8 >= 6) return null // pisca
  const id = `bubble|${s.text}|${s.color}`
  const hit = cache.get(id)
  if (hit) return hit
  const w = s.text.length * 4 + 3, h = 9
  const p = new Pix(w, h + 3)
  const white = rgb('#f6f2e8'), ink = rgb(s.color)
  p.rect(1, 0, w - 2, h, white); p.rect(0, 1, w, h - 2, white)
  p.set(3, h, white); p.set(4, h, white); p.set(3, h + 1, white)
  ;[...s.text].forEach((ch, i) => GLYPH[ch]?.forEach((row, j) => [...row].forEach((px, k) => px === '#' && p.set(2 + i * 4 + k, 2 + j, ink))))
  outline(p)
  const c = p.toCanvas()
  cache.set(id, c)
  return c
}

// ───────────────────────── personagem em pé (andar e atividades) ─────────────────────────
export const STAND_W = 24
export const STAND_H = 38
/** Linha do sprite onde ficam os pés (âncora). */
export const STAND_BASE = 37
const SX = 4 // x do tronco
const SHX = 5 // x da cabeça

export type View = 'front' | 'back'
export type StandAct = 'walk' | 'idle' | 'coffee' | 'arcade' | 'foos'

/** Cabeça vista de trás: tudo é cabelo, exceto o pescoço. */
function backHead(style: CharStyle): string[] {
  const top = { short: HEAD_SHORT, ponytail: HEAD_PONY, curly: HEAD_CURLY, swept: HEAD_SWEPT }[style.hairStyle]
  return [...top, ...HEAD_FACE].map((row, j, all) => (j >= all.length - 2 ? row : row.replace(/S/g, 'H').replace(/s/g, 'g')))
}

/** Sprite do personagem em pé. `frame` 0–3 = ciclo de caminhada (pernas alternando). */
export function standSprite(key: string, style: CharStyle, view: View, act: StandAct, frame: number): HTMLCanvasElement {
  const f = act === 'walk' ? frame % 4 : act === 'idle' ? 0 : frame % 2
  const id = `stand|${key}|${view}|${act}|${f}`
  const hit = cache.get(id)
  if (hit) return hit

  const [skin, skinSh] = style.skin.map(rgb)
  const [hair, hairHi] = style.hair.map(rgb)
  const [cB, cS, cL] = style.shirt.map(rgb)
  const accent = rgb(style.accent)
  const hairDark = rgb('#241812')
  const pal: Record<string, RGB> = { S: skin, s: skinSh, H: hair, h: hairHi, g: hairDark, C: cB, c: cS, L: cL, A: view === 'back' ? cB : accent }
  const pants = rgb(style.pants), pantsSh = rgb(style.pants).map((v) => Math.round(v * 0.8)) as RGB, shoes = rgb(style.shoes)

  const p = new Pix(STAND_W, STAND_H)
  const bob = act === 'walk' && f % 2 === 1 ? 1 : 0
  const ty = 14 + bob, hy = 2 + bob
  // pernas e sapatos (pés fixos no chão)
  const legTop = ty + 10
  const lift = [[0, 0], [2, 0], [0, 0], [0, 2]][act === 'walk' ? f : 0]
  for (const [i, x0] of [[0, SX + 3], [1, SX + 8]] as const) {
    const l = lift[i]
    p.rect(x0, legTop, 4, 8 - l - bob, pants)
    p.rect(x0 + 3, legTop, 1, 8 - l - bob, pantsSh)
    p.rect(x0 - (view === 'front' ? 0 : 0), legTop + 8 - l - bob, 5, 2, shoes)
  }
  // tronco
  blit(p, TORSO, SX, ty, pal)
  if (view === 'front') {
    if (style.outfit === 'hoodie') for (let j = 0; j < 3; j++) { p.set(SX + 6, ty + 3 + j, rgb('#e8e8e8')); p.set(SX + 9, ty + 3 + j, rgb('#e8e8e8')) }
    else if (style.outfit === 'vest') for (let j = 3; j < 9; j++) { for (const x of [3, 4, 11, 12]) p.set(SX + x, ty + j, accent) }
    else if (style.outfit === 'coat') { p.set(SX + 5, ty + 2, accent); p.set(SX + 10, ty + 2, accent); p.rect(SX + 11, ty + 4, 2, 2, rgb('#5a8fd0')) }
    else if (style.outfit === 'jumpsuit') { for (let j = 1; j < 10; j++) p.set(SX + 7, ty + j, rgb('#aab4c8')); p.rect(SX + 10, ty + 3, 3, 2, accent) }
    else if (style.outfit === 'blazer') for (let j = 2; j < 8; j++) { p.set(SX + 7, ty + j, rgb('#a8332f')); p.set(SX + 8, ty + j, rgb('#a8332f')) }
  } else if (style.outfit === 'hoodie') p.rect(SX + 4, ty, 8, 2, cL)
  else if (style.outfit === 'vest') for (let j = 2; j < 9; j++) for (const x of [3, 4, 11, 12]) p.set(SX + x, ty + j, accent)
  // braços por atividade
  if (act === 'coffee') {
    for (let j = 1; j < 6; j++) p.set(SX + 16, ty + j, cB)
    p.rect(SX + 16, ty, 2, 2, skin)
    const up = f ? 0 : 1
    p.rect(SX + 17, ty - 3 + up, 3, 3, rgb('#f0ede6')); p.set(SX + 20, ty - 2 + up, rgb('#cfcabd'))
  } else if (act === 'arcade' || act === 'foos') {
    for (const [x, o] of [[SX - 1, f], [SX + 16, 1 - f]] as const) {
      for (let j = 2; j < 6; j++) p.set(x, ty + j + (act === 'foos' ? 2 : 0) - o, cB)
      p.rect(x - (x < SX ? 0 : 0), ty + 6 + (act === 'foos' ? 2 : 0) - o, 2, 2, skin)
    }
  }
  // cabeça
  if (view === 'front') {
    const top = { short: HEAD_SHORT, ponytail: HEAD_PONY, curly: HEAD_CURLY, swept: HEAD_SWEPT }[style.hairStyle]
    blit(p, [...top, ...HEAD_FACE], SHX, hy, pal)
    if (style.hairStyle === 'ponytail') [[13, 4], [14, 4], [14, 5], [15, 5], [15, 6], [15, 7], [14, 8], [14, 9]].forEach(([x, y], i) => p.set(SHX + x, hy + y, i % 2 ? hairHi : hair))
    face(p, SHX, hy, act === 'foos' || act === 'walk' || act === 'idle' ? 'neutral' : 'neutral', style, skin, skinSh, hairDark)
  } else {
    blit(p, backHead(style), SHX, hy, pal)
    p.set(SHX, hy + 9, skin); p.set(SHX + 13, hy + 9, skinSh)
    if (style.hairStyle === 'ponytail') for (let j = 8; j < 16; j++) { p.set(SHX + 6, hy + j, j % 2 ? hairHi : hair); p.set(SHX + 7, hy + j, hair) }
  }
  if (style.headset) {
    const dark = rgb('#17181a')
    for (let i = 2; i < 12; i++) p.set(SHX + i, hy + 1, dark)
    for (let j = 2; j < 9; j++) { p.set(SHX + 1, hy + j, dark); p.set(SHX + 12, hy + j, dark) }
    for (let j = 8; j < 11; j++) { p.set(SHX, hy + j, dark); p.set(SHX + 13, hy + j, dark) }
    if (view === 'front') { p.set(SHX + 1, hy + 11, dark); p.set(SHX + 2, hy + 12, dark); p.set(SHX + 3, hy + 12, dark); p.set(SHX + 4, hy + 12, rgb('#d9702f')) }
  }
  outline(p)
  const c = p.toCanvas()
  cache.set(id, c)
  return c
}

/** Só a cabeça (usada na cama, sobre o travesseiro). */
export function headSprite(key: string, style: CharStyle): HTMLCanvasElement {
  const id = `head|${key}`
  const hit = cache.get(id)
  if (hit) return hit
  const [skin, skinSh] = style.skin.map(rgb)
  const [hair, hairHi] = style.hair.map(rgb)
  const pal: Record<string, RGB> = { S: skin, s: skinSh, H: hair, h: hairHi, g: rgb('#241812') }
  const p = new Pix(18, 15)
  const top = { short: HEAD_SHORT, ponytail: HEAD_PONY, curly: HEAD_CURLY, swept: HEAD_SWEPT }[style.hairStyle]
  blit(p, [...top, ...HEAD_FACE], 2, 1, pal)
  face(p, 2, 1, 'closed', style, skin, skinSh, rgb('#241812'))
  outline(p)
  const c = p.toCanvas()
  cache.set(id, c)
  return c
}

/** Plaquinha com o nome do agente (fonte de pixels 3×5), com faixa na cor da roupa e ponteiro para baixo. */
export function nameTag(name: string, color: string): HTMLCanvasElement {
  const id = `tag|${name}|${color}`
  const hit = cache.get(id)
  if (hit) return hit
  const tw = name.length * 4 - 1
  const w = tw + 8, h = 11
  const p = new Pix(w, h + 3)
  const bg = rgb('#17181a'), fg = rgb('#f5f5f5')
  p.rect(0, 0, w, h, bg)
  p.rect(0, 0, 2, h, rgb(color))
  for (let j = 0; j < 5; j++) [...name].forEach((ch, i) => [0, 1, 2].forEach((k) => GLYPH[ch]?.[j]?.[k] === '#' && p.set(4 + i * 4 + k, 3 + j, fg)))
  const m = Math.floor(w / 2)
  p.set(m - 1, h, bg); p.set(m, h, bg); p.set(m + 1, h, bg); p.set(m, h + 1, bg)
  // borda clara de 1 px
  for (let x = 0; x < w; x++) { p.set(x, 0, rgb('#6a6a70')); p.set(x, h - 1, rgb('#6a6a70')) }
  for (let y = 0; y < h; y++) p.set(w - 1, y, rgb('#6a6a70'))
  const c = p.toCanvas()
  cache.set(id, c)
  return c
}
