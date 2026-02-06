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
  id: string
  type: MusicScoreTypeEnum,
  grandStaffs: GrandStaff[],
  affiliatedSymbols: AffiliatedSymbol[]
  width: number,
  height: number,
}
export type GrandStaff = {
  id: string
  staves: SingleStaff[],
  uSpace: number,  // 复谱表上间距
  dSpace: number,  // 复谱表下间距
} & Frame

export type SingleStaff = {
  id: string
  measures: Measure[], // 小节
  uSpaceO: number,  // 单谱表上间距-外
  uSpaceI: number,  // 单谱表上间距-内
  dSpaceI: number,  // 单谱表下间距-内
  dSpaceO: number,  // 单谱表下间距-外
} & Frame

export type Measure = {
  id: string
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
  id: string
  type: NoteSymbolTypeEnum
  chronaxie: Chronaxie // 时值0
  direction: 'up' | 'down' // 控制符干方向，休止符时不起作用。 多个音符形成beam时，会对每个direction进行少数服从多数判断
  region: number, // 在五线谱上的位置，0就是第一线的位置，1是第一间的位置  休止符的region没有意义
  accidental?: Accidental
  widthRatio: number
  widthRatioForMeasure: number
} & Frame
/*
* 附属型符号 accent above, accidental等等， 符干符尾不属于附属型符号，它是根据音符时值信息固定逻辑判断是否存在的符号
*
* */
export type AffiliatedSymbol = {
  id: string
  name: AffiliatedSymbolNameEnum,
  startId: string,
  endId: string, // 在双音符附属或双小节附属符号里，这个是没有意义的
} & Frame


// 小节线
export type Barline = {
  id: string
  barlineType: BarlineTypeEnum
  widthRatioForMeasure: number
} & Frame
// 谱号 谱号出现在小节和音符上 后置谱号在小节线之前
export type Clef = {
  id: string
  barlineType: ClefTypeEnum
  widthRatioForMeasure: number
} & Frame
// 调号 后置调号在小节线之后
export type KeySignature = {
  id: string
  barlineType: KeySignatureTypeEnum
  widthRatioForMeasure: number
} & Frame
// 拍号 后置拍号在小节线之后
export type TimeSignature = {
  id: string
  barlineType: TimeSignatureTypeEnum
  widthRatioForMeasure: number
} & Frame
export type Accidental = {
  id: string
  type: AccidentalTypeEnum
  widthRatioForMeasure: number
} & Frame