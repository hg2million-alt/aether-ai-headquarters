import { useEffect, useState } from 'react'
import type { HqSnapshot } from '../lib/types'
import { mockSnapshot } from './mock'

/**
 * Fonte de dados do HQ. Hoje: simulada. Fase 7+: trocar `load` por chamada ao Worker
 * (GET /events atrás de Cloudflare Access) e montar o snapshot com `source: 'verified'`.
 * Nenhum segredo pode ficar no bundle do frontend.
 */
export interface HqDataSource {
  initial: HqSnapshot
  load(): Promise<HqSnapshot>
}

export const dataSource: HqDataSource = {
  initial: mockSnapshot,
  load: async () => mockSnapshot,
}

export function useSnapshot(): HqSnapshot {
  const [snap, setSnap] = useState(dataSource.initial)
  useEffect(() => {
    let alive = true
    dataSource.load().then((s) => alive && setSnap(s)).catch(() => {}) // falha: mantém o último estado conhecido
    return () => {
      alive = false
    }
  }, [])
  return snap
}
