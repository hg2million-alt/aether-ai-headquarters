import { useEffect, useState } from 'react'
import type { Connection, HqSnapshot } from '../lib/types'
import { buildSnapshot, parseEvents } from './live'

/**
 * Fonte de dados do HQ: eventos autenticados vindos do Worker (GET /events). Sem URL configurada,
 * o painel fica zerado ("não conectado"). Nenhum segredo no frontend: o acesso de leitura deve ser
 * protegido por Cloudflare Access (cookie de sessão) — ver INTEGRATION.md.
 */
const KEY = 'aether.eventsUrl'
const POLL_MS = 15000

export function getEventsUrl(): string {
  try {
    return localStorage.getItem(KEY) ?? import.meta.env.VITE_EVENTS_URL ?? ''
  } catch {
    return import.meta.env.VITE_EVENTS_URL ?? ''
  }
}

export function setEventsUrl(url: string) {
  try {
    if (url) localStorage.setItem(KEY, url)
    else localStorage.removeItem(KEY)
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
  window.dispatchEvent(new Event('aether-config'))
}

export async function fetchSnapshot(url: string): Promise<HqSnapshot> {
  if (!url) return buildSnapshot([], 'not_configured')
  const res = await fetch(url, { credentials: 'include', headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return buildSnapshot(parseEvents(await res.json()), 'online')
}

const empty = (c: Connection): HqSnapshot => buildSnapshot([], c)

export function useSnapshot(): HqSnapshot {
  const [url, setUrl] = useState(getEventsUrl)
  const [snap, setSnap] = useState<HqSnapshot>(() => empty(getEventsUrl() ? 'connecting' : 'not_configured'))

  useEffect(() => {
    const on = () => setUrl(getEventsUrl())
    window.addEventListener('aether-config', on)
    return () => window.removeEventListener('aether-config', on)
  }, [])

  useEffect(() => {
    let alive = true
    const tick = () =>
      fetchSnapshot(url)
        .then((s) => alive && setSnap(s))
        .catch(() => alive && setSnap((p) => ({ ...p, connection: 'error' }))) // mantém o último estado conhecido
    setSnap((p) => (url ? { ...p, connection: 'connecting' } : empty('not_configured')))
    tick()
    if (!url) return () => { alive = false }
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [url])

  return snap
}
