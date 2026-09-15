export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpArray(from: number[], to: number[], t: number): number[] {
  const n = Math.max(from.length, to.length)
  const out = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    out[i] = lerp(from[i] ?? 0, to[i] ?? 0, t)
  }
  return out
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}
