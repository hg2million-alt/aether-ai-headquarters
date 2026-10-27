import { routes, type RouteId } from '../lib/nav'

export function BottomNav({ active }: { active: RouteId }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur md:static md:border-t-0 md:border-r md:w-56 md:shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-xl justify-between px-1 md:max-w-none md:flex-col md:gap-1 md:p-3">
        {routes.map((r) => {
          const on = r.id === active
          return (
            <li key={r.id} className="flex-1">
              <a
                href={`#/${r.id}`}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] uppercase tracking-label transition-colors md:min-h-11 md:flex-row md:justify-start md:gap-3 md:px-3 md:text-xs ${
                  on ? 'text-white' : 'text-fg-3 hover:text-fg-2'
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 1.8 : 1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={r.icon} />
                </svg>
                {r.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
