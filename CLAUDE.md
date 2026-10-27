# CLAUDE.md
Especificação completa: `PROJECT_SPEC.md`. Estado atual: `PROGRESS.md` (ler primeiro, não reler o repo inteiro).

- Usuário trabalha só pelo celular (Claude Code Web). Respostas curtas: resumo, testes, problemas, próximo passo.
- Economize tokens: sem subagentes salvo benefício claro; lógica determinística em código, nunca IA para XP/animação/métricas.
- Visual: UI monocromática (tokens em `src/index.css` / `src/lib/tokens.ts`). Sem pixel art/gradientes. **Exceção decidida pelo dono:** a cena 3D (`src/office/`) usa ambientação quente (tijolo, madeira, luz âmbar) e robôs vestidos por função; cores só dentro da cena.
- Dados simulados devem ser rotulados; nunca apresentar como resultado real.
- Não tocar no repositório original da automação; não commitar segredos; não publicar em produção sem aprovação.
- Comandos: `npm run dev` · `npm run build` (inclui typecheck) · `npm test`.
- Trabalhar uma fase por vez; atualizar `PROGRESS.md` ao terminar.
