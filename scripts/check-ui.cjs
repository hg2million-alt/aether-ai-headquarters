/* Verificação de UI (opcional): usa o Playwright já instalado no ambiente.
 * Uso: npm run build && npx vite preview --port 4173 &  →  node scripts/check-ui.cjs [url] */
const { chromium } = require('playwright')
const base = process.argv[2] || 'http://localhost:4173'
const widths = [360, 375, 390, 412, 430, 768, 1280]
const routes = ['dashboard', 'office', 'agents', 'history', 'settings']

;(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const problems = []
  for (const w of widths) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } })
    const errs = []
    p.on('pageerror', (e) => errs.push(e.message))
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
    for (const r of routes) {
      await p.goto(`${base}/#/${r}`)
      await p.waitForTimeout(r === 'office' ? 1200 : 150)
      const res = await p.evaluate(() => {
        const out = []
        if (document.documentElement.scrollWidth > innerWidth) out.push('overflow horizontal')
        if (document.querySelectorAll('h1').length !== 1) out.push('h1 != 1')
        if (!document.querySelector('main') || !document.querySelector('nav[aria-label]')) out.push('landmarks ausentes')
        for (const el of document.querySelectorAll('button, a[href]')) {
          if (el.classList.contains('sr-only')) continue
          const r = el.getBoundingClientRect()
          const name = (el.getAttribute('aria-label') || el.textContent || '').trim()
          if (!name) out.push('sem nome acessível: ' + el.outerHTML.slice(0, 60))
          if (r.height < 44 || r.width < 44) out.push(`alvo pequeno ${Math.round(r.width)}x${Math.round(r.height)}: ${name.slice(0, 20)}`)
        }
        return out
      })
      res.forEach((x) => problems.push(`${w}px #/${r}: ${x}`))
    }
    errs.forEach((e) => problems.push(`${w}px console: ${e}`))
    await p.close()
  }
  console.log(problems.length ? problems.join('\n') : 'OK: sem problemas')
  await b.close()
  process.exit(problems.length ? 1 : 0)
})()
