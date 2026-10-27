# ÆTHER AI HEADQUARTERS — Especificação

Plataforma mobile-first (Android) que serve de centro de operações da Æther Digital Studio (sites e landing pages premium). Dashboard + escritório virtual 3D + gamificação, alimentados futuramente por eventos autenticados da automação existente (repositório separado, **não** copiado para cá).

## Metas comerciais (hipóteses, não resultados)
2 demos/dia, até 14/semana, ≥1 venda/semana; conversão hipotética 10–20%.
Medir separadamente: leads encontrados, qualificados, demos produzidas, publicadas, apresentadas, respostas, propostas, vendas confirmadas. Publicada ≠ contatada.

## Identidade visual
Monocromática, minimalista, premium, arquitetônica. Sem pixel art, sem cores decorativas, sem gradientes coloridos, sem visual SaaS genérico. Grafia ÆTHER STUDIO (wordmark tipográfico temporário; logotipo oficial pendente).
Paleta: bg #0B0B0B · bg2 #171719 · elevada #202022 · borda #353537 · texto #F5F5F5 · texto 2 #929296 · texto 3 #66666A · #FFF · #000.
Tokens: `src/index.css` (`@theme`) e `src/lib/tokens.ts`.

## Mobile-first
Larguras 360/375/390/412/430. Navegação inferior, alvos ≥48px, uso com uma mão, sem scroll horizontal, safe areas, movimento reduzido respeitado. Tablet/desktop secundário (nav lateral).

## Stack
React + TypeScript + Vite + Tailwind v4. 3D: Three.js + React Three Fiber (Fase 3, lazy, com fallback 2D). Futuro: Cloudflare Workers + D1; hospedagem Cloudflare Pages. Sem APIs pagas.

## Dashboard (Fase 2)
Meta diária/semanal, leads qualificados, sites em desenvolvimento/publicados, demos apresentadas, negociações, vendas, receita registrada, agentes ativos/descansando, próxima rotina, histórico. Metas e resultados separados; dados simulados sempre rotulados como tal.

## Escritório 3D (Fases 3–4)
Diorama isométrico low-poly, piso grafite, iluminação branca suave. Agentes (funções, não 5 IAs): SCOUT prospecção, ATLAS desenvolvimento, SENTINEL qualidade, NOVA publicação, MERCURY comercial.
Estados: idle, sleeping, working, completed, failed, unknown. Todos inativos → modo noturno. Sem confirmação confiável → `unknown`; nunca inventar tarefas.
Otimização: materiais compartilhados, poucas luzes, pixel ratio limitado, lazy load, pausa de render, fallback 2D.

## Gamificação (Fase 5)
XP, níveis, conquistas, histórico, estatísticas por agente. XP só por eventos verificados, sem duplicidade, lógica 100% determinística (sem IA).

## Eventos (Fase 6)
Automação → Cloudflare Worker → D1 → HQ. Evento: `{eventId, agentId, taskId, status, activity, timestamp}`. Requer IDs únicos, validação, deduplicação, histórico, autenticação (assinatura), tratamento de falhas. Nenhum segredo no frontend; nenhum endpoint de escrita sem autenticação. V1 usa dados simulados identificados.

## Automação futura (fora de escopo agora)
Fluxo sequencial econômico por um único coordenador: lead não usado → validar → template premium → personalizar via JSON → demo → testes → publicar → registrar eventos → abordagem para revisão humana. Rotinas são execuções agendadas (verificar opções reais de modelo/agendamento antes). Sem mensagens comerciais automáticas.

## Economia de tokens
Evitar múltiplos subagentes; reutilizar templates; configuração por JSON; scripts determinísticos para dedupe, validação, links, build, publicação, eventos, XP, métricas; contexto reduzido; fases pequenas; limitar tentativas; não afirmar economia sem medição.

## Segurança
Sem credenciais no GitHub; sem dados privados de leads no frontend público; sem pagamentos automáticos; sem publicar em produção sem aprovação; repositório original intocado.

## Fases
1 Fundação · 2 Dashboard · 3 Escritório 3D · 4 Expansão · 5 Gamificação · 6 Integração · 7 Testes/Publicação.
