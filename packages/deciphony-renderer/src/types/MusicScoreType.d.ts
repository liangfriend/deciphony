import { AccidentalTypeEnum, BarlineTypeEnum, BeamTypeEnum, ClefTypeEnum, DoubleAffiliatedSymbolNameEnum, KeySignatureTypeEnum, MusicScoreTypeEnum, NoteSymbolTypeEnum, SingleAffiliatedSymbolNameEnum, TimeSignatureTypeEnum } from "@/enums/musicScoreEnum";
import { Chronaxie, Frame } from "@/types/common";
export type MusicScore = {
    id: string;
    type: MusicScoreTypeEnum;
    grandStaffs: GrandStaff[];
    affiliatedSymbols: DoubleAffiliatedSymbol[];
    width: number;
    height: number;
    topSpaceHeight: number;
    title: string;
    bpm: number;
};
export type GrandStaff = {
    id: string;
    staves: SingleStaff[];
    uSpace: number;
    dSpace: number;
    /** 连谱模式：单谱表小节宽度一致，widthRatioForMeasure 按相同索引累加；小节数少的谱表与多者按列对齐 */
    linkedStaff?: boolean;
} & Frame;
export type SingleStaff = {
    id: string;
    measures: Measure[];
    uSpaceO: number;
    uSpaceI: number;
    dSpaceI: number;
    dSpaceO: number;
} & Frame;
export type Measure = {
    id: string;
    notes: NoteSymbol[] | NoteNumber[];
    barline_f?: Barline;
    barline_b?: Barline;
    clef_f?: Clef;
    clef_b?: Clef;
    keySignature_f?: KeySignature;
    keySignature_b?: KeySignature;
    timeSignature_f?: TimeSignature;
    timeSignature_b?: TimeSignature;
    widthRatioForMeasure?: number;
    affiliatedSymbols: SingleAffiliatedSymbol[];
} & Frame;
export type AugmentationDot = {
    id: string;
    count: 1 | 2 | 3;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type DoubleAffiliatedSymbol = {
    id: string;
    name: DoubleAffiliatedSymbolNameEnum;
    startId: string;
    endId: string;
    data: {
        slur?: {
            relativeStartPoint: {
                x: number;
                y: number;
            };
            relativeEndPoint: {
                x: number;
                y: number;
            };
            relativeControlPoint: {
                x: number;
                y: number;
            };
            thickness: number;
        };
        volta?: {
            text: string;
        };
    };
} & Frame;
export type SingleAffiliatedSymbol = {
    id: string;
    name: SingleAffiliatedSymbolNameEnum;
    data: {};
} & Frame;
export type Barline = {
    id: string;
    barlineType: BarlineTypeEnum;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type Clef = {
    id: string;
    clefType: ClefTypeEnum;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type KeySignature = {
    id: string;
    type: KeySignatureTypeEnum;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type TimeSignature = {
    id: string;
    type: TimeSignatureTypeEnum;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type Accidental = {
    id: string;
    type: AccidentalTypeEnum;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type VoiceBeatSymbol = {
    chronaxie: Chronaxie;
    notesInfo: NotesInfo[];
    augmentationDot?: AugmentationDot;
    affiliatedSymbols: SingleAffiliatedSymbol[];
    beamType: BeamTypeEnum;
};
export type NoteSymbol = ({
    id: string;
    type: NoteSymbolTypeEnum.Note;
    direction: 'up' | 'down';
    voicePart: VoiceBeatSymbol;
    voicePart2?: VoiceBeatSymbol;
    clef?: Clef;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame) | ({
    id: string;
    type: NoteSymbolTypeEnum.Rest;
    chronaxie: Chronaxie;
    augmentationDot?: AugmentationDot;
    affiliatedSymbols: SingleAffiliatedSymbol[];
    clef?: Clef;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame);
export type NotesInfo = {
    id: string;
    region: number;
    accidental?: Accidental;
} & Frame;
export type NotesNumberInfo = {
    id: string;
    /** 0=休止符, 1-7=do re mi fa sol la si, 'X'=节奏音符（无音高，仅节奏） */
    syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X';
    accidental?: Accidental;
    /** 正数=音符上方的八度点（高八度），负数=下方的八度点（低八度），0=无 */
    octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;
};
export type VoiceBeatNumber = {
    chronaxie: Chronaxie;
    notesInfo: NotesNumberInfo[];
    augmentationDot?: AugmentationDot;
    affiliatedSymbols: SingleAffiliatedSymbol[];
    beamType: BeamTypeEnum;
};
export type NoteNumber = {
    id: string;
    voicePart: VoiceBeatNumber;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
