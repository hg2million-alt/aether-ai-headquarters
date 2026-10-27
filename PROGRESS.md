# PROGRESS
**Etapa atual (atualizada):** dados fictícios removidos; app zerado e pronto para receber eventos reais (ver INTEGRATION.md).

**Etapa anterior:** escritório em pixel art isométrica 2D ampliado para **600 tiles (30×20, 20× o anterior)** com 4 salas e agentes que circulam. Próximo: refinar arte e conectar a dados reais.

## Concluído
- Fases 1–2, 5, 6, 7: dashboard, gamificação determinística, contrato de eventos/HMAC/Worker/D1 (testados), segurança e acessibilidade.
- Escritório 2D (`src/office2d/`): sem 3D (Three.js removido). Dependências de runtime: `react`, `react-dom`.
- **Mundo 30×20** (`world.ts`): Trabalho (14×10, madeira), Refeitório (16×10, azulejo xadrez), Descanso (10×10, carpete) e Games (20×10, borracha). Divisórias baixas com portas (`PARTITIONS`/`DOORS`), nome de cada sala pintado no piso, paredes de tijolo com janelas.
- **Móveis** (`layout.ts` → `furniture.ts`): 5 mesas com monitor, mesa de reunião, estantes, balcão de café com 2 máquinas, geladeira, 3 mesas de refeição, 5 camas, 2 sofás, mesa de centro, 3 fliperamas, 2 pebolins, pufes, plantas.
- **Comportamento determinístico** (`behavior.ts`, `path.ts` A*, sem IA/Math.random): working/completed/failed/unknown → mesa; sleeping → cama própria; **idle → circula entre salas com atividades variadas** (ler no sofá, café, comer, fliperama, pebolim; 10–20 s cada; vagas sem conflito).
- **Personagens** (`characters.ts`, `styles.ts`): sentados (6 estados + ler + comer), em pé de frente/costas com caminhada de 4 quadros, café, fliperama, pebolim, cabeça no travesseiro (cama). Arte autoral em grades de pixels.
- **Câmera** (`PixelOffice.tsx`): arrastar, zoom 1×/2×/3×, atalhos por sala, seguir agente; 8 quadros/s; pausa fora da tela/aba; reduced-motion = estado final sem animação.
- Noite: só quando todos dormem.
- Testes: 25 (`npm test`), incluindo alcançabilidade de todas as vagas, caminho por portas, vagas distintas, variedade de lazer, retorno à mesa, determinismo.
- Medido (desktop headless): ~1,3 % CPU e ~6 MB heap em animação; carga ~0,4 s.

## Mudanças recentes
- **Publicado em https://aether-hq.pages.dev/** (Pages + Function `/events` + D1 `aether-hq`). Leitura por chave (Ajustes), envio por assinatura HMAC; testado em produção. Falta: automação original chamar `scripts/send-event.mjs`; revogar o token de API usado.
- Retrato animado de cada agente (`components/AgentAvatar.tsx`) no cartão "Agentes agora" e no card do Escritório: só o boneco (sem mapa), uma animação por estado (digita, dorme com Zz, braços para cima, cenho com suor, `?`); ocioso alterna ler/café/comer/fliperama/andar a cada 4 s. Reusa os sprites do escritório.
- Removidos todos os dados e avisos simulados (`mock.ts` apagado), a simulação de estados e o botão de pré-visualização do XP. Sem eventos: tudo 0, agentes "sem sinal", aviso de conexão.
- Camada de dados real (`src/data/live.ts` + `source.ts`): painel montado só de eventos autenticados; polling de 15 s; endereço do Worker em Ajustes (sem segredo).
- Escritório: tocar num agente mostra o nome em plaquinha; botão Nomes mostra todos.
- Dashboard: "Agentes agora" (estado, o que faz, último sinal).
- `scripts/send-event.mjs` para a automação (validado contra o Worker local). 29 testes.

## Pendências
- Desempenho em Android real não medido.
- Arte simples (rostos, pebolim, fliperama ainda podem ser refinados por pixel artist); mais quadros de animação.
- Sem minimapa; pessoas podem cruzar-se sem desvio entre si.
- Worker/D1/Access ainda não criados; Ajustes placeholder.

## Próxima tarefa
Revisão visual com o dono; depois publicar (com aprovação) e ligar a API (INTEGRATION.md).
