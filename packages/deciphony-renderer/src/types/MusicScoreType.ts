import {
    AccidentalTypeEnum,
    BarlineTypeEnum, BeamTypeEnum, BracketTypeEnum,
    ClefTypeEnum,
    DoubleMeasureAffiliatedSymbolNameEnum,
    DoubleNoteAffiliatedSymbolNameEnum,
    KeySignatureTypeEnum,
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
    topSpaceHeight: number, // 顶部高度
    title: string // 标题
    bpm: number // 拍速
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
}
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
    barline_f?: Barline, // 前置小节线（TimeSignature_f 之后）
    barline_b?: Barline, // 后置小节线（音符之后、clef_b 之前）
    clef_f?: Clef, // 前置谱号
    clef_b?: Clef, // 后置谱号
    keySignature_f?: KeySignature,
    keySignature_b?: KeySignature,
    timeSignature_f?: TimeSignature,
    timeSignature_b?: TimeSignature,
    widthRatioForMeasure?: number,
    affiliatedSymbols: (SingleNoteAffiliatedSymbol | SingleMeasureAffiliatedSymbol)[] // 单音符、单小节附属型
} & Frame

/*
* 附点
* */
export type AugmentationDot = {
    id: string
    count: 1 | 2 | 3,
    widthRatio?: number
    widthRatioForMeasure?: number,
} & Frame
/*
* 附属型符号 accent above, accidental等等， 符干符尾不属于附属型符号，它是根据音符时值信息固定逻辑判断是否存在的符号
*
* */
export type DoubleNoteAffiliatedSymbol = {
    id: string
    name: DoubleNoteAffiliatedSymbolNameEnum,
    startId: string,
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


// 小节线
export type Barline = {
    id: string
    barlineType: BarlineTypeEnum
    widthRatio?: number // 目前完全无用
    widthRatioForMeasure?: number
} & Frame
// 谱号 谱号出现在小节和音符上 后置谱号在小节线之前
export type Clef = {
    id: string
    clefType: ClefTypeEnum
    widthRatio?: number // 因为谱号有出现在音符上的情况，所以这个widthRatio不是完全无用的
    widthRatioForMeasure?: number
} & Frame
// 调号 后置调号在小节线之后
export type KeySignature = {
    id: string
    type: KeySignatureTypeEnum
    widthRatio?: number // 目前完全无用
    widthRatioForMeasure?: number
} & Frame
// 拍号 后置拍号在小节线之后
export type TimeSignature = {
    id: string
    type: TimeSignatureTypeEnum
    widthRatio?: number // 目前完全无用
    widthRatioForMeasure?: number
} & Frame
export type Accidental = {
    id: string
    type: AccidentalTypeEnum
    widthRatio?: number // 目前完全无用
    widthRatioForMeasure?: number
} & Frame
// ==========================================线谱================================================

export type NoteSymbol = ({
    id: string
    type: NoteSymbolTypeEnum // rest 时 notesInfo 不渲染
    notesInfo: NotesInfo[]
    /** 休止符时值；type 为 Rest 时使用 */
    chronaxie?: Chronaxie
    /** 休止符附点；type 为 Rest 时使用 */
    augmentationDot?: AugmentationDot
    /** 休止符单音符附属；type 为 Rest 时使用 */
    affiliatedSymbols?: SingleNoteAffiliatedSymbol[]
    clef?: Clef
    widthRatio?: number
    widthRatioForMeasure?: number,
} & Frame)

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


export type NotesNumberInfo = {
    id: string
    /** 0=休止符, 1-7=do re mi fa sol la si, 'X'=节奏音符（无音高，仅节奏） */
    syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X',
    accidental?: Accidental,
    /** 正数=音符上方的八度点（高八度），负数=下方的八度点（低八度），0=无 */
    octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6
}

// 简谱音乐符号（简谱无谱号概念，无 clef）
export type NoteNumber = {
    id: string
    chronaxie: Chronaxie
    notesInfo: NotesNumberInfo[]
    augmentationDot?: AugmentationDot
    affiliatedSymbols: SingleNoteAffiliatedSymbol[]
    beamType: BeamTypeEnum
    widthRatio?: number // 这个是代表四分音符，具体需要乘算chronaxie；未设置时用皮肤包
    widthRatioForMeasure?: number, // 这个是代表四分音符，具体需要乘算chronaxie；未设置时用皮肤包
} & Frame