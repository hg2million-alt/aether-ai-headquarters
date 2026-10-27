# PROGRESS
**Etapa atual:** escritório em pixel art isométrica 2D com os **5 agentes** (piloto aprovado pelo dono) + área de descanso. Próximo: refinar a arte e conectar aos dados reais (Fase 6/7).

## Concluído
- Fases 1–2, 5, 6, 7: dashboard, gamificação determinística, contrato de eventos/HMAC/Worker/D1 (testados), segurança e acessibilidade — inalterados.
- 3D removido: `src/office/` apagado (continua no histórico git); desinstalados `three`, `@react-three/fiber`, `@types/three`. Dependências de runtime: só `react`, `react-dom`.
- `src/office2d/`: `raster.ts` (rasterizador pixel a pixel: caixas isométricas 2:1, elipses, dithering), `room.ts` (piso de tábuas, parede de tijolo, janela com cidade, painel digital, arandelas, plantas), `furniture.ts` (mesa com gavetas, teclado, monitores, caneca, luminária, cadeira), `characters.ts` (sprites 20×30 em grade de pixels com contorno automático, paleta por `CharStyle`, 6 estados + balões), `scene.ts` (composição por profundidade, modo noturno, seleção), `PixelOffice.tsx` (canvas, 4 passos/s, pausa fora da tela/aba, reduced-motion = quadro estático, toque seleciona).
- Estados: working (digita, balão `</>`), idle (respira/pisca), sleeping (`Zz`), completed (braços para cima, `✓`), failed (cenho, suor, `!`), unknown (`?`). Noite quando todos idle/sleeping.
- Expansão: SCOUT, ATLAS, SENTINEL, NOVA, MERCURY com estilos próprios (`STATIONS` em `scene.ts`: cabelo ponytail/short/curly/swept, roupas colete/moletom/jaleco/macacão com headset/blazer com gravata); mesas de 1,6 tile; sofá, mesa de centro e plantas em `buildProps()`. Segundo monitor removido (cobria rostos).
- Arte: 100% autoral (sem pacotes de terceiros — OpenGameArt/Kenney/itch bloqueados no ambiente), sem questão de licença.

## Pendências
- Layout das 5 estações ainda denso (fileiras se sobrepõem no iso); considerar sala maior/câmera com pan, estante, máquina de café.
- Rostos ainda simples; um pixel artist poderia refinar sprites (mais quadros de animação, mais variedade de cabelo/roupa).
- Desempenho em Android real não medido (só desktop headless).
- Worker/D1/Access ainda não criados; Ajustes placeholder.

## Próxima tarefa
Refinar a arte com o dono (layout, mais quadros de animação, mais móveis); depois publicar (com aprovação) e ligar a API (INTEGRATION.md).
