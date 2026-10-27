import type { AgentId, AgentStatus } from './types'

/** Posição de cada mesa no escritório aberto (centro da mesa, em unidades da cena). */
export const layout: Record<AgentId, { x: number; z: number }> = {
  scout: { x: -2.2, z: -2.15 },
  atlas: { x: 0, z: -2.15 },
  sentinel: { x: 2.2, z: -2.15 },
  nova: { x: -1.1, z: 0.45 },
  mercury: { x: 1.1, z: 0.45 },
}

const resting: AgentStatus[] = ['idle', 'sleeping']

/** Modo noturno: todos confirmadamente inativos. `unknown` não conta como inativo. */
export function isNight(statuses: Record<AgentId, AgentStatus>): boolean {
  return Object.values(statuses).every((s) => resting.includes(s))
}
