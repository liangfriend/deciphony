/** 简谱音符垂直布局 */

/** 最底层（floorIndex 0）音符中心 y；多层用 stackCenterYs */
export function floorCenterY(
  measureY: number,
  measureHeight: number,
  _floorIndex = 0,
  _floorSpan?: number[],
): number {
  return measureY + measureHeight / 2;
}

export type StackNoteBox = {
  /** 数字皮肤高 */
  h: number
  /** 实际要画的八度点（0 / X 传 0）：正 = 上方，负 = 下方 */
  octaveDot: number
}

export type OctaveDotMetrics = {
  /** 单个点高 */
  h: number
  /** 第一个点与数字的距离 */
  firstOffset: number
  /** 相邻点间距 */
  spacing: number
}

function octaveDotExtent(count: number, dot: OctaveDotMetrics | null): number {
  if (count <= 0 || !dot) return 0
  return dot.firstOffset + count * dot.h + (count - 1) * dot.spacing
}

/**
 * 和弦各层中心 y（index 0 = 最下层）。第 k 层紧贴第 k-1 层之上：
 * 中间留出第 k-1 层的上八度点、第 k 层的下八度点（两者都有时再隔一个点间距），再加 floorSpan[k-1]。
 */
export function stackCenterYs(
  measureY: number,
  measureHeight: number,
  notes: readonly StackNoteBox[],
  dot: OctaveDotMetrics | null,
  floorSpan?: number[],
): number[] {
  const centers: number[] = []
  for (let k = 0; k < notes.length; k++) {
    const cur = notes[k]!
    if (k === 0) {
      centers.push(floorCenterY(measureY, measureHeight))
      continue
    }
    const prev = notes[k - 1]!
    const prevTop = centers[k - 1]! - prev.h / 2
    const above = octaveDotExtent(prev.octaveDot, dot)
    const below = octaveDotExtent(-cur.octaveDot, dot)
    const between = above > 0 && below > 0 ? (dot?.spacing ?? 0) : 0
    const bottom = prevTop - above - below - between - (floorSpan?.[k - 1] ?? 0)
    centers.push(bottom - cur.h / 2)
  }
  return centers
}
