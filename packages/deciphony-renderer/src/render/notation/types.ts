import type {BarlineTypeEnum, BracketTypeEnum, MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import type {SkinKey} from '@/types/common'
import type {Measure} from '@/types/MusicScoreType'
import type {ColumnLayoutSource, MeasureColumnLayout} from '@/render/layout/measureColumnLayout'
import type {LongRestRole} from '@/drumNotation/render/types'

/** 排版用的谱种皮肤表（含空皮肤回落） */
export type NotationSkin = Record<string, { w: number; h: number }>

/** 一个单谱表的排版参数。音符怎么画不在这里，见 paintStaffNotes */
export type NotationDriver = {
  type: MusicScoreTypeEnum
  skin: NotationSkin
  measureHeight: number
  measureLineWidth: number
  measureSkinKey: SkinKey
  /** 小节自身宽度占比，不含 onset 列底数 */
  ownWidthRatio(measure: Measure, index: number): number
  /** 非连谱：含 onset 列底数的小节宽度占比 */
  unlinkedWidthRatio(measure: Measure, index: number): number
  /**
   * 参与连谱列对齐的时间线。
   * 一般一条；鼓谱上下声部各一条；长休止符不参与。
   */
  participants(measure: Measure, index: number): ColumnLayoutSource[]
  fixedWidths(measure: Measure, index: number): { prefixW: number; suffixW: number }
  showsBarline(measure: Measure, index: number, side: 'f' | 'b'): boolean
  barlineFX(measure: Measure, measureX: number, index: number): number
  barlineX(measure: Measure, measureX: number, measureWidth: number, index: number): number
  linkedBarlineKey(type: BarlineTypeEnum): SkinKey
  bracketKey(type: BracketTypeEnum): SkinKey
  /** 本谱表在这一列分到的列布局。鼓谱收成 {up, down} */
  packLayouts(layouts: (MeasureColumnLayout | null)[]): unknown
  longRestAt?: (index: number) => LongRestRole | null
}

/** 附属符号按锚点找回单谱表后用的皮肤 / 行高 / 谱种 */
export type StaffAnchor = {
  type: MusicScoreTypeEnum
  skin: NotationSkin
  measureHeight: number
}
