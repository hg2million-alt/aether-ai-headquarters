/** Representação tipográfica temporária. Substituir pelo arquivo oficial do logotipo quando disponível. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-light uppercase tracking-title text-fg ${className}`} aria-label="Æther Studio">
      ÆTHER <span className="text-fg-3">STUDIO</span>
    </span>
  )
}
