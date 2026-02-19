import {BEAM_MAX_SLOPE_DEG} from "../constants";

/**
 * 符杠斜率：同一组音符依次「与尾部音符」连线，按三种情况取斜率
 * stemEnds 与符杠相接处：up=stem.y，down=stem.y+stem.h
 */
export function computeBeamSlope(
  stemEnds: Array<{ x: number; y: number }>,
  direction: 'up' | 'down'
): { inclination: number; anchor: { x: number; y: number } } {
  const n = stemEnds.length;
  const last = stemEnds[n - 1];
  const first = stemEnds[0];
  let curAnchor: { x: number; y: number } | null = null;

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

  let curInclination = (last!.y - first!.y) / (last!.x - first!.x);
  let curAnchorPoint = first!;
  const maxSlope = Math.tan((BEAM_MAX_SLOPE_DEG * Math.PI) / 180);
  const isNegative = curInclination < 0;
  curAnchorPoint = isNegative ? last! : first!;

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

  const clampedInclination =
    curInclination >= 0
      ? Math.min(curInclination, maxSlope)
      : Math.max(curInclination, -maxSlope);
  return {inclination: clampedInclination, anchor: curAnchorPoint};
}
