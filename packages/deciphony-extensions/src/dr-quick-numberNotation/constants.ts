import {BarlineTypeEnum} from '@deciphony/renderer'

/** `|N` 的小节线类型表，下标即 N，按常用程度排序；单写 `|` 等同 `|0` */
export const QUICK_BARLINE_TYPES: readonly BarlineTypeEnum[] = [
  BarlineTypeEnum.Single_barline,
  BarlineTypeEnum.StartRepeat_barline,
  BarlineTypeEnum.EndRepeat_barline,
  BarlineTypeEnum.Final_barline,
  BarlineTypeEnum.Start_end_repeat_barline,
  BarlineTypeEnum.Double_barline,
  BarlineTypeEnum.Dashed_barline,
  BarlineTypeEnum.Dotted_barline,
  BarlineTypeEnum.Reverse_barline,
  BarlineTypeEnum.Heavy_barline,
  BarlineTypeEnum.Heavy_double_barline,
] as const

export const QUICK_MAX_OCTAVE_DOT = 6
export const QUICK_MIN_OCTAVE_DOT = -5
/** 减时线上限：64 >> 6 = 1（256 分音符） */
export const QUICK_MAX_REDUCE_LINES = 6
/** 加时线上限：3 条 = 全音符 */
export const QUICK_MAX_ADD_LINES = 3
export const QUICK_MAX_DOTS = 3
