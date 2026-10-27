import { useEffect, useState } from 'react'
import type { Connection, HqSnapshot } from '../lib/types'
import { buildSnapshot, parseEvents } from './live'

/**
 * Fonte de dados do HQ: eventos autenticados do Worker (GET /events). Hospedado no Pages, usa o
 * próprio site (`/events`); no arquivo offline, o endereço vem de Ajustes. A leitura exige a
 * "chave de leitura" (digitada uma vez em Ajustes, guardada só neste aparelho). Nada de segredo no bundle.
 */
const URL_KEY = 'aether.eventsUrl'
const READ_KEY = 'aether.readKey'
const POLL_MS = 15000

const store = {
  get(k: string): string {
    try {
      return localStorage.getItem(k) ?? ''
    } catch {
      return ''
    }
  },
  set(k: string, v: string) {
    try {
      if (v) localStorage.setItem(k, v)
      else localStorage.removeItem(k)
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
    window.dispatchEvent(new Event('aether-config'))
  },
}

/** Padrão: o próprio site quando hospedado no Pages; vazio no arquivo offline. */
const defaultUrl = () => (location.hostname.endsWith('.pages.dev') ? '/events' : (import.meta.env.VITE_EVENTS_URL ?? ''))

export const getEventsUrl = () => store.get(URL_KEY) || defaultUrl()
export const getStoredUrl = () => store.get(URL_KEY)
export const setEventsUrl = (v: string) => store.set(URL_KEY, v)
export const getReadKey = () => store.get(READ_KEY)
export const setReadKey = (v: string) => store.set(READ_KEY, v)

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`)
  }
}

export async function fetchSnapshot(url: string, key = getReadKey()): Promise<HqSnapshot> {
  if (!url) return buildSnapshot([], 'not_configured')
  const res = await fetch(url, { headers: { accept: 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) } })
  if (!res.ok) throw new HttpError(res.status)
  return buildSnapshot(parseEvents(await res.json()), 'online')
}

const empty = (c: Connection): HqSnapshot => buildSnapshot([], c)

export function useSnapshot(): HqSnapshot {
  const [cfg, setCfg] = useState(() => ({ url: getEventsUrl(), key: getReadKey() }))
  const [snap, setSnap] = useState<HqSnapshot>(() => empty(getEventsUrl() ? 'connecting' : 'not_configured'))

  useEffect(() => {
    const on = () => setCfg({ url: getEventsUrl(), key: getReadKey() })
    window.addEventListener('aether-config', on)
    return () => window.removeEventListener('aether-config', on)
  }, [])

  useEffect(() => {
    let alive = true
    const tick = () =>
      fetchSnapshot(cfg.url, cfg.key)
        .then((s) => alive && setSnap(s))
        .catch((e) => alive && setSnap((p) => ({ ...p, connection: e instanceof HttpError && (e.status === 401 || e.status === 403) ? 'unauthorized' : 'error' }))) // mantém o último estado
    setSnap((p) => (cfg.url ? { ...p, connection: 'connecting' } : empty('not_configured')))
    tick()
    if (!cfg.url) return () => { alive = false }
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [cfg])

  return snap
}
