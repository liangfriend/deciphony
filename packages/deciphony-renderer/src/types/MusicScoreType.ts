import {
  AccidentalTypeEnum,
  ArpeggioTypeEnum,
  BarlineTypeEnum,
  BeamTypeEnum,
  BendTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  DoubleMeasureAffiliatedSymbolNameEnum,
  DoubleNoteAffiliatedSymbolNameEnum,
  DoubleSlotAffiliatedSymbolNameEnum,
  DrumHeadTypeEnum,
  GuzhengLianTypeEnum,
  HairpinTypeEnum,
  KeySignatureTypeEnum,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  MusicScoreTypeEnum,
  NoteName,
  NoteSymbolTypeEnum,
  PedalTypeEnum,
  PitchTypeEnum,
  SingleMeasureAffiliatedSymbolNameEnum,
  SingleNoteAffiliatedSymbolNameEnum,
  SingleSlotAffiliatedSymbolNameEnum,
  SlurStyleEnum,
  SlurTypeEnum,
  TabNoteInfoTypeEnum,
  TimeSignatureTypeEnum,
  TrillTypeEnum
} from "@/enums/musicScoreEnum";

import {Chronaxie, Frame} from "@/types/common";
import type {ExtraMeasureSymbolRule, ExtraNoteSymbolRule, ExtraSlotSymbolRule} from "@/constants/renderRules";

// ==========================================通用================================================

// 音程，1 = 一个半音
export type Semitone = number
/*
* SJ格式
* */
export type MusicScore = {

  id: string

  type: MusicScoreTypeEnum,

  grandStaffs: GrandStaff[],

  affiliatedSymbols: (
      | DoubleNoteAffiliatedSymbol
      | DoubleMeasureAffiliatedSymbol
      | DoubleSlotAffiliatedSymbol
      )[] // 曲谱级附属（跨宿主）：双音符 / 双小节 / 双 slot；单宿主附属挂在宿主自身

  width: number,

  height: number,

  topSpaceHeight: number, // 顶部留白（space，在 t 插槽之上）

  title?: string // 标题

  subTitle?: string // 副标题

  author?: string // 作者

  description: string // 描述

  bpm?: number // 拍速, 默认单位是4分音符为一拍

  beatUnit?: number // 1 2 4 8 16 ... bpm基准拍
  // 全局调号拍号：供播放 / 标题元信息等使用；不参与小节符号绘制（谱面只画小节上的 keySignature_f/b、timeSignature_f/b）
  keySignature?: KeySignatureTypeEnum

  timeSignature?: TimeSignatureTypeEnum

  /** 小节号；不设则不显示 */
  measureNumber?: MeasureNumber

  /*
   * 自定义符号（可选只为兼容旧曲谱）：附属符号 name 填 skinKey 引用
   * - extraNoteSymbol → SingleNoteAffiliatedSymbol（音符 / 休止符 affiliatedSymbols）
   * - extraSlotSymbol → SingleSlotAffiliatedSymbol（MeasureNoteSlot.affiliatedSymbols）
   * - extraMeasureSymbol → SingleMeasureAffiliatedSymbol（Measure.affiliatedSymbols）
   */
  extraNoteSymbol?: ExtraNoteSymbol[]

  extraSlotSymbol?: ExtraSlotSymbol[]

  extraMeasureSymbol?: ExtraMeasureSymbol[]

  data: Object // 自定义数据

}

/**
 * 自定义符号的皮肤部分，字段同皮肤包 SkinItem；渲染时注入当前谱种的皮肤包。
 * skinKey 在三个 extra*Symbol 数组里必须唯一，且不能与内置符号名 / 皮肤键重名（重名时内置优先，自定义不生效）。
 */
export type ExtraSymbolSkin = {
  /** 显示名 */
  name: string
  /** svg 字符串，同皮肤包 content */
  content: string
  w: number
  h: number
  widthRatio?: number
  widthRatioForMeasure?: number
  skinKey: string
}

/** 自定义音符符号 = 皮肤 + 单音符附属规则（vertical / horizontal × measureHeight，相对符头中心，可选简谱 numberNotationAnchor） */
export type ExtraNoteSymbol = ExtraSymbolSkin & ExtraNoteSymbolRule

/** 自定义 slot 符号 = 皮肤 + 单 slot 附属规则（offset：相对 slot 列起点 / 小节底，符号中心对齐） */
export type ExtraSlotSymbol = ExtraSymbolSkin & ExtraSlotSymbolRule

/** 自定义小节符号 = 皮肤 + 单小节附属规则（placement / align / type / vertical / horizontal） */
export type ExtraMeasureSymbol = ExtraSymbolSkin & ExtraMeasureSymbolRule

/** 自定义符号种类 → 符号类型 */
export type ExtraSymbolMap = {
  note: ExtraNoteSymbol
  slot: ExtraSlotSymbol
  measure: ExtraMeasureSymbol
}

export type ExtraSymbolKind = keyof ExtraSymbolMap

export type ExtraSymbol = ExtraSymbolMap[ExtraSymbolKind]

type ExtraSymbolSkinRequired = 'name' | 'content' | 'w' | 'h' | 'skinKey'

/** 创建自定义符号的入参：皮肤部分必填，规则字段可缺省（缺省值见 renderer normalizeExtraSymbol） */
export type ExtraSymbolInput<K extends ExtraSymbolKind> =
  Pick<ExtraSymbolMap[K], ExtraSymbolSkinRequired> & Partial<Omit<ExtraSymbolMap[K], ExtraSymbolSkinRequired>>

/**
 * 小节号：从第 2 个复谱表起，在每个复谱表首小节左上方显示该行第一小节的序号
 * （= 之前各复谱表第一个单谱表的小节数之和 + 1）。
 * Frame 对所有小节号统一生效。
 */
export type MeasureNumber = {

  id: string

  /** 是否带括号，如 (5) */
  bracket?: boolean

} & Frame

export type GrandStaff = {

  id: string

  staves: SingleStaff[],

  uSpace: number,  // 复谱表上间距

  dSpace: number,  // 复谱表下间距

  /** 连谱模式：单谱表小节宽度一致，widthRatioForMeasure 按相同索引累加；小节数少的谱表与多者按列对齐 */

  linkedStaff?: boolean

  bracket?: Bracket

  data: Object // 自定义数据

} & Frame


/*

*  开始位置到复谱表最后一个单谱表之间大于等于两个单谱表的时候，才会渲染连谱号

* */

export type Bracket = {

  id: string

  type: BracketTypeEnum,

  startSingleStaffIndex: number // 从第几个单谱表开始，如果单谱表数量为2，startSingleStaffIndex=1，则不会显示

} & Frame

export type SingleStaff = {

  id: string

  measures: Measure[], // 小节

  uSpaceO: number,  // 单谱表上间距-外

  uSpaceI: number,  // 单谱表上间距-内

  dSpaceI: number,  // 单谱表下间距-内

  dSpaceO: number,  // 单谱表下间距-外

  data: Object // 自定义数据

} & Frame


/** 五线谱小节内的音符位 / 休止符位（简谱为 NoteNumber） */

export type StaffSlot = NoteSymbol | NoteRest;
export type DrumSlot = DrumNote | DrumRest;
export type TabSlot = TabNote | TabRest

/** 绑定在音符槽位上的歌词（含 Frame 偏移） */
export type Lyrics = {
  text: string
} & Frame

/** 槽内记谱体（不含槽级 lyrics / data / Frame） */
export type MeasureNoteSymbol = StaffSlot | TabSlot | NoteNumber | DrumSlot

/**
 * 小节内音符槽：树节点（与复谱表 / 单谱表 / 小节同构：id + Frame）。
 * 单 slot 附属（琶音 / 扫弦）挂在本节点 affiliatedSymbols；双 slot 附属（踏板 / pitch）经 startId/endId 锚定本节点 id；
 * 符头级附属挂在 symbol 内 NotesInfo / NoteRest / NoteNumber。
 */
export type MeasureNoteSlot = {
  id: string
  lyrics: Lyrics[]
  /** 单 slot 附属型（琶音 / 扫弦） */
  affiliatedSymbols?: SingleSlotAffiliatedSymbol[]
  data: Object
  /** 槽内记谱体（自有 id / Frame，用于符头与单音附属） */
  symbol: MeasureNoteSymbol
} & Frame

/** 鼓谱小节的上下两个声部：up 声部符干向上，down 声部符干向下；同 onset 的槽位纵向对齐 */
export type MeasureNoteVoices = {
  up: MeasureNoteSlot[]
  down: MeasureNoteSlot[]
}

export type Measure = {

  id: string

  notes: MeasureNoteSlot[] | MeasureNoteVoices,

  /** 长休止符：为 true 时小节不渲染音符，连续的 longRest 小节合并成一组显示 */
  longRest?: boolean,

  barline_f?: Barline, // 前置小节线（TimeSignature_f 之后）

  barline_b?: Barline, // 后置小节线（音符之后、clef_b 之前）

  clef_f?: Clef, // 前置谱号

  clef_b?: Clef, // 后置谱号

  keySignature_f?: KeySignature,

  keySignature_b?: KeySignature,

  timeSignature_f?: TimeSignature,

  timeSignature_b?: TimeSignature,

  /** 简谱：notesInfo 向上叠层，第 n+1 层默认紧贴第 n 层（中间夹着第 n 层的上八度点、第 n+1 层的下八度点）；floorSpan[n] 为两层之间额外加的间距 */

  floorSpan?: number[],

  /** 小节前反复符号（Coda / Segno，最多一个） */

  startRepeat?: MeasureStartRepeat,

  /** 小节末反复符号（DC / DS / Fine 等，最多一个） */

  endRepeat?: MeasureEndRepeat,

  affiliatedSymbols: (SingleMeasureAffiliatedSymbol)[] // 单小节附属型

  data: Object // 自定义数据

} & Frame


/*

* 附点

* */

export type AugmentationDot = {

  id: string

  count: 1 | 2 | 3,

} & Frame

/*

* 附属型符号 accent above, accidental等等， 符干符尾不属于附属型符号，它是根据音符时值信息固定逻辑判断是否存在的符号

*

* */

export type DoubleNoteAffiliatedSymbol = {

  id: string

  name: DoubleNoteAffiliatedSymbolNameEnum,

  /** 五线谱 NotesInfo.id / 简谱 NotesNumberInfo.id */
  startId: string,

  /** 五线谱 NotesInfo.id / 简谱 NotesNumberInfo.id */
  endId: string,

  data: {

    slur?: {

      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      relativeControlPoint: { x: number, y: number },

      thickness: number,

      type?: SlurTypeEnum,
      relativeTextPoint?: { x: number, y: number },
      /**
       * 造型：`rounded` 圆润 / `sharp` 尖锐。
       * 未指定时按谱种；指定时优先于谱种。
       */
      style?: SlurStyleEnum,
    },

  }

} & Frame

/** 单 slot 附属：挂在宿主 MeasureNoteSlot.affiliatedSymbols */
export type SingleSlotAffiliatedSymbol = {

  id: string

  /** 内置符号名，或 MusicScore.extraSlotSymbol 里的 skinKey */
  name: SingleSlotAffiliatedSymbolNameEnum | string,

  data: {

    arpeggio?: {
      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      arrow: boolean,
      type?: ArpeggioTypeEnum,
    },

    strumming?: {
      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      arrow: boolean
    },

  }

} & Frame

/** 双 slot 附属：锚定起止两列；默认 x=slot 起点，y=小节底 */
export type DoubleSlotAffiliatedSymbol = {

  id: string

  name: DoubleSlotAffiliatedSymbolNameEnum,

  /** 开始列 MeasureNoteSlot.id */
  startId: string,

  /** 结束列 MeasureNoteSlot.id */
  endId: string,

  data: {

    pedal?: {
      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      type?: PedalTypeEnum,
    },

    pitch?: {
      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      type?: PitchTypeEnum,
    },

    trill?: {
      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      type?: TrillTypeEnum,
    },

    hairpin?: {
      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      type?: HairpinTypeEnum,

      /** 楔形开口高度（px）；仅 *_hairpin 生效，缺省 12 */
      height?: number,
    },

    /** 古筝连续指法（guzheng_lian） */
    guzhengLian?: {
      relativeStartPoint: { x: number, y: number },

      relativeEndPoint: { x: number, y: number },

      type?: GuzhengLianTypeEnum,
    },

  }

} & Frame


export type DoubleMeasureAffiliatedSymbol = {

  id: string

  name: DoubleMeasureAffiliatedSymbolNameEnum,

  startId: string,

  endId: string,

  data: {

    volta?: {

      text: string
      // [0]表示播放第一遍  [0,1]表示播放第一遍，第二遍，以此类推
      value: number[]
      /** 盒子高度（× measureHeight），默认 0.5 */
      relativeX?: number
      relativeY?: number
      relativeW?: number
      relativeH?: number
      heightRatio?: number
      // 是否开放左侧（是否隐藏左侧竖线）
      openLeft?: boolean
      // 是否开放右侧（是否隐藏右侧竖线）
      openRight?: boolean

    }

  }

} & Frame


export type SingleNoteAffiliatedSymbol = {

  id: string

  /** 内置符号名，或 MusicScore.extraNoteSymbol 里的 skinKey */
  name: SingleNoteAffiliatedSymbolNameEnum | string,

  data: Record<string, never>

} & Frame


export type SingleMeasureAffiliatedSymbol = {

  id: string

  /** 内置符号名，或 MusicScore.extraMeasureSymbol 里的 skinKey */
  name: SingleMeasureAffiliatedSymbolNameEnum | string,

  data: Record<string, never>

} & Frame


/** 小节前反复符号 */

export type MeasureStartRepeat = {

  id: string

  type: MeasureStartRepeatEnum

} & Frame


/** 小节末反复符号 */

export type MeasureEndRepeat = {

  id: string

  type: MeasureEndRepeatEnum

} & Frame


// 小节线

export type Barline = {

  id: string

  type: BarlineTypeEnum

} & Frame

// 谱号 谱号出现在小节和音符上 后置谱号在小节线之前

export type Clef = {

  id: string

  type: ClefTypeEnum

} & Frame

// 调号 后置调号在小节线之后

export type KeySignature = {

  id: string

  type: KeySignatureTypeEnum

} & Frame

// 拍号 后置拍号在小节线之后

export type TimeSignature = {

  id: string

  type: TimeSignatureTypeEnum

} & Frame

export type Accidental = {

  id: string

  type: AccidentalTypeEnum

} & Frame

// ==========================================线谱================================================


/** 五线谱音符位：时值 / 附点 / 附属在 NotesInfo 上 */

export type NoteSymbol = {

  id: string

  type: NoteSymbolTypeEnum.Note

  notesInfo: NotesInfo[]

  graceNotes?: NotesInfo[]

  graceNotesAfter?: NotesInfo[]

  clef?: Clef

} & Frame

export type NoteRest = {

  id: string

  type: NoteSymbolTypeEnum.Rest

  chronaxie: Chronaxie

  augmentationDot?: AugmentationDot

  affiliatedSymbols?: SingleNoteAffiliatedSymbol[]

  clef?: Clef

} & Frame


export type NotesInfo = {

  id: string

  direction: 'up' | 'down'

  region: number

  chronaxie: Chronaxie

  beamType: BeamTypeEnum

  augmentationDot?: AugmentationDot

  affiliatedSymbols: SingleNoteAffiliatedSymbol[]

  accidental?: Accidental

} & Frame


// ==========================================简谱================================================

export type NotesNumberInfo = {

  id: string

  /** 0=休止符, 1-7=do re mi fa sol la si, 'X'=节奏音符（无音高，仅节奏） */

  syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X',

  chronaxie: Chronaxie,

  beamType: BeamTypeEnum,

  accidental?: Accidental,

  augmentationDot?: AugmentationDot,

  /** 正数=音符上方的八度点（高八度），负数=下方的八度点（低八度），0=无 */

  octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6

} & Frame


// 简谱音乐符号（简谱无谱号概念，无 clef）

/** 多层（和弦）notesInfo[0] 为最底层；减时线、加时线只画 notesInfo[0] 的 */
export type NoteNumber = {

  id: string

  notesInfo: NotesNumberInfo[]

  graceNotes?: NotesNumberInfo[]

  graceNotesAfter?: NotesNumberInfo[]

  affiliatedSymbols: SingleNoteAffiliatedSymbol[]

} & Frame

// TODO 之类后续三期可能改成 吉他/贝斯/尤克里里   因为tabNote在这三个谱子里是通用的
// ==========================================吉他谱================================================

export type Barre = {
  /** 相对品，与 stringStates.finger 数字语义一致 */
  fret: number,
  /** 横按指法文字，下标与 stringStates 弦索引一致 */
  text: string[],
  /** 弦索引（0=1弦/细/右），横按起点 */
  startStringNumber: number,
  /** 弦索引，横按终点（粗弦侧）；start > end 无效 */
  endStringNumber: number,
}
// finger指法提示， x o -1这三个表示没有按弦。-1是什么都没有。正整数表示相对品，0=第(baseFret+1)品。text是给正整数number用的, 按弦的圆圈显示的文本内容
export type StringState = { finger: 'x' | 'o' | number, text: string }
// 参数1：第几品（0=baseFret），参数2：第几弦，参数3：指法，string
export type Finger = [number, number, string]
export type tabChord = {
  id: string,
  width: number,
  height: number,
  stringCount: number
  name: string
  fretCount: number
  baseFret: number
  barres: Barre[],
  tuning: NoteName[]
  // 索引代表弦，比如索引0=从右往左第一弦，
  stringStates: StringState[]
  /** 和弦图文字字号，默认 32 */
  textSize?: number
  /** 和弦名字号，默认 64 */
  nameSize?: number
} & Frame
export type TabNote = {

  id: string

  type: NoteSymbolTypeEnum.Note

  notesInfo: TabNoteInfo[]

  graceNotes?: TabNoteInfo[]

  graceNotesAfter?: TabNoteInfo[]

  /** 可选；空占位（无名字/无按弦/无横按）不应渲染 */
  chord?: tabChord

  isSlap: boolean
} & Frame

export type TabRest = {

  id: string

  type: NoteSymbolTypeEnum.Rest

  chronaxie: Chronaxie

  augmentationDot?: AugmentationDot

  affiliatedSymbols?: SingleNoteAffiliatedSymbol[]


} & Frame

export type TabNoteInfoRegionRange = {
  start: number
  end: number
}

type TabNoteInfoCommon = {
  id: string
  chronaxie: Chronaxie
  value: number // 品，-1代表x
  beamType: BeamTypeEnum
  augmentationDot?: AugmentationDot
  affiliatedSymbols: SingleNoteAffiliatedSymbol[]
} & Frame

type TabNoteGeometryStyle = {
  /** 箭杆与箭头描边厚度，默认 2 */
  thickness?: number
  /** 箭头总宽（用于 vDom.w 与 slot 中心对齐），默认 8 */
  arrowWidth?: number
}
// 推弦
export type Bend = {
  id: string
  type: BendTypeEnum
  periodOne: Semitone
  periodTwo: Semitone // 预推弦和推弦情况，第二阶段值无作用
} & Frame
/** normal 用 region；琶音 / 扫弦用 regionRange */
export type TabNoteInfo =
    | (TabNoteInfoCommon & {
  type: TabNoteInfoTypeEnum.Normal | TabNoteInfoTypeEnum.Harmonic
  region: number // 第几条线，0 是第一线
  bend?: Bend
})
    | (TabNoteInfoCommon & {
  type: TabNoteInfoTypeEnum.Arpeggio // 琶音
  regionRange: TabNoteInfoRegionRange
} & TabNoteGeometryStyle)
    | (TabNoteInfoCommon & {
  type: TabNoteInfoTypeEnum.Strumming // 扫弦
  regionRange: TabNoteInfoRegionRange
} & TabNoteGeometryStyle)


// ==========================================鼓谱================================================

export type DrumNote = {

  id: string

  type: NoteSymbolTypeEnum.Note

  notesInfo: DrumNotesInfo[]

  /** 前倚音：index0 最靠主音；符干方向随所在声部 */
  graceNotes?: DrumNotesInfo[]

  /** 后倚音：index0 最靠主音；符干方向随所在声部 */
  graceNotesAfter?: DrumNotesInfo[]

} & Frame

export type DrumRest = {

  id: string

  type: NoteSymbolTypeEnum.Rest

  /** 休止符几何中心所在线位（与音符 region 同一坐标） */
  region: number

  chronaxie: Chronaxie

  augmentationDot?: AugmentationDot

  affiliatedSymbols?: SingleNoteAffiliatedSymbol[]

} & Frame

export type DrumNotesInfo = {

  id: string

  region: number

  headType: DrumHeadTypeEnum

  chronaxie: Chronaxie

  beamType: BeamTypeEnum

  augmentationDot?: AugmentationDot

  affiliatedSymbols: SingleNoteAffiliatedSymbol[]

  ghost?: boolean // 是否魔鬼音符


} & Frame