import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  DoubleAffiliatedSymbolNameEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
  SingleAffiliatedSymbolNameEnum,
  TimeSignatureTypeEnum
} from "@/enums/musicScoreEnum";
import {Chronaxie, Frame} from "@/types/common";
import {BeamTypeEnum} from "@/standardStaff/enums/standardStaffEnum";
// ==========================================通用================================================
export type MusicScore = {
  id: string
  type: MusicScoreTypeEnum,
  grandStaffs: GrandStaff[],
  affiliatedSymbols: DoubleAffiliatedSymbol[] // 包含双音符附属型，双小节附属型
  width: number,
  height: number,
  topSpaceHeight: number, // 顶部高度
  title: string // 标题
  bpm: number // 拍速
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
  notes: NoteSymbol[] | NoteNumber[],// 音符，休止符
  barline: Barline, // 小节线
  clef_f?: Clef, // 前置谱号
  clef_b?: Clef, // 后置谱号
  keySignature_f?: KeySignature,
  keySignature_b?: KeySignature,
  timeSignature_f?: TimeSignature,
  timeSignature_b?: TimeSignature,
  widthRatioForMeasure: number,
  affiliatedSymbols: SingleAffiliatedSymbol[] // 包含单小节附属型
} & Frame

/*
* 附点
* */
export type AugmentationDot = {
  id: string
  count: 1 | 2 | 3,
  widthRatio: number
  widthRatioForMeasure: number,
} & Frame
/*
* 附属型符号 accent above, accidental等等， 符干符尾不属于附属型符号，它是根据音符时值信息固定逻辑判断是否存在的符号
*
* */
export type DoubleAffiliatedSymbol = { // 双音符，双小节附属符号
  id: string
  name: DoubleAffiliatedSymbolNameEnum,
  startId: string,
  endId: string, // 在双音符附属或双小节附属符号里，这个是没有意义的
  data: { // 有一些附属型符号很特殊，需要额外的变量来计算UI
    slur?: {
      relativeStartPoint: { x: number, y: number }, // slur 起点相对坐标
      relativeEndPoint: { x: number, y: number }, // slur 终点相对坐标
      relativeControlPoint: { x: number, y: number }, // slur 控制点相对坐标 这个，简谱没有
      thickness: number, // 厚度，两个贝塞尔曲线控制点的y值差
      // 后续可以在这里扩展上文字
    },
    volta?: {
      text: string // 文本内容
    }

  }
} & Frame

export type SingleAffiliatedSymbol = { // 单音符，单小节附属符号
  id: string
  name: SingleAffiliatedSymbolNameEnum,
  data: { // 有一些附属型符号很特殊，需要额外的变量来计算UI
  }
} & Frame


// 小节线
export type Barline = {
  id: string
  barlineType: BarlineTypeEnum
  widthRatio: number // 目前完全无用
  widthRatioForMeasure: number
} & Frame
// 谱号 谱号出现在小节和音符上 后置谱号在小节线之前
export type Clef = {
  id: string
  clefType: ClefTypeEnum
  widthRatio: number // 因为谱号有出现在音符上的情况，所以这个widthRatio不是完全无用的
  widthRatioForMeasure: number
} & Frame
// 调号 后置调号在小节线之后
export type KeySignature = {
  id: string
  type: KeySignatureTypeEnum
  widthRatio: number // 目前完全无用
  widthRatioForMeasure: number
} & Frame
// 拍号 后置拍号在小节线之后
export type TimeSignature = {
  id: string
  type: TimeSignatureTypeEnum
  widthRatio: number // 目前完全无用
  widthRatioForMeasure: number
} & Frame
export type Accidental = {
  id: string
  type: AccidentalTypeEnum
  widthRatio: number // 目前完全无用
  widthRatioForMeasure: number
} & Frame
// ==========================================线谱================================================
// 音乐符号
// export type NoteSymbol = {
//   id: string
//   type: NoteSymbolTypeEnum
//
//   chronaxie: Chronaxie // 时值0
//   direction: 'up' | 'down' // 控制符干方向，休止符时不起作用。 多个音符形成beam时，会对每个direction进行少数服从多数判断
//   region: number[], // 在五线谱上的位置，0就是第一线的位置，1是第一间的位置  休止符的region没有意义
//   accidental?: Accidental
//   augmentationDot?: AugmentationDot
//   widthRatio: number // 这个是代表四分音符，具体需要乘算chronaxie
//   widthRatioForMeasure: number, // 这个是代表四分音符，具体需要乘算chronaxie
//   affiliatedSymbols: SingleAffiliatedSymbol[], // 单音符附属型
//   beamType: BeamTypeEnum
// } & Frame
export type NoteSymbol = {
  id: string
  type: NoteSymbolTypeEnum
  direction: 'up' | 'down' // 控制声部1符干方向（声部2反向），休止符时不起作用。 多个音符形成beam时，会对每个direction进行少数服从多数判断
  voicePart1: {
    chronaxie: Chronaxie // 时值
    notesInfo: NotesInfo[]
    augmentationDot?: AugmentationDot
    affiliatedSymbols: SingleAffiliatedSymbol[], // 单音符附属型, 声部统一
    beamType: BeamTypeEnum
  }[]
  voicePart2: {
    chronaxie: Chronaxie // 时值
    notesInfo: NotesInfo[]
    augmentationDot?: AugmentationDot
    affiliatedSymbols: SingleAffiliatedSymbol[], // 单音符附属型, 声部统一
    beamType: BeamTypeEnum
  }[]
  clef?: Clef // 可选，符号前的谱号（使用前置谱号皮肤包），仅需展示时加
  widthRatio: number // 这个是代表四分音符，具体需要乘算chronaxie
  widthRatioForMeasure: number, // 这个是代表四分音符，具体需要乘算chronaxie

} & Frame
export type NotesInfo = {
  id: string
  region: number
  accidental?: Accidental
} & Frame
// ==========================================简谱================================================
export type NotesNumberInfo = {
  id: string
  /** 0=休止符, 1-7=do re mi fa sol la si, 'X'=节奏音符（无音高，仅节奏） */
  syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X',
  accidental: Accidental,
}
// 简谱音乐符号
export type NoteNumber = {
  id: string
  voicePart: {
    chronaxie: Chronaxie // 时值
    notesInfo: NotesNumberInfo[]
    augmentationDot?: AugmentationDot
    affiliatedSymbols: SingleAffiliatedSymbol[], // 单音符附属型, 声部统一
    beamType: BeamTypeEnum
  }[]
  clef?: Clef // 可选，符号前的谱号（使用前置谱号皮肤包），仅需展示时加
  widthRatio: number // 这个是代表四分音符，具体需要乘算chronaxie
  widthRatioForMeasure: number, // 这个是代表四分音符，具体需要乘算chronaxie
} & Frame