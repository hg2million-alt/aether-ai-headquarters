/** Hash determinístico em [0,1): usado por texturas e pelo comportamento (sem Math.random). */
export function hash(a: number, b = 0, c = 0): number {
  let h = (Math.imul(a + 1, 374761393) ^ Math.imul(b + 7, 668265263) ^ Math.imul(c + 13, 2147483647)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
