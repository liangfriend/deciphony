import {

    AccidentalTypeEnum,

    BarlineTypeEnum, BeamTypeEnum, BracketTypeEnum,

    ClefTypeEnum,

    DoubleMeasureAffiliatedSymbolNameEnum,

    DoubleNoteAffiliatedSymbolNameEnum,

    KeySignatureTypeEnum,

    MeasureEndRepeatEnum,

    MeasureStartRepeatEnum,

    MusicScoreTypeEnum,

    NoteSymbolTypeEnum,

    SingleMeasureAffiliatedSymbolNameEnum,

    SingleNoteAffiliatedSymbolNameEnum,

    TimeSignatureTypeEnum

} from "@/enums/musicScoreEnum";

import {Chronaxie, Frame} from "@/types/common";

// ==========================================通用================================================

export type MusicScore = {

    id: string

    type: MusicScoreTypeEnum,

    grandStaffs: GrandStaff[],

    affiliatedSymbols: (DoubleNoteAffiliatedSymbol | DoubleMeasureAffiliatedSymbol)[] // 双音符、双小节附属型

    width: number,

    height: number,

    topSpaceHeight: number, // 顶部留白（space，在 t 插槽之上）

    title?: string // 标题

    subTitle?: string // 副标题

    author?: string // 作者

    description: string // 描述

    bpm?: number // 拍速

}

export type GrandStaff = {

    id: string

    staves: SingleStaff[],

    uSpace: number,  // 复谱表上间距

    dSpace: number,  // 复谱表下间距

    /** 连谱模式：单谱表小节宽度一致，widthRatioForMeasure 按相同索引累加；小节数少的谱表与多者按列对齐 */

    linkedStaff?: boolean

    bracket?: Bracket

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

} & Frame


/** 五线谱小节内的音符位 / 休止符位（简谱为 NoteNumber） */

export type StaffSlot = NoteSymbol | NoteRest;
export type TabSlot = TabNote | TabRest


export type Measure = {

    id: string

    notes: (StaffSlot | TabSlot | NoteNumber)[],

    barline_f?: Barline, // 前置小节线（TimeSignature_f 之后）

    barline_b?: Barline, // 后置小节线（音符之后、clef_b 之前）

    clef_f?: Clef, // 前置谱号

    clef_b?: Clef, // 后置谱号

    keySignature_f?: KeySignature,

    keySignature_b?: KeySignature,

    timeSignature_f?: TimeSignature,

    timeSignature_b?: TimeSignature,

    /** 简谱：notesInfo 向上叠层；第 n 层与第 n+1 层中心距 = measureHeight + (floorSpan[n] ?? 0)，更高层 y 更小 */

    floorSpan?: number[],

    /** 小节前反复符号（Coda / Segno，最多一个） */

    startRepeat?: MeasureStartRepeat,

    /** 小节末反复符号（DC / DS / Fine 等，最多一个） */

    endRepeat?: MeasureEndRepeat,

    affiliatedSymbols: (SingleMeasureAffiliatedSymbol)[] // 单小节附属型

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

    name: SingleNoteAffiliatedSymbolNameEnum,

    data: Record<string, never>

} & Frame


export type SingleMeasureAffiliatedSymbol = {

    id: string

    name: SingleMeasureAffiliatedSymbolNameEnum,

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

    graceNotes?: NotesNumberInfo[]

    graceNotesAfter?: NotesNumberInfo[]

}


// 简谱音乐符号（简谱无谱号概念，无 clef）

export type NoteNumber = {

    id: string

    notesInfo: NotesNumberInfo[]

    affiliatedSymbols: SingleNoteAffiliatedSymbol[]

} & Frame

// TODO 之类后续三期可能改成 吉他/贝斯/尤克里里   因为tabNote在这三个谱子里是通用的
// ==========================================吉他谱================================================

export type TabNote = {

    id: string

    type: NoteSymbolTypeEnum.Note

    notesInfo: TabNoteInfo[]

    graceNotes?: TabNoteInfo[]

    graceNotesAfter?: TabNoteInfo[]

} & Frame

export type TabRest = {

    id: string

    type: NoteSymbolTypeEnum.Rest

    chronaxie: Chronaxie

    augmentationDot?: AugmentationDot

    affiliatedSymbols?: SingleNoteAffiliatedSymbol[]


} & Frame

export type TabNoteInfo = {

    id: string

    region: number // 这个含义是第几条线， 0是第一线，1是第二线...

    value: number // 品，-1代表x

    beamType: BeamTypeEnum

    augmentationDot?: AugmentationDot

    affiliatedSymbols: SingleNoteAffiliatedSymbol[]

} & Frame