/** Fallback estático quando WebGL não está disponível ou a cena falha. */
export function Fallback2D({ reason }: { reason: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <svg viewBox="0 0 160 110" className="w-40" fill="none" stroke="#929296" strokeWidth="1.2" aria-hidden>
        <path d="M80 10 150 50 80 90 10 50z" fill="#171719" />
        <path d="M10 50v14l70 40 70-40V50" />
        <path d="M80 90v14" />
        <rect x="64" y="38" width="32" height="14" fill="#202022" />
        <circle cx="80" cy="62" r="6" fill="#F5F5F5" stroke="none" />
      </svg>
      <p className="text-[11px] uppercase tracking-[0.12em] text-fg-2">Visualização 2D</p>
      <p className="text-xs text-fg-3">{reason}</p>
    </div>
  )
}
