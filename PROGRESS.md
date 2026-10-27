# PROGRESS
**Etapa atual:** reformulação do escritório para pixel art isométrica 2D — **cena piloto (2 estações, 2 personagens) pronta para validação**. Não expandir para 5 agentes antes da aprovação da arte.

## Concluído
- Fases 1–2, 5, 6, 7: dashboard, gamificação determinística, contrato de eventos/HMAC/Worker/D1 (testados), segurança e acessibilidade — inalterados.
- 3D removido: `src/office/` apagado (continua no histórico git); desinstalados `three`, `@react-three/fiber`, `@types/three`. Dependências de runtime: só `react`, `react-dom`.
- `src/office2d/`: `raster.ts` (rasterizador pixel a pixel: caixas isométricas 2:1, elipses, dithering), `room.ts` (piso de tábuas, parede de tijolo, janela com cidade, painel digital, arandelas, plantas), `furniture.ts` (mesa com gavetas, teclado, monitores, caneca, luminária, cadeira), `characters.ts` (sprites 20×30 em grade de pixels com contorno automático, paleta por `CharStyle`, 6 estados + balões), `scene.ts` (composição por profundidade, modo noturno, seleção), `PixelOffice.tsx` (canvas, 4 passos/s, pausa fora da tela/aba, reduced-motion = quadro estático, toque seleciona).
- Estados: working (digita, balão `</>`), idle (respira/pisca), sleeping (`Zz`), completed (braços para cima, `✓`), failed (cenho, suor, `!`), unknown (`?`). Noite quando todos idle/sleeping.
- Arte: 100% autoral (sem pacotes de terceiros — OpenGameArt/Kenney/itch bloqueados no ambiente), sem questão de licença.

## Pendências
- Faltam 3 personagens (SENTINEL, NOVA, MERCURY) e a área de descanso (sofá, mesa de centro), estante, café — só após aprovar a arte do piloto.
- Rostos ainda simples; um pixel artist poderia refinar sprites (mais quadros de animação, mais variedade de cabelo/roupa).
- Desempenho em Android real não medido (só desktop headless).
- Worker/D1/Access ainda não criados; Ajustes placeholder.

## Próxima tarefa
Validar o piloto com o dono; então expandir para 5 estações, sofá/mesa de centro e demais móveis reutilizando `CharStyle` e `buildDesk`.
