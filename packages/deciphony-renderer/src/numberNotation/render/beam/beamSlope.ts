import {BEAM_MAX_SLOPE_DEG} from "../constants";

/**
 * 斜率锚点：确定符杠直线 y = anchor.y + inclination * (x - anchor.x) 的基准点。
 * 符干向上时取组内 y 最小（最靠上的符干顶端）；
 * 符干向下时取组内 y 最大（最靠下的符干底端）。
 */
function pickExtremeStemEndForAnchor(
  stemEnds: Array<{ x: number; y: number }>,
  direction: 'up' | 'down',
): { x: number; y: number } {
  return stemEnds.reduce((best, cur) => {
    if (direction === 'down') {
      return cur.y >= best.y ? cur : best;
    }
    return cur.y <= best.y ? cur : best;
  });
}

/**
 * 计算一组连杠音符的符杠斜率。
 *
 * @param stemEnds 每个符干与符杠的接点，顺序为视觉左→右。
 *                 up 方向取 stem.y（符干顶端），down 方向取 stem.y + stem.h（符干底端）。
 * @param direction 符干方向，与符杠绘制方向一致。
 *
 * 算法分三步（按优先级）：
 * 1. **水平符杠**：若中间某个符干的接点 y 与组内首/尾一样「极端」
 *    （up：不高于首尾最低点；down：不低于首尾最高点），
 *    则符杠强制水平（inclination = 0），锚点取该极端 y。
 * 2. **首尾连线斜率**：用首尾接点算初始斜率，再逐个中间符干收紧斜率，
 *    保证符杠不会从中间符干「穿出去」：
 *    - 正斜率：以首符干为锚，斜率取 min，使中间符干接点不低于符杠；
 *    - 负斜率：以尾符干为锚，斜率取 max，使中间符干接点不高于符杠。
 * 3. **斜率上限**：将斜率限制在 ±BEAM_MAX_SLOPE_DEG 以内，
 *    锚点用 pickExtremeStemEndForAnchor 取组内最靠外的一端。
 */
export function computeBeamSlope(
  stemEnds: Array<{ x: number; y: number }>,
  direction: 'up' | 'down'
): { inclination: number; anchor: { x: number; y: number } } {
  const n = stemEnds.length;
  const last = stemEnds[n - 1];
  const first = stemEnds[0];
  let curAnchor: { x: number; y: number } | null = null;

  // --- 情况 1：中间符干与首尾同高 → 水平符杠 ---
  if (direction === 'up') {
    const minY = Math.min(first!.y, last!.y);
    for (let i = 1; i < n - 1; i++) {
      const curStemPosition = stemEnds[i];
      if (curStemPosition.y <= minY) {
        if (!curAnchor) {
          curAnchor = {x: stemEnds[0].x, y: curStemPosition.y};
        } else if (curStemPosition.y < curAnchor.y) {
          curAnchor.y = curStemPosition.y;
          curAnchor.x = curStemPosition.x;
        }
      }
    }
  } else {
    const maxY = Math.max(first!.y, last!.y);
    for (let i = 1; i < n - 1; i++) {
      const curStemPosition = stemEnds[i];
      if (curStemPosition.y >= maxY) {
        if (!curAnchor) {
          curAnchor = {x: stemEnds[0].x, y: curStemPosition.y};
        } else if (curStemPosition.y > curAnchor.y) {
          curAnchor.y = curStemPosition.y;
          curAnchor.x = curStemPosition.x;
        }
      }
    }
  }

  if (curAnchor) {
    return {inclination: 0, anchor: curAnchor};
  }

  // --- 情况 2：首尾连线，再用中间符干收紧斜率 ---
  let curInclination = (last!.y - first!.y) / (last!.x - first!.x);
  const maxSlope = Math.tan((BEAM_MAX_SLOPE_DEG * Math.PI) / 180);
  const isNegative = curInclination < 0;

  for (let i = 1; i < n - 1; i++) {
    const curStemPosition = stemEnds[i];
    if (!isNegative) {
      if (curStemPosition.y - first!.y < 0) continue;
      curInclination = Math.min(
        curInclination,
        (curStemPosition.y - first!.y) / (curStemPosition.x - first!.x)
      );
    } else {
      if (last!.y - curStemPosition.y > 0) continue;
      curInclination = Math.max(
        curInclination,
        (last!.y - curStemPosition.y) / (last!.x - curStemPosition.x)
      );
    }
  }

  // --- 情况 3：限制最大斜率，锚点取组内最外端 ---
  const clampedInclination =
    curInclination >= 0
      ? Math.min(curInclination, maxSlope)
      : Math.max(curInclination, -maxSlope);
  return {inclination: clampedInclination, anchor: pickExtremeStemEndForAnchor(stemEnds, direction)};
}
