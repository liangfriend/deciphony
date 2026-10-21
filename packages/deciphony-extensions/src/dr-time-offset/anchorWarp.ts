import {ANCHOR_MIN_GAP, MAX_SYNC_SECONDS} from './constants'

export type AnchorWarpItem = {
  key: string
  /** 拖动开始时的秒数 */
  time: number
}

export type AnchorWarp = {
  /** 被拖音符移到 next 后，各项的新秒数（只含会变的项） */
  apply: (next: number) => Map<string, number>
  /** next 的允许范围（不越过相邻锚点、整体平移不出 0..MAX_SYNC_SECONDS） */
  min: number
  max: number
}

/**
 * 锚定移动：被拖音符 pivot 原在 t0。
 * - pivot 不是锚点：只动 pivot。
 * - pivot 是锚点：左右最近的其它锚点为 L / R；L..t0 之间按比例伸缩（L 不动），t0..R 同理（R 不动），L / R 之外不动。
 * - 左侧没有锚点：t0 之前的音跟着平移；右侧没有锚点：t0 之后的音跟着平移（只有一个锚点 = 整体平移）。
 * - 与 pivot 同一时刻的其它音（其它谱表行）跟 pivot 一起移动。
 */
export function createAnchorWarp(
  items: AnchorWarpItem[],
  anchors: ReadonlySet<string>,
  pivotKey: string,
  t0: number,
): AnchorWarp {
  if (!anchors.has(pivotKey)) {
    return {
      apply: (next) => new Map([[pivotKey, next]]),
      min: 0,
      max: MAX_SYNC_SECONDS,
    }
  }

  let L = -Infinity
  let R = Infinity
  for (const it of items) {
    if (it.key === pivotKey || !anchors.has(it.key)) continue
    if (it.time < t0 && it.time > L) L = it.time
    if (it.time > t0 && it.time < R) R = it.time
  }

  let min = 0
  let max = MAX_SYNC_SECONDS
  if (Number.isFinite(L)) {
    min = L + ANCHOR_MIN_GAP
  } else {
    const lowest = Math.min(t0, ...items.filter((it) => it.time < t0).map((it) => it.time))
    min = t0 - lowest
  }
  if (Number.isFinite(R)) {
    max = R - ANCHOR_MIN_GAP
  } else {
    const highest = Math.max(t0, ...items.filter((it) => it.time > t0).map((it) => it.time))
    max = MAX_SYNC_SECONDS - (highest - t0)
  }

  const apply = (nextRaw: number) => {
    const next = Math.min(max, Math.max(min, nextRaw))
    const delta = next - t0
    const out = new Map<string, number>()
    for (const it of items) {
      const t = it.time
      if (it.key === pivotKey || t === t0) {
        out.set(it.key, next)
      } else if (t < t0) {
        if (!Number.isFinite(L)) out.set(it.key, t + delta)
        else if (t > L) out.set(it.key, L + ((t - L) * (next - L)) / (t0 - L))
      } else if (!Number.isFinite(R)) {
        out.set(it.key, t + delta)
      } else if (t < R) {
        out.set(it.key, R - ((R - t) * (R - next)) / (R - t0))
      }
    }
    out.set(pivotKey, next)
    return out
  }

  return {apply, min, max}
}
