/** Fonte de pixels 3×5 (maiúsculas + símbolos de balão). */
const L = (s: string) => s.split(' ')
export const GLYPH: Record<string, string[]> = {
  A: L('.#. #.# ### #.# #.#'), B: L('##. #.# ##. #.# ##.'), C: L('.## #.. #.. #.. .##'), D: L('##. #.# #.# #.# ##.'),
  E: L('### #.. ##. #.. ###'), F: L('### #.. ##. #.. #..'), G: L('.## #.. #.# #.# .##'), H: L('#.# #.# ### #.# #.#'),
  I: L('### .#. .#. .#. ###'), J: L('..# ..# ..# #.# .#.'), K: L('#.# #.# ##. #.# #.#'), L: L('#.. #.. #.. #.. ###'),
  M: L('#.# ### ### #.# #.#'), N: L('### #.# #.# #.# #.#'), O: L('.#. #.# #.# #.# .#.'), P: L('##. #.# ##. #.. #..'),
  Q: L('.#. #.# #.# ##. .##'), R: L('##. #.# ##. #.# #.#'), S: L('.## #.. .#. ..# ##.'), T: L('### .#. .#. .#. .#.'),
  U: L('#.# #.# #.# #.# ###'), V: L('#.# #.# #.# #.# .#.'), W: L('#.# #.# ### ### #.#'), X: L('#.# #.# .#. #.# #.#'),
  Y: L('#.# #.# .#. .#. .#.'), Z: L('### ..# .#. #.. ###'),
  '<': L('..# .#. #.. .#. ..#'), '>': L('#.. .#. ..# .#. #..'), '/': L('..# ..# .#. #.. #..'),
  '!': L('.#. .#. .#. ... .#.'), '?': L('##. ..# .#. ... .#.'), z: L('... ### .#. ### ...'), v: L('... ..# #.# .#. ...'),
}

/** Retorna se o pixel (u, v) do texto (3×5, 1 coluna de espaço entre letras) está aceso. */
export function textPixel(text: string, u: number, v: number): boolean {
  if (v < 0 || v >= 5 || u < 0) return false
  const i = Math.floor(u / 4), col = u % 4
  if (i >= text.length || col === 3) return false
  return GLYPH[text[i]]?.[v]?.[col] === '#'
}
export const textWidth = (text: string) => text.length * 4 - 1
