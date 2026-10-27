import { formatDateTime } from '../lib/format'
import { STATUS_PT } from '../lib/labels'
import type { ActivityEvent } from '../lib/types'
import { Badge } from './ui'

export function ActivityList({ events, limit }: { events: ActivityEvent[]; limit?: number }) {
  const items = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
  if (items.length === 0) return <p className="text-sm text-fg-3">Sem eventos registrados.</p>
  return (
    <ul className="divide-y divide-line">
      {items.map((e) => (
        <li key={e.eventId} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-label text-fg-2">{e.agentId}</p>
            <p className="mt-1 text-sm text-fg">{e.activity}</p>
            <p className="mt-1 text-xs tabular-nums text-fg-3">{formatDateTime(e.timestamp)}</p>
          </div>
          <Badge>{STATUS_PT[e.status]}</Badge>
        </li>
      ))}
    </ul>
  )
}
