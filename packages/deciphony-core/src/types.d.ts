import { ChronaxieEnum, ClefEnum, KeySignatureEnum, MsSymbolTypeEnum, MusicScoreShowModeEnum, MsSymbolContainerTypeEnum, AccidentalEnum, BarLineTypeEnum, SpanSymbolFollowingCategoryEnum, SpanSymbolTypeEnum, MsTypeNameEnum, BeamTypeEnum, StaffRegionEnum, StaffPositionTypeEnum, NoteLetterEnum, SolmizationEnum } from "./musicScoreEnum";
export type Octave = number;
export declare type Midi = number;
export declare interface MusicScoreOptions {
    highlight: Boolean;
    highlightColor: string;
    color: string;
    offset?: {
        startPoint?: {
            x: number;
            y: number;
        };
        endPoint?: {
            x: number;
            y: number;
        };
        leftSlope?: {
            x: number;
            y: number;
        };
        rightSlope?: {
            x: number;
            y: number;
        };
    };
}
export interface StaffRegion {
    region: StaffRegionEnum;
    type: StaffPositionTypeEnum;
    index: number;
}
export interface NoteName {
    letter: NoteLetterEnum;
    accidental: AccidentalEnum.None | AccidentalEnum.Sharp | AccidentalEnum.Flat | AccidentalEnum.DoubleFlat | AccidentalEnum.DoubleSharp;
    octave: Octave;
}
export declare type NoteString = `${NoteLetterEnum}${AccidentalEnum}${Octave}`;
export declare interface TimeSignature {
    beat: number;
    chronaxie: ChronaxieEnum;
}
export declare type MusicScoreIndex = {
    multipleStavesIndex: number;
    singleStaffIndex: number;
    measureIndex: number;
    msSymbolContainerIndex: number;
    msSymbolIndex: number;
};
export declare type BaseMsSymbol = {
    msSymbolArray: Array<MsSymbol>;
    options: MusicScoreOptions;
    id: number;
    msTypeName: MsTypeNameEnum.MsSymbol;
    bindingStartId: Array<number>;
    bindingEndId: Array<number>;
    index: MusicScoreIndex;
    vueKey: number;
};
export declare type NoteHead = ({
    type: MsSymbolTypeEnum.NoteHead;
    region: StaffRegion;
    chronaxie: ChronaxieEnum;
    beamId: number;
} & BaseMsSymbol);
export declare type NoteNumber = ({
    type: MsSymbolTypeEnum.NoteNumber;
    solmization: SolmizationEnum;
    chronaxie: Exclude<ChronaxieEnum, [ChronaxieEnum.whole, ChronaxieEnum.half]>;
    octave: Octave;
    beamId: number;
} & BaseMsSymbol);
export declare type ChronaxieIncreasingLine = ({
    type: MsSymbolTypeEnum.ChronaxieIncreasingLine;
} & BaseMsSymbol);
export declare type ChronaxieReducingLine = ({
    type: MsSymbolTypeEnum.ChronaxieReducingLine;
    chronaxie: ChronaxieEnum;
} & BaseMsSymbol);
export declare type NoteDot = ({
    type: MsSymbolTypeEnum.NoteDot;
    octave: Octave;
} & BaseMsSymbol);
export declare type NoteStem = ({
    type: MsSymbolTypeEnum.NoteStem;
    direction: 'up' | 'down';
} & BaseMsSymbol);
export declare type NoteTail = ({
    type: MsSymbolTypeEnum.NoteTail;
    chronaxie: ChronaxieEnum;
    beamType: BeamTypeEnum;
    direction: 'up' | 'down';
} & BaseMsSymbol);
export declare type TimeSignatureMsSymbol = ({
    type: MsSymbolTypeEnum.TimeSignature;
    timeSignature: TimeSignature;
} & BaseMsSymbol);
export declare type KeySignatureMsSymbol = ({
    type: MsSymbolTypeEnum.KeySignature;
    keySignature: KeySignatureEnum;
} & BaseMsSymbol);
export declare type AccidentalMsSymbol = ({
    type: MsSymbolTypeEnum.Accidental;
    accidental: AccidentalEnum;
} & BaseMsSymbol);
export declare type ClefMsSymbol = ({
    type: MsSymbolTypeEnum.Clef | MsSymbolTypeEnum.Clef_f;
    clef: ClefEnum;
} & BaseMsSymbol);
export declare type BarLine = ({
    type: MsSymbolTypeEnum.BarLine | MsSymbolTypeEnum.BarLine_f;
    barLineType: Exclude<BarLineTypeEnum, BarLineTypeEnum.endRepeatSign | BarLineTypeEnum.startRepeatSign>;
} & BaseMsSymbol) | ({
    type: MsSymbolTypeEnum.BarLine | MsSymbolTypeEnum.BarLine_f;
    barLineType: BarLineTypeEnum.endRepeatSign | BarLineTypeEnum.startRepeatSign;
    loopCount: number;
} & BaseMsSymbol);
export declare type Rest = ({
    type: MsSymbolTypeEnum.Rest;
    chronaxie: ChronaxieEnum;
} & BaseMsSymbol);
export declare type MsSymbol = NoteHead | ClefMsSymbol | NoteNumber | TimeSignatureMsSymbol | KeySignatureMsSymbol | AccidentalMsSymbol | NoteTail | BarLine | ChronaxieReducingLine | Rest | NoteStem | NoteDot | ChronaxieIncreasingLine;
export declare type BaseSpanSymbol = {
    id: number;
    msTypeName: MsTypeNameEnum.SpanSymbol;
    vueKey: number;
};
export declare type Volta = (BaseSpanSymbol & {
    type: SpanSymbolTypeEnum.volta;
    spanSymbolFollowingCategoryEnum: SpanSymbolFollowingCategoryEnum.measure;
    startTargetId: number;
    endTargetId: number;
    options: {
        highlight: Boolean;
        highlightColor: string;
        color: string;
        offset: VoltaPosition;
    };
});
export declare type Slur = (BaseSpanSymbol & {
    type: SpanSymbolTypeEnum.slur;
    spanSymbolFollowingCategoryEnum: SpanSymbolFollowingCategoryEnum.msSymbol;
    startTargetId: number;
    endTargetId: number;
    options: {
        highlight: Boolean;
        highlightColor: string;
        color: string;
        offset: SlurPosition;
    };
});
export declare type SpanSymbol = Volta | Slur;
export declare type MsSymbolContainer = {
    id: number;
    msSymbolArray: Array<MsSymbol>;
    bindingStartId: Array<number>;
    bindingEndId: Array<number>;
    type: MsSymbolContainerTypeEnum;
    index: MusicScoreIndex;
    options: MusicScoreOptions;
    msTypeName: MsTypeNameEnum.MsSymbolContainer;
    vueKey: number;
};
export declare interface Measure {
    id: number;
    msSymbolContainerArray: Array<MsSymbolContainer>;
    bindingStartId: Array<number>;
    bindingEndId: Array<number>;
    msTypeName: MsTypeNameEnum.Measure;
    index: MusicScoreIndex;
    options: MusicScoreOptions;
    vueKey: number;
}
export declare interface SingleStaff {
    id: number;
    measureArray: Array<Measure>;
    singleStaffPaddingTop: number;
    singleStaffPaddingBottom: number;
    singleStaffMarginBottom: number;
    bindingStartId: Array<number>;
    bindingEndId: Array<number>;
    msTypeName: MsTypeNameEnum.SingleStaff;
    index: MusicScoreIndex;
    options: MusicScoreOptions;
    vueKey: number;
}
export declare interface MultipleStaves {
    id: number;
    singleStaffArray: Array<SingleStaff>;
    multipleStavesPaddingTop: number;
    multipleStavesPaddingBottom: number;
    multipleStavesMarginBottom: number;
    bindingStartId: Array<number>;
    bindingEndId: Array<number>;
    msTypeName: MsTypeNameEnum.MultipStaves;
    index: MusicScoreIndex;
    options: MusicScoreOptions;
    vueKey: number;
}
export type MsType = MultipleStaves | SingleStaff | Measure | MsSymbolContainer | SpanSymbol | MsSymbol;
export declare interface MusicScore {
    title?: string;
    multipleStavesArray: Array<MultipleStaves>;
    showMode: MusicScoreShowModeEnum;
    spanSymbolArray: Array<SpanSymbol>;
    map: Record<number, MsType>;
    vueKey: number;
    widthDynamicRatio: number;
    measureHeight: number;
    style: any;
}
export declare type WidthConstant = number;
export declare type IndexData = {
    multipleStaves: MultipleStaves | null;
    singleStaff: SingleStaff | null;
    measure: Measure | null;
    msSymbolContainer: MsSymbolContainer | null;
    msSymbol: MsSymbol | null;
};
export declare type VirtualSymbolContainerType = 'front' | 'middle' | 'end' | 'self';
export declare type BeamGroupItem = {
    beamId: number;
    note: NoteHead | NoteNumber;
    region: StaffRegion;
    chronaxie: ChronaxieEnum;
};
export declare type BeamGroup = Array<BeamGroupItem>;
export type VoltaPosition = {
    startPoint: {
        x: number;
        y: number;
    };
    endPoint: {
        x: number;
        y: number;
    };
};
export type SlurPosition = {
    startPoint: {
        x: number;
        y: number;
    };
    endPoint: {
        x: number;
        y: number;
    };
    leftSlope: {
        x: number;
        y: number;
    };
    rightSlope: {
        x: number;
        y: number;
    };
};
