# PROGRESS
**Etapa atual:** Fase 3 concluída. Próxima: Fase 4 (expansão do escritório).

## Concluído
- Fase 1: Vite + React + TS + Tailwind v4, tokens monocromáticos, layout mobile-first, navegação inferior (hash routing).
- Fase 2: tipos, dados simulados rotulados (`src/data/mock.ts`), Painel e Histórico, logo SVG.
- Fase 3: escritório 3D (`src/office/`): sala isométrica low-poly, 1 estação + 1 robô (ATLAS), câmera ortográfica fixa, animações por estado (working/idle/sleeping/unknown).
  - Otimização: R3F carregado via `lazy` (chunk próprio ~243KB gzip; bundle inicial ~74KB), materiais compartilhados, 2 luzes, sem sombras, dpr [1,1.5], `powerPreference: low-power`, render pausado fora da tela/aba oculta (`frameloop: never`), `prefers-reduced-motion` → pose estática (`demand`).
  - Fallback 2D se WebGL indisponível ou erro na cena (ErrorBoundary).
  - Seletor de estado é só pré-visualização, rotulado como simulado.
- Verificado (Playwright/swiftshader, 360px): cena renderiza, sem overflow/erros; fallback 2D OK.

## Pendências
- Sem testes automatizados; desempenho em Android real não medido (só headless).
- Cena não consome dados do snapshot ainda (status local de pré-visualização).
- Agentes e Ajustes ainda são placeholders.

## Próxima tarefa
Fase 4: 5 personagens/estações, estados vindos do snapshot, modo noturno (todos inativos), interações (toque no agente). Medir FPS antes de adicionar mais.

## Problemas conhecidos
Chunk do 3D > 500KB (aviso do Vite, carregado sob demanda; aceitável).
