import type {MidiRecordHand} from './types'

/** 两只手的默认位置（midi）：左手 C3、右手 C5，初始分界约在中央 C */
export const DEFAULT_HAND_CENTER: Record<MidiRecordHand, number> = {left: 48, right: 72}
export const DEFAULT_HAND_SPAN = 12

/** 空闲多久后手的位置回到默认的一半（ms） */
const CENTER_RELAX_HALF_LIFE_MS = 3000
/** 新触键对手位置的影响权重 */
const CENTER_FOLLOW = 0.5
/** 与按住的键合起来超出跨度：几乎不可能用这只手 */
const SPAN_PENALTY = 100
/** 左右手交叉（左手弹到右手位置之上 / 反之） */
const CROSS_PENALTY = 12

export type HandState = {
  center: number
  /** 这只手当前按住的键 */
  held: Set<number>
  lastTime: number | null
}

export type HandTracker = Record<MidiRecordHand, HandState>

export function createHandTracker(): HandTracker {
  return {
    left: {center: DEFAULT_HAND_CENTER.left, held: new Set(), lastTime: null},
    right: {center: DEFAULT_HAND_CENTER.right, held: new Set(), lastTime: null},
  }
}

function span(midis: Iterable<number>): number {
  const list = [...midis]
  return list.length ? Math.max(...list) - Math.min(...list) : 0
}

function mean(midis: number[]): number {
  return midis.reduce((s, m) => s + m, 0) / midis.length
}

/**
 * 一次触键（升序）超出单手跨度时，在最大音程处切成低 / 高两组；
 * 优先选两边都能单手按到的切点。放得进一只手返回 null。
 */
export function splitByGap(sorted: number[], handSpan: number): {low: number[]; high: number[]} | null {
  if (sorted.length < 2 || span(sorted) <= handSpan) return null
  let best = -1
  let bestGap = -1
  let bestFits = false
  for (let k = 0; k < sorted.length - 1; k++) {
    const gap = sorted[k + 1]! - sorted[k]!
    const fits = span(sorted.slice(0, k + 1)) <= handSpan && span(sorted.slice(k + 1)) <= handSpan
    if ((fits && !bestFits) || (fits === bestFits && gap > bestGap)) {
      best = k
      bestGap = gap
      bestFits = fits
    }
  }
  return {low: sorted.slice(0, best + 1), high: sorted.slice(best + 1)}
}

function relax(state: HandState, hand: MidiRecordHand, time: number) {
  if (state.lastTime == null || state.held.size) return
  const idle = Math.max(0, time - state.lastTime)
  const keep = Math.pow(0.5, idle / CENTER_RELAX_HALF_LIFE_MS)
  state.center = DEFAULT_HAND_CENTER[hand] + (state.center - DEFAULT_HAND_CENTER[hand]) * keep
}

function cost(tracker: HandTracker, hand: MidiRecordHand, group: number[], handSpan: number): number {
  const state = tracker[hand]
  const other = tracker[hand === 'left' ? 'right' : 'left']
  const center = mean(group)
  let c = Math.abs(center - state.center)
  if (state.held.size && span([...state.held, ...group]) > handSpan) c += SPAN_PENALTY
  if (hand === 'left' && center > other.center) c += CROSS_PENALTY
  if (hand === 'right' && center < other.center) c += CROSS_PENALTY
  return c
}

function follow(state: HandState, group: number[], time: number) {
  state.center = state.center * (1 - CENTER_FOLLOW) + mean(group) * CENTER_FOLLOW
  state.lastTime = time
}

/**
 * 把一次触键分给左右手：
 * 1. 跨度超过 handSpan → 按最大音程切开，低组左手、高组右手（如 57 59 61 72 → 左 57 59 61，右 72）
 * 2. 放得进一只手 → 比较两手当前位置的距离；正按着的键加上这组超出跨度、或两手交叉都会加罚分
 * 手的位置随触键移动，空闲时逐渐回到默认（左 C3 / 右 C5）
 */
export function assignHands(
  tracker: HandTracker,
  midis: number[],
  time: number,
  handSpan = DEFAULT_HAND_SPAN,
): Record<MidiRecordHand, number[]> {
  const sorted = [...new Set(midis)].sort((a, b) => a - b)
  const result: Record<MidiRecordHand, number[]> = {left: [], right: []}
  if (!sorted.length) return result
  relax(tracker.left, 'left', time)
  relax(tracker.right, 'right', time)
  const split = splitByGap(sorted, handSpan)
  if (split) {
    result.left = split.low
    result.right = split.high
  } else {
    const hand: MidiRecordHand = cost(tracker, 'left', sorted, handSpan) < cost(tracker, 'right', sorted, handSpan)
      ? 'left'
      : 'right'
    result[hand] = sorted
  }
  if (result.left.length) follow(tracker.left, result.left, time)
  if (result.right.length) follow(tracker.right, result.right, time)
  return result
}
