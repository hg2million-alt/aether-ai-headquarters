# CLAUDE.md
Especificação completa: `PROJECT_SPEC.md`. Estado atual: `PROGRESS.md` (ler primeiro, não reler o repo inteiro).

- Usuário trabalha só pelo celular (Claude Code Web). Respostas curtas: resumo, testes, problemas, próximo passo.
- Economize tokens: sem subagentes salvo benefício claro; lógica determinística em código, nunca IA para XP/animação/métricas.
- Visual: UI monocromática (tokens em `src/index.css` / `src/lib/tokens.ts`). **Escritório = pixel art isométrica 2D** (`src/office2d/`, Canvas 2D, sem Three.js/3D/GLB/emojis/divs-como-sprite); cores moderadas só dentro da cena (madeira, tijolo, plantas, roupas). Sprites são grades de pixels autorais; novos personagens = nova paleta/estilo em `CharStyle`. Estado atual: mundo 30×20 com 4 salas; agentes ociosos circulam (lógica pura e testada em `behavior.ts`/`path.ts`/`layout.ts` — manter sem DOM e com imports `.ts`).
- Sem dados fictícios: o app mostra só eventos autenticados vindos do Worker (sem eventos = tudo zerado, agentes "sem sinal"). Nunca inventar números ou tarefas.
- Não tocar no repositório original da automação; não commitar segredos; não publicar em produção sem aprovação.
- Comandos: `npm run dev` · `npm run build` (inclui typecheck) · `npm test`.
- Trabalhar uma fase por vez; atualizar `PROGRESS.md` ao terminar.
