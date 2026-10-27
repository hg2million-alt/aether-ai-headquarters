import type { AgentId, AgentStatus } from './types'

/** Posição de cada escritório no prédio: andar (0 = térreo) e coluna (0 = esquerda). */
export const layout: Record<AgentId, { floor: number; col: number }> = {
  scout: { floor: 0, col: 0 },
  atlas: { floor: 0, col: 1 },
  sentinel: { floor: 1, col: 0 },
  nova: { floor: 1, col: 1 },
  mercury: { floor: 2, col: 0 },
}

const resting: AgentStatus[] = ['idle', 'sleeping']

/** Modo noturno: todos confirmadamente inativos. `unknown` não conta como inativo. */
export function isNight(statuses: Record<AgentId, AgentStatus>): boolean {
  return Object.values(statuses).every((s) => resting.includes(s))
}
