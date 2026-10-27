import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-bg-2 p-4 ${className}`}>{children}</section>
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-label text-fg-2">{children}</p>
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
