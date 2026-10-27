# PROGRESS
**Etapa atual:** Fase 6 concluída. Próxima: Fase 7 (testes e publicação).

## Concluído
- Fase 1–2: fundação, tokens, navegação, Painel/Histórico (dados simulados rotulados), logo SVG.
- Fase 3–4: cena 3D otimizada (lazy, materiais compartilhados, pausa fora da tela, reduced-motion, fallback 2D), 5 robôs com estados, modo noturno, seleção por toque. **Cena atual: escritório aberto de UM andar, sem teto (diorama), estilo definido pelo usuário** (layout em `src/lib/office.ts`).
- Fase 5: gamificação determinística (`src/lib/gamification.ts`): XP só de eventos verificados e concluídos, dedupe, níveis, conquistas.
- Fase 6: `src/shared/events.ts` (contrato, validação estrita, dedupe, estado `unknown`), `src/shared/auth.ts` (HMAC + anti-replay), `worker/` (Worker + schema D1 + wrangler.toml sem segredos), `src/data/source.ts` (camada de dados; hoje mock), `INTEGRATION.md` (plano de autenticação).
- 18 testes (`npm test`): gamificação, contrato, HMAC, Worker com D1 falso (401/400/dedupe/falha fechada).

## Pendências
- Nada foi publicado: Worker/D1/Access não criados (precisam de aprovação).
- Leitura pelo navegador exige Cloudflare Access + validação de JWT (não implementado).
- Desempenho 3D em Android real não medido; robôs de costas para a câmera.
- Ajustes ainda placeholder; sem rate limiting no Worker.

## Próxima tarefa
Fase 7: testes de responsividade/acessibilidade/desempenho, revisão de segurança, preparar Cloudflare Pages (sem publicar sem aprovação).

## Problemas conhecidos
Chunk do 3D > 500KB (lazy; aceitável).
