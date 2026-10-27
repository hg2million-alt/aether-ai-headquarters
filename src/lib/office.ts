import type { AgentId, AgentStatus } from './types'

/** Andares do prédio: 0 = recepção (térreo), 1–3 = escritórios. */
export const FLOORS = 4

/** Posição de cada escritório: andar e coluna (0 = esquerda). */
export const layout: Record<AgentId, { floor: number; col: number }> = {
  scout: { floor: 1, col: 0 },
  atlas: { floor: 1, col: 1 },
  sentinel: { floor: 2, col: 0 },
  nova: { floor: 2, col: 1 },
  mercury: { floor: 3, col: 0 },
}

const resting: AgentStatus[] = ['idle', 'sleeping']

/** Modo noturno: todos confirmadamente inativos. `unknown` não conta como inativo. */
export function isNight(statuses: Record<AgentId, AgentStatus>): boolean {
  return Object.values(statuses).every((s) => resting.includes(s))
}
