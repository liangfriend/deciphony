/** 垂直符号拖拽把手（琶音等）：上/下控 y，中间框左右平移 */

export type VerticalHandleKind = 'start' | 'end' | 'middle'

export type VerticalHandlePoints = {
  start: { x: number; y: number }
  end: { x: number; y: number }
  middle: { x: number; y: number }
}

/** 把手落在 startPoint / endPoint / 中点 */
export function computeVerticalHandlePoints(vdom: {
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
}): VerticalHandlePoints {
  const s = vdom.startPoint
  const e = vdom.endPoint
  return {
    start: {x: s.x, y: s.y},
    end: {x: e.x, y: e.y},
    middle: {x: (s.x + e.x) / 2, y: (s.y + e.y) / 2},
  }
}
