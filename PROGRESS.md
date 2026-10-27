# PROGRESS
**Etapa atual:** Fase 7 concluída (sem publicar). Projeto pronto para aprovação de publicação.

## Concluído
- Fase 1–2: fundação, tokens, navegação mobile, Painel/Histórico (dados simulados rotulados), logo SVG.
- Fase 3–4: cena 3D (lazy, pausa fora da tela, reduced-motion, fallback 2D), 5 robôs com estados, modo noturno, seleção por toque.
- Estilização do escritório (1 andar, sem teto): tijolo, piso de madeira, janelas, arandelas, telão, sofá, plantas, estante, bebedouro; cenário estático **fundido em uma malha por material** (`src/office/staticScene.ts`). Robôs vestidos por função (`src/office/Robot.tsx`).
- Visual menos "quadrado": cenário com formas curvas (lajes de cantos arredondados, pernas/cadeiras/mesas cilíndricas, vasos cônicos, folhagem em esferas, sofá macio); robôs com cabeça/corpo arredondados, membros em cápsula e acessórios curvos (boné em domo, fones com arco).
- Fase 5: gamificação determinística. Fase 6: contrato de eventos, HMAC, Worker/D1 (esqueleto testado), camada de dados.
- Fase 7: `scripts/check-ui.cjs` (7 larguras × 5 rotas: overflow, h1, landmarks, nomes acessíveis, alvos ≥44px → OK); contraste `fg-3` corrigido (AA); skip link; CSP/headers em `public/_headers` testados sem violações; `npm audit` 0 vulnerabilidades; sem segredos/fetch/eval no frontend; Worker rejeita corpo grande antes de ler; 18 testes OK.

## Pendências
- FPS em Android real NÃO medido (software render: ~48 FPS em 390px, só indicativo).
- Worker/D1/Access não criados; leitura pelo navegador exige Cloudflare Access + JWT; sem rate limiting.
- Ajustes ainda placeholder; robôs de costas para a câmera.
- Teste em leitor de tela real não feito (só verificações automáticas).

## Próxima tarefa
Aprovação do dono para publicar no Pages; depois criar Worker/D1/Access (INTEGRATION.md). Em seguida: adaptar a automação original para emitir eventos assinados.

## Problemas conhecidos
Chunk do 3D ~246KB gzip (lazy; aceitável).
