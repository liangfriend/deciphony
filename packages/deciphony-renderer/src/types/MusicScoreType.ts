import {
  AccidentalTypeEnum,
  AffiliatedSymbolNameEnum,
  BarlineTypeEnum, ClefTypeEnum, KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
  SpanSymbolNameEnum, TimeSignatureTypeEnum
} from "@/enums/musicScoreEnum";
import {Chronaxie, Frame} from "@/types/common";
import {SpanSymbolTypeEnum} from "deciphony-core";
// ==========================================通用================================================
export type MusicScore = {
  type: MusicScoreTypeEnum,
  grandStaffs: GrandStaff[],
  spanSymbols: SpanSymbol[],
  width: number,
  height: number,
}
export type GrandStaff = {
  staves: SingleStaff[],
  uSpace: number,  // 复谱表上间距
  dSpace: number,  // 复谱表下间距
} & Frame

export type SingleStaff = {
  measures: Measure[], // 小节
  uSpaceO: number,  // 单谱表上间距-外
  uSpaceI: number,  // 单谱表上间距-内
  dSpaceI: number,  // 单谱表下间距-内
  dSpaceO: number,  // 单谱表下间距-外
} & Frame

export type Measure = {
  notes: NoteSymbol[],// 音符，休止符
  barline: Barline, // 小节线
  clef_f?: Clef, // 前置谱号
  clef_b?: Clef, // 后置谱号
  keySignature_f?: KeySignature,
  keySignature_b?: KeySignature,
  timeSignature_f?: TimeSignature,
  timeSignature_b?: TimeSignature,
  widthRatioForMeasure: number
} & Frame
// 音乐符号
export type NoteSymbol = {
  type: NoteSymbolTypeEnum
  affiliatedSymbols: AffiliatedSymbol[]
  chronaxie: Chronaxie // 时值0
  direction: 'up' | 'down' // 控制符干方向，休止符时不起作用。 多个音符形成beam时，会对每个direction进行少数服从多数判断
  region: number, // 在五线谱上的位置，0就是第一线的位置，1是第一间的位置  休止符的region没有意义
  accidental?: Accidental
  widthRatio: number
  widthRatioForMeasure: number
} & Frame
// 音符附属型符号 accent above, accidental等等， 符干符尾不属于附属型符号，它是根据音符时值信息固定逻辑判断是否存在的符号
export type AffiliatedSymbol = {
  name: AffiliatedSymbolNameEnum,
} & Frame

// 跨小节符号
export type SpanSymbol = {
  type: SpanSymbolTypeEnum,
  name: SpanSymbolNameEnum,
} & Frame
// 小节线
export type Barline = {
  barlineType: BarlineTypeEnum
  widthRatioForMeasure: number
}
// 谱号 谱号出现在小节和音符上 后置谱号在小节线之前
export type Clef = {
  barlineType: ClefTypeEnum
  widthRatioForMeasure: number
}
// 调号 后置调号在小节线之后
export type KeySignature = {
  barlineType: KeySignatureTypeEnum
  widthRatioForMeasure: number
}
// 拍号 后置拍号在小节线之后
export type TimeSignature = {
  barlineType: TimeSignatureTypeEnum
  widthRatioForMeasure: number
}
export type Accidental = {
  type: AccidentalTypeEnum
  widthRatioForMeasure: number
}