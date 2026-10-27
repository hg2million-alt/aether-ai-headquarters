import type { AgentId, AgentStatus } from '../lib/types'
import { bubbleSprite, charSprite, handsSprite, SPRITE_BASE, SPRITE_H, SPRITE_W, type CharStyle } from './characters'
import { buildChair, buildDesk, buildProps } from './furniture'
import { Pix, proj, rgb } from './raster'
import { buildRoom, ORIGIN, SCENE_H, SCENE_W } from './room'

export interface StationSpec { id: AgentId; gx: number; gy: number; style: CharStyle }

/** Cinco estações (mesa com monitor, cadeira e pessoa). Linha de trás: SCOUT, ATLAS, SENTINEL; linha da frente: NOVA, MERCURY; sofá à direita. */
const DESK_W = 1.6
/** Posição da pessoa ao longo da mesa (à direita do monitor principal). */
const PERSON = 0.85

export const STATIONS: StationSpec[] = [
  { id: 'scout', gx: 0.1, gy: 1.1, style: { skin: ['#c98e63', '#a8704a'], hair: ['#3a2518', '#59392a'], shirt: ['#7a8450', '#5f6840', '#98a367'], accent: '#c9b27a', hairStyle: 'ponytail', outfit: 'vest' } },
  { id: 'atlas', gx: 2.15, gy: 1.1, style: { skin: ['#f1c9a5', '#d9a47e'], hair: ['#7b3f24', '#a05a36'], shirt: ['#5b6b80', '#44525f', '#7c8da3'], accent: '#d8d8d8', hairStyle: 'short', outfit: 'hoodie', glasses: true } },
  { id: 'sentinel', gx: 4.2, gy: 1.1, style: { skin: ['#7a4b32', '#5e3825'], hair: ['#1a1310', '#2f241b'], shirt: ['#f2f2f0', '#cfcfd2', '#ffffff'], accent: '#7aa0c8', hairStyle: 'curly', outfit: 'coat' } },
  { id: 'nova', gx: 1.9, gy: 3.8, style: { skin: ['#b98259', '#966540'], hair: ['#15110d', '#2a221b'], shirt: ['#27406b', '#1b2d4c', '#3b5a8c'], accent: '#d9702f', hairStyle: 'short', outfit: 'jumpsuit', headset: true } },
  { id: 'mercury', gx: 3.9, gy: 3.8, style: { skin: ['#dcaa84', '#b98963'], hair: ['#3b2a1e', '#5a4130'], shirt: ['#2a3246', '#1c2233', '#3d4963'], accent: '#f0f0f0', hairStyle: 'swept', outfit: 'blazer' } },
]

interface Built { spec: StationSpec; chair: HTMLCanvasElement; desks: HTMLCanvasElement[]; ax: number; ay: number; depth: number; lights: Pix }

export class Scene {
  readonly room = buildRoom().toCanvas()
  readonly props = buildProps().toCanvas()
  readonly built: Built[] = STATIONS.map((spec) => {
    const [ax, ay] = proj(ORIGIN, spec.gx + PERSON, spec.gy - 0.25, 11)
    const lights = new Pix(SCENE_W, SCENE_H)
    const lamp = proj(ORIGIN, spec.gx + 0.15, spec.gy + 0.18, 16)
    lights.glow(lamp[0] - 3, lamp[1] - 7, 10, rgb('#ffcf80'), 0.8)
    return {
      spec, ax, ay, depth: spec.gx + spec.gy, lights,
      chair: buildChair(spec.gx + PERSON - 0.4, spec.gy - 0.8).toCanvas(),
      desks: [true, false].map((on) => buildDesk({ gx: spec.gx, gy: spec.gy, on, w: DESK_W }).toCanvas()),
    }
  })
  /** Luzes ligadas só à noite (arandelas + abajures) */
  readonly nightLights = (() => {
    const l = new Pix(SCENE_W, SCENE_H)
    const { ox, oy } = ORIGIN
    for (const [x, y] of [[ox + 14, oy + 7 - 38], [ox + 90, oy + 45 - 38], [ox - 10, oy + 5 - 38], [ox - 70, oy + 35 - 38]]) l.glow(x, y, 11, rgb('#ffb866'), 0.75)
    return l.toCanvas()
  })()

  draw(ctx: CanvasRenderingContext2D, states: Partial<Record<AgentId, AgentStatus>>, tick: number, night: boolean, selected: AgentId | null) {
    ctx.clearRect(0, 0, SCENE_W, SCENE_H)
    ctx.drawImage(this.room, 0, 0)
    for (const b of [...this.built].sort((a, c) => a.depth - c.depth)) {
      const st = states[b.spec.id] ?? 'unknown'
      ctx.drawImage(b.chair, 0, 0)
      ctx.drawImage(charSprite(b.spec.id, b.spec.style, st, tick), b.ax - SPRITE_W / 2, b.ay - SPRITE_BASE)
      ctx.drawImage(b.desks[st === 'working' ? 0 : 1], 0, 0)
      const hands = handsSprite(b.spec.style, st, tick)
      if (hands) {
        const [hx, hy] = proj(ORIGIN, b.spec.gx + DESK_W / 2 + 0.05, b.spec.gy + 0.55, 17)
        ctx.drawImage(hands, hx - 3, hy - 4)
      }
      const bubble = bubbleSprite(st, tick)
      if (bubble) ctx.drawImage(bubble, b.ax - 3, b.ay - SPRITE_BASE + 4 - bubble.height + (tick % 4 < 2 ? 0 : 1))
    }
    ctx.drawImage(this.props, 0, 0)
    if (night) {
      ctx.globalCompositeOperation = 'source-atop'
      ctx.fillStyle = 'rgba(14,20,52,0.42)'
      ctx.fillRect(0, 0, SCENE_W, SCENE_H)
      ctx.globalCompositeOperation = 'screen'
      ctx.drawImage(this.nightLights, 0, 0)
      for (const b of this.built) ctx.drawImage(b.lights.toCanvas(), 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    }
    if (selected) {
      const b = this.built.find((x) => x.spec.id === selected)
      if (b) {
        const y = b.ay - SPRITE_BASE - 12 + (tick % 4 < 2 ? 0 : 1), x = b.ax + 1
        ctx.fillStyle = '#ffffff'
        for (let i = 0; i < 4; i++) ctx.fillRect(x - 3 + i, y + i, 7 - i * 2, 1)
      }
    }
  }

  /** Retângulos clicáveis (coordenadas internas) de cada personagem. */
  hitBoxes() {
    return this.built.map((b) => ({ id: b.spec.id, x: b.ax - 14, y: b.ay - 34, w: 28, h: 40 }))
  }
}

export { SPRITE_H }
