/** Reprodução em SVG do logotipo oficial (círculo, domo e três arcos) + wordmark tipográfico. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <clipPath id="aether-c"><circle cx="50" cy="50" r="50" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill="#171719" />
      <g clipPath="url(#aether-c)" fill="none" strokeLinecap="butt">
        <path d="M0 66.5A123 123 0 0 1 100 66.5" stroke="#F5F5F5" strokeOpacity=".22" strokeWidth="1.6" />
        <path d="M2 70A123 123 0 0 1 98 70" stroke="#F5F5F5" strokeOpacity=".5" strokeWidth="2" />
        <path d="M5 73.5A123 123 0 0 1 95 73.5" stroke="#F5F5F5" strokeWidth="3" />
        <path d="M37.5 60a12.5 12.5 0 0 1 25 0z" fill="#F5F5F5" stroke="none" />
      </g>
    </svg>
  )
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3" aria-label="Æther Studio">
      <LogoMark size={size} />
      <span className="flex flex-col items-start leading-none">
        <span className="text-lg font-light tracking-[0.18em] text-fg">ÆTHER</span>
        <span className="mt-1 text-[9px] font-light tracking-[0.6em] text-fg-2">STUDIO</span>
      </span>
    </span>
  )
}
