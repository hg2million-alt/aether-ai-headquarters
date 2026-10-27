# PROGRESS
**Etapa atual:** Fase 4 concluída. Próxima: Fase 5 (Gamificação).

## Concluído
- Fase 1–2: fundação, tokens, navegação, Painel/Histórico com dados simulados rotulados, logo SVG.
- Fase 3: cena 3D otimizada (lazy, materiais/geometria compartilhados, pausa fora da tela, reduced-motion, fallback 2D).
- Fase 4: escritório remodelado como **prédio em corte** (3 andares × 2 salas; layout em `src/lib/office.ts`), cinco robôs com acessório próprio (SCOUT/ATLAS/SENTINEL/NOVA/MERCURY), sala de reunião decorativa.
  - Estados iniciais vêm de `mockSnapshot.agents`; os 6 estados têm pose/animação própria.
  - Modo noturno (`isNight`): todos idle/sleeping → luz reduzida; `unknown` NÃO conta como inativo.
  - Interação: toque no escritório ou nos chips seleciona o agente; card com função, estado e último evento (simulado); botões "Simular estado", "Todos descansam", "Restaurar" (pré-visualização local).
  - Verificado em 360px (headless): 5 robôs renderizam, toque seleciona, noturno ativa, sem overflow/erros.

## Pendências
- Desempenho em Android real não medido (5 robôs ≈ 100+ meshes; considerar instanciar se FPS cair).
- Robôs de costas para a câmera (rosto não visível); revisar na Fase 7 se desejado.
- Sem testes automatizados; página Agentes e Ajustes ainda placeholders.

## Próxima tarefa
Fase 5: XP determinístico (só eventos verificados, sem duplicar), níveis, conquistas, histórico de recompensas, estatísticas por agente.

## Problemas conhecidos
Chunk do 3D > 500KB (lazy; aceitável).
