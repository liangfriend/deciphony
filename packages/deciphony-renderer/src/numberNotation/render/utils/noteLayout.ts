/** 简谱音符垂直布局（层间距由 measure.floorSpan 控制） */

/** 第 floorIndex 层音符中心 y（0=最下层；更高层向上叠，y 递减）；不受八度点影响 */
export function floorCenterY(
  measureY: number,
  measureHeight: number,
  floorIndex: number,
  floorSpan?: number[],
): number {
  let y = measureY + measureHeight / 2;
  for (let i = 0; i < floorIndex; i++) {
    y -= measureHeight + (floorSpan?.[i] ?? 0);
  }
  return y;
}

/** @deprecated 使用 floorCenterY；保留参数兼容旧调用 */
export function noteCenterY(
  measureY: number,
  measureHeight: number,
  stackIndex: number,
  _noteH = measureHeight,
  _yOffset = 0,
  floorSpan?: number[],
): number {
  return floorCenterY(measureY, measureHeight, stackIndex, floorSpan);
}
