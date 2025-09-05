import {
    ChronaxieEnum,
    ClefEnum,
    KeySignatureEnum,
    MsSymbolTypeEnum,
    MusicScoreShowModeEnum,
    MsSymbolContainerTypeEnum,
    AccidentalEnum,
    BarLineTypeEnum,
    SpanSymbolFollowingCategoryEnum,
    SpanSymbolTypeEnum,
    MsTypeNameEnum,
    OrderTypeEnum,
    MsMode,
    ReserveMsSymbolType,
    BeamTypeEnum, StaffRegionEnum, StaffPositionTypeEnum, NoteLetterEnum, SolmizationEnum
} from "./musicScoreEnum";
// 八度数
export type Octave = number

export declare type Midi = number

export declare interface MusicScoreOptions {
    highlight: Boolean;
    highlightColor: string;
    color: string;
}

// 五线谱位置
export interface StaffRegion {
    region: StaffRegionEnum      // Lower / Main / Upper
    type: StaffPositionTypeEnum  // Line / Space
    index: number                // 第几条线/间，从 1 开始,例：下加三线=lower Line 3
}

// 组合成音名 (NoteName)
export interface NoteName {
    letter: NoteLetterEnum
    accidental: AccidentalEnum
    octave: Octave
}

export declare type NoteString = `${NoteLetterEnum}${AccidentalEnum}${Octave}`

export declare interface TimeSignature {
    beat: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
    chronaxie: ChronaxieEnum,
}

export declare interface Rect {
    width: number;
    height: number;
    left: number;
    top: number;
}

export declare type MusicScoreIndex = {
    multipleStavesIndex: number,
    singleStaffIndex: number,
    measureIndex: number,
    msSymbolContainerIndex: number,
    msSymbolIndex: number,
}

export declare type BaseMsSymbol = {
    msSymbolArray: Array<MsSymbol>
    options: MusicScoreOptions
    id: number,
    msTypeName: MsTypeNameEnum.MsSymbol,
    bindingStartId: Array<number>,
    bindingEndId: Array<number>,
    index: MusicScoreIndex,
    vueKey: number,
}
export declare type NoteHead = ({
    type: MsSymbolTypeEnum.NoteHead,
    region: StaffRegion   // 五线谱区域
    chronaxie: ChronaxieEnum; // 时值
    beamId: number, // 是否成连音组，连音组的话为唯一组号,-1为无
} & BaseMsSymbol)

export declare type NoteNumber = ({
    type: MsSymbolTypeEnum.NoteNumber,
    solmization: SolmizationEnum   // 唱名
    chronaxie: ChronaxieEnum; // 时值
    octave: Octave; // 八度，首调
    beamId: number, // 是否成连音组，连音组的话为唯一组号,-1为无
} & BaseMsSymbol)

export declare type NoteStem = ({
    type: MsSymbolTypeEnum.NoteStem,
    direction: 'up' | 'down',
} & BaseMsSymbol)
export declare type NoteTail = ({
    type: MsSymbolTypeEnum.NoteTail,
    chronaxie: ChronaxieEnum,
    beamType: BeamTypeEnum,
    direction: 'up' | 'down',
} & BaseMsSymbol)
export declare type TimeSignatureMsSymbol = ({
    type: MsSymbolTypeEnum.TimeSignature,
    timeSignature: TimeSignature
} & BaseMsSymbol)
export declare type KeySignatureMsSymbol = ({
    type: MsSymbolTypeEnum.KeySignature,
    keySignature: KeySignatureEnum,
} & BaseMsSymbol)
export declare type AccidentalMsSymbol = ({
    type: MsSymbolTypeEnum.Accidental,
    accidental: AccidentalEnum,
} & BaseMsSymbol)

export declare type ClefMsSymbol = ({
    type: MsSymbolTypeEnum.Clef | MsSymbolTypeEnum.Clef_f,
    clef: ClefEnum
} & BaseMsSymbol)
export declare type BarLine = ({
    type: MsSymbolTypeEnum.BarLine | MsSymbolTypeEnum.BarLine_f,
    barLineType: Exclude<BarLineTypeEnum, BarLineTypeEnum.endRepeatSign | BarLineTypeEnum.startRepeatSign>,
} & BaseMsSymbol) | ({
    type: MsSymbolTypeEnum.BarLine | MsSymbolTypeEnum.BarLine_f,
    barLineType: BarLineTypeEnum.endRepeatSign | BarLineTypeEnum.startRepeatSign,
    loopCount: number
} & BaseMsSymbol)
export declare type Rest = ({
    type: MsSymbolTypeEnum.Rest,
    chronaxie: ChronaxieEnum,
} & BaseMsSymbol)
export declare type MsSymbol = NoteHead | ClefMsSymbol | NoteNumber
    | TimeSignatureMsSymbol | KeySignatureMsSymbol
    | AccidentalMsSymbol | NoteTail | BarLine | Rest | NoteStem | ({
    type: Exclude<MsSymbolTypeEnum, MsSymbolTypeEnum.NoteHead | MsSymbolTypeEnum.NoteNumber | MsSymbolTypeEnum.Clef |
        MsSymbolTypeEnum.TimeSignature | MsSymbolTypeEnum.Clef_f
        | MsSymbolTypeEnum.NoteTail | MsSymbolTypeEnum.KeySignature
        | MsSymbolTypeEnum.Accidental | MsSymbolTypeEnum.BarLine
        | MsSymbolTypeEnum.BarLine_f | MsSymbolTypeEnum.Rest | MsSymbolTypeEnum.NoteStem>,


} & BaseMsSymbol)

export declare type BaseSpanSymbol = {
    id: number,
    msTypeName: MsTypeNameEnum.SpanSymbol,
    rect: Rect
    vueKey: number,
}
export declare type Volta = (BaseSpanSymbol & {
    type: SpanSymbolTypeEnum.volta
    spanSymbolFollowingCategoryEnum: SpanSymbolFollowingCategoryEnum.measure,
    startTargetId: number,
    endTargetId: number,
    options: MusicScoreOptions,
})
export declare type Slur = (BaseSpanSymbol & {
    type: SpanSymbolTypeEnum.slur
    spanSymbolFollowingCategoryEnum: SpanSymbolFollowingCategoryEnum.msSymbol,
    startTargetId: number,
    endTargetId: number,
    options: MusicScoreOptions,
})
// 跨小节符号.  目前只有小节跟随型和符号（音符头）跟随型
export declare type SpanSymbol = Volta | Slur

export declare type MsSymbolContainer = {
    id: number,
    msSymbolArray: Array<MsSymbol>
    bindingStartId: Array<number>,
    bindingEndId: Array<number>,
    type: MsSymbolContainerTypeEnum,
    index: MusicScoreIndex,
    options: MusicScoreOptions
    msTypeName: MsTypeNameEnum.MsSymbolContainer,
    vueKey: number,
}

export declare interface Measure {
    id: number,
    msSymbolContainerArray: Array<MsSymbolContainer>
    bindingStartId: Array<number>,
    bindingEndId: Array<number>,
    msTypeName: MsTypeNameEnum.Measure,
    index: MusicScoreIndex,
    options: MusicScoreOptions,
    vueKey: number,
}

export declare interface SingleStaff {
    id: number,
    measureArray: Array<Measure>;
    singleStaffPaddingTop: number,
    singleStaffPaddingBottom: number,
    singleStaffMarginBottom: number,
    bindingStartId: Array<number>,
    bindingEndId: Array<number>,
    msTypeName: MsTypeNameEnum.SingleStaff,
    index: MusicScoreIndex,
    options: MusicScoreOptions,
    vueKey: number,

}

export declare interface MultipleStaves { //复谱表
    id: number,
    singleStaffArray: Array<SingleStaff>;
    multipleStavesPaddingTop: number,
    multipleStavesPaddingBottom: number,
    multipleStavesMarginBottom: number,
    bindingStartId: Array<number>,
    bindingEndId: Array<number>,
    msTypeName: MsTypeNameEnum.MultipStaves,
    index: MusicScoreIndex,
    options: MusicScoreOptions,
    vueKey: number,

}

export type MsType = MultipleStaves | SingleStaff | Measure | MsSymbolContainer | SpanSymbol | MsSymbol

//调号，拍号只能小节有，谱号是音符有（但是谱号给第一个音符加谱号，会加到前一个小节上，也可以给小节加谱号，相当于给小节的第一个音符加谱号）小节也有
export declare interface MusicScore {
    title?: string;
    multipleStavesArray: Array<MultipleStaves>;
    measureHeight: number,
    showMode: MusicScoreShowModeEnum
    spanSymbolArray: Array<SpanSymbol>,
    widthDynamicRatio: number, //动态宽度部分占比
    map: Record<number, MsType>,
    vueKey: number,
}

// 宽度系数
export declare type WidthConstant = number

// 通过索引获取的数据类型

export declare type IndexData = {
    multipleStaves: MultipleStaves | null,
    singleStaff: SingleStaff | null,
    measure: Measure | null,
    msSymbolContainer: MsSymbolContainer | null,
    msSymbol: MsSymbol | null,
}


// 虚拟符号容器类型
export declare type VirtualSymbolContainerType = 'front' | 'middle' | 'end' | 'self'

// 连音组
export declare type BeamGroupItem = {
    beamId: number,
    note: NoteHead | NoteNumber,
    region: StaffRegion,
    chronaxie: ChronaxieEnum
}
export declare type BeamGroup = Array<BeamGroupItem>