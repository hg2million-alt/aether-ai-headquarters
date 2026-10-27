# PROGRESS
**Etapa atual:** Fase 5 concluída. Próxima: Fase 6 (preparação de integração).

## Concluído
- Fase 1–2: fundação, tokens, navegação, Painel/Histórico (dados simulados rotulados), logo SVG.
- Fase 3–4: cena 3D otimizada; prédio em corte com térreo (recepção), 3 andares de escritórios (layout em `src/lib/office.ts`), pilares/faixas de fachada, teto com platibanda/caixa d'água/antena; 5 robôs com estados, modo noturno, seleção por toque.
- Fase 5: gamificação determinística (`src/lib/gamification.ts`):
  - XP por tabela fixa (`XP_TABLE`) só para eventos `status=completed` com `kind` e `verified=true`; dedupe por `eventId` e por `(taskId, kind)`; níveis `50·L·(L−1)`; 6 conquistas; histórico de recompensas; stats por agente.
  - Página Agentes: XP total/nível, por agente, conquistas, histórico. XP real = 0 (nada verificado); botão "Pré-visualizar com eventos simulados" usa `includeUnverified` (rotulado).
  - 6 testes (`npm test`, node:test): não verificado=0, dedupe, só completed, níveis, meta diária, determinismo.

## Pendências
- Desempenho 3D em Android real não medido.
- Robôs de costas para a câmera.
- Conquistas/XP ainda não persistem (tudo derivado de eventos; persistência virá com D1).
- Ajustes ainda placeholder.

## Próxima tarefa
Fase 6: contratos de evento (validação, assinatura HMAC, deduplicação), camada de dados abstrata (mock → API), esqueleto Worker/D1 sem segredos, plano de autenticação.

## Problemas conhecidos
Chunk do 3D > 500KB (lazy; aceitável).
