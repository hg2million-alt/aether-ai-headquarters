import type { ReactNode } from 'react'
import type { Connection } from '../lib/types'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-bg-2 p-4 ${className}`}>{children}</section>
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-2 [overflow-wrap:anywhere]">{children}</p>
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <Label>{label}</Label>
      <p className="mt-3 text-4xl font-extralight tabular-nums text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-3">{hint}</p>}
    </Card>
  )
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-[10px] uppercase tracking-label text-fg-2">
      {children}
    </span>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="px-5 pb-4 pt-6">
      <h1 className="text-xl font-light uppercase tracking-title text-white">{title}</h1>
      <p className="mt-2 text-sm text-fg-2">{subtitle}</p>
    </header>
  )
}

export function Placeholder({ phase, children }: { phase: string; children: ReactNode }) {
  return (
    <Card className="mx-5 border-dashed">
      <Badge>{phase}</Badge>
      <p className="mt-3 text-sm leading-relaxed text-fg-2">{children}</p>
    </Card>
  )
}

const CONN: Record<Connection, string> = {
  not_configured: 'Automação não conectada · nenhum dado ainda',
  connecting: 'Conectando à automação…',
  online: 'Conectado à automação',
  error: 'Sem conexão com a automação · mostrando o último estado',
}

export function ConnectionBanner({ state }: { state: Connection }) {
  if (state === 'online') return null
  return (
    <a href="#/settings" role="status" className="mx-5 mb-4 flex min-h-12 items-center rounded-xl border border-dashed border-line px-4 py-2.5 text-[11px] uppercase tracking-label text-fg-2">
      {CONN[state]}
    </a>
  )
}

export function Progress({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <p className="text-sm tabular-nums text-fg-2">
          <span className="text-2xl font-extralight text-white">{value}</span> / {target}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={value}
        className="mt-3 h-1 overflow-hidden rounded-full bg-elevated"
      >
        <div className="h-full bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
