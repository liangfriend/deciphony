import {
  AffiliatedSymbolNameEnum,
  NoteSymbolTypeEnum,
  SpanSymbolNameEnum
} from "@/standardStaff/enums/standardStaffEnum";
import {SpanSymbolTypeEnum} from "deciphony-core";
import {MusicScoreTypeEnum} from "@/enums/musicScoreEnum";
import {Frame} from "@/types/common";
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
  uSpaceU: number,  // 单谱表上间距-外
  uSpaceI: number,  // 单谱表上间距-内
  dSpaceI: number,  // 单谱表下间距-内
  dSpaceU: number,  // 单谱表下间距-外
} & Frame

export type Measure = {
  notes: NoteSymbol[],// 音符，休止符
} & Frame
// 音乐符号
export type NoteSymbol = {
  type: NoteSymbolTypeEnum
  affiliatedSymbols: AffiliatedSymbol[]
  region: number, // 在五线谱上的位置，0就是第一间的位置，1是第二线的位置
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