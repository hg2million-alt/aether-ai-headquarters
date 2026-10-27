import type { AgentId } from '../lib/types'
import type { CharStyle } from './characters'

/** Aparência de cada agente (paleta, cabelo, roupa e acessórios). */
export const STYLES: Record<AgentId, CharStyle> = {
  scout: { skin: ['#c98e63', '#a8704a'], hair: ['#3a2518', '#59392a'], shirt: ['#7a8450', '#5f6840', '#98a367'], accent: '#c9b27a', pants: '#6d5e3d', shoes: '#4a3222', hairStyle: 'ponytail', outfit: 'vest' },
  atlas: { skin: ['#f1c9a5', '#d9a47e'], hair: ['#7b3f24', '#a05a36'], shirt: ['#5b6b80', '#44525f', '#7c8da3'], accent: '#d8d8d8', pants: '#2f4258', shoes: '#e9e9e9', hairStyle: 'short', outfit: 'hoodie', glasses: true },
  sentinel: { skin: ['#7a4b32', '#5e3825'], hair: ['#1a1310', '#2f241b'], shirt: ['#f2f2f0', '#cfcfd2', '#ffffff'], accent: '#7aa0c8', pants: '#25262b', shoes: '#141414', hairStyle: 'curly', outfit: 'coat' },
  nova: { skin: ['#b98259', '#966540'], hair: ['#15110d', '#2a221b'], shirt: ['#27406b', '#1b2d4c', '#3b5a8c'], accent: '#d9702f', pants: '#27406b', shoes: '#4a3222', hairStyle: 'short', outfit: 'jumpsuit', headset: true },
  mercury: { skin: ['#dcaa84', '#b98963'], hair: ['#3b2a1e', '#5a4130'], shirt: ['#2a3246', '#1c2233', '#3d4963'], accent: '#f0f0f0', pants: '#33363d', shoes: '#3a2a20', hairStyle: 'swept', outfit: 'blazer' },
}
