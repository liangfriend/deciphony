import type {Chronaxie, Frame} from '@deciphony/renderer';

/** 默认 Frame：编辑新建节点时统一归零 */
export const ZERO_FRAME: Frame = {
  relativeX: 0,
  relativeY: 0,
  relativeW: 0,
  relativeH: 0,
};

/** Unit256：256=全音符，128=二分，…，1=六十四分 */
export const CHRONAXIES: readonly Chronaxie[] = [256, 128, 64, 32, 16, 8, 4, 2, 1] as const;

export const DEFAULT_SPACING = {
  grandStaff: {uSpace: 40, dSpace: 40},
  singleStaff: {uSpaceI: 20, dSpaceI: 20, uSpaceO: 20, dSpaceO: 20},
  measureWidthRatioForMeasure: 100,
  noteWidthRatio: 6,
} as const;

/** 各符号默认 widthRatio / widthRatioForMeasure（可被 partial 覆盖） */
export const DEFAULT_WIDTH_RATIO = {
  clef: {w: 10, wm: 18},
  barline: {w: 4, wm: 4},
  timeSignature: {w: 14, wm: 14},
  keySignature: {w: 10, wm: 10},
  accidental: {w: 2, wm: 2},
  augmentationDot: {w: 2, wm: 2},
} as const;

/** 与默认皮肤 measure.h 一致；创建附属符号时可用 */
export const DEFAULT_MEASURE_HEIGHT = 45;

/**
 * 单 slot 双端点符号（琶音 / 扫弦）：两端默认同锚点（slot.x / 小节底），
 * end.y 上移一节高度（× measureHeight 的像素值），使符号垂直穿过整节。
 */
export function defaultSingleSlotEndPoint(measureHeight = DEFAULT_MEASURE_HEIGHT): {x: number; y: number} {
  return {x: 0, y: -measureHeight};
}
