import type { AgentStatus } from '../lib/types'
import { Pix, rgb, type RGB } from './raster'

/**
 * Sprites de personagens desenhados em grades de pixels (20×30). O mesmo desenho serve a todos os
 * agentes: a paleta e os acessórios mudam por CharStyle. O contorno de 1 px é gerado automaticamente.
 */
export interface CharStyle {
  skin: [string, string]
  hair: [string, string]
  shirt: [string, string, string] // base, sombra, luz
  accent: string
  hairStyle: 'short' | 'ponytail'
  outfit: 'hoodie' | 'vest'
  glasses?: boolean
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
export function charSprite(key: string, style: CharStyle, state: AgentStatus, tick: number): HTMLCanvasElement {
  const phase = state === 'sleeping' || state === 'idle' ? (tick >> 1) % 2 : state === 'working' || state === 'completed' || state === 'failed' ? tick % 2 : 0
  const blink = state === 'idle' && tick % 16 === 9
  const id = `${key}|${state}|${phase}|${blink}`
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
  blit(p, [...(style.hairStyle === 'short' ? HEAD_SHORT : HEAD_PONY), ...HEAD_FACE], hx, hy, pal)
  if (style.hairStyle === 'ponytail') {
    ;[[13, 4], [14, 4], [14, 5], [15, 5], [15, 6], [15, 7], [14, 8], [14, 9]].forEach(([x, y], i) => p.set(hx + x, hy + y + (state === 'working' ? 0 : phase && i > 4 ? 1 : 0), i % 2 ? hairHi : hair))
  }
  const kind: Face = blink || asleep ? 'closed' : state === 'completed' ? 'happy' : state === 'failed' ? 'frown' : state === 'working' ? 'down' : 'neutral'
  face(p, hx, hy, kind, style, skin, skinSh, hairDark)
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

const GLYPH: Record<string, string[]> = {
  '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  z: ['...', '###', '.#.', '###', '...'],
  v: ['...', '..#', '#.#', '.#.', '...'],
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
