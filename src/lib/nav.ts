export type RouteId = 'dashboard' | 'office' | 'agents' | 'history' | 'settings'

export const routes: { id: RouteId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Painel', icon: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z' },
  { id: 'office', label: 'Escritório', icon: 'M3 21V9l9-6 9 6v12M9 21v-7h6v7' },
  { id: 'agents', label: 'Agentes', icon: 'M12 8a3 3 0 100-6 3 3 0 000 6zM5 21v-2a5 5 0 015-5h4a5 5 0 015 5v2' },
  { id: 'history', label: 'Histórico', icon: 'M12 7v5l3 2M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5' },
  { id: 'settings', label: 'Ajustes', icon: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4' },
]

export function currentRoute(): RouteId {
  const h = window.location.hash.replace('#/', '')
  return routes.some((r) => r.id === h) ? (h as RouteId) : 'dashboard'
}
