/** 横向符号拖拽把手（踏板等）：左/右控 x，中间上下平移 */

export type HorizontalHandleKind = 'start' | 'end' | 'middle'

export type HorizontalHandlePoints = {
  start: { x: number; y: number }
  end: { x: number; y: number }
  middle: { x: number; y: number }
}

/** 把手落在 startPoint / endPoint / 中点（与垂直把手几何相同，交互轴不同） */
export function computeHorizontalHandlePoints(vdom: {
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
}): HorizontalHandlePoints {
  const s = vdom.startPoint
  const e = vdom.endPoint
  return {
    start: {x: s.x, y: s.y},
    end: {x: e.x, y: e.y},
    middle: {x: (s.x + e.x) / 2, y: (s.y + e.y) / 2},
  }
}
