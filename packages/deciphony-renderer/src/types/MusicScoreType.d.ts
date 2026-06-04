import { AccidentalTypeEnum, BarlineTypeEnum, BeamTypeEnum, BracketTypeEnum, ClefTypeEnum, DoubleMeasureAffiliatedSymbolNameEnum, DoubleNoteAffiliatedSymbolNameEnum, KeySignatureTypeEnum, MeasureEndRepeatEnum, MeasureStartRepeatEnum, MusicScoreTypeEnum, NoteSymbolTypeEnum, SingleMeasureAffiliatedSymbolNameEnum, SingleNoteAffiliatedSymbolNameEnum, TimeSignatureTypeEnum } from "@/enums/musicScoreEnum";
import { Chronaxie, Frame } from "@/types/common";
export type MusicScore = {
    id: string;
    type: MusicScoreTypeEnum;
    grandStaffs: GrandStaff[];
    affiliatedSymbols: (DoubleNoteAffiliatedSymbol | DoubleMeasureAffiliatedSymbol)[];
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
    bracket?: Bracket;
} & Frame;
export type Bracket = {
    id: string;
    type: BracketTypeEnum;
    startSingleStaffIndex: number;
} & Frame;
export type SingleStaff = {
    id: string;
    measures: Measure[];
    uSpaceO: number;
    uSpaceI: number;
    dSpaceI: number;
    dSpaceO: number;
} & Frame;
/** 五线谱小节内的音符位 / 休止符位（简谱为 NoteNumber） */
export type StaffSlot = NoteSymbol | NoteRest;
export type Measure = {
    id: string;
    notes: (StaffSlot | NoteNumber)[];
    barline_f?: Barline;
    barline_b?: Barline;
    clef_f?: Clef;
    clef_b?: Clef;
    keySignature_f?: KeySignature;
    keySignature_b?: KeySignature;
    timeSignature_f?: TimeSignature;
    timeSignature_b?: TimeSignature;
    /** 小节前反复符号（Coda / Segno，最多一个） */
    startRepeat?: MeasureStartRepeat;
    /** 小节末反复符号（DC / DS / Fine 等，最多一个） */
    endRepeat?: MeasureEndRepeat;
    widthRatioForMeasure?: number;
    affiliatedSymbols: (SingleMeasureAffiliatedSymbol)[];
} & Frame;
export type AugmentationDot = {
    id: string;
    count: 1 | 2 | 3;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type DoubleNoteAffiliatedSymbol = {
    id: string;
    name: DoubleNoteAffiliatedSymbolNameEnum;
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
    };
} & Frame;
export type DoubleMeasureAffiliatedSymbol = {
    id: string;
    name: DoubleMeasureAffiliatedSymbolNameEnum;
    startId: string;
    endId: string;
    data: {
        volta?: {
            text: string;
            value: number[];
            /** 盒子高度（× measureHeight），默认 0.5 */
            heightRatio?: number;
        };
    };
} & Frame;
export type SingleNoteAffiliatedSymbol = {
    id: string;
    name: SingleNoteAffiliatedSymbolNameEnum;
    data: Record<string, never>;
} & Frame;
export type SingleMeasureAffiliatedSymbol = {
    id: string;
    name: SingleMeasureAffiliatedSymbolNameEnum;
    data: Record<string, never>;
} & Frame;
/** 小节前反复符号 */
export type MeasureStartRepeat = {
    id: string;
    type: MeasureStartRepeatEnum;
} & Frame;
/** 小节末反复符号 */
export type MeasureEndRepeat = {
    id: string;
    type: MeasureEndRepeatEnum;
} & Frame;
export type Barline = {
    id: string;
    type: BarlineTypeEnum;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type Clef = {
    id: string;
    type: ClefTypeEnum;
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
/** 五线谱音符位：时值 / 附点 / 附属在 NotesInfo 上 */
export type NoteSymbol = {
    id: string;
    type: NoteSymbolTypeEnum.Note;
    notesInfo: NotesInfo[];
    graceNotes?: NotesInfo[];
    graceNotesAfter?: NotesInfo[];
    clef?: Clef;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
/** 五线谱休止符位 */
export type NoteRest = {
    id: string;
    type: NoteSymbolTypeEnum.Rest;
    chronaxie: Chronaxie;
    augmentationDot?: AugmentationDot;
    affiliatedSymbols?: SingleNoteAffiliatedSymbol[];
    clef?: Clef;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
export type NotesInfo = {
    id: string;
    direction: 'up' | 'down';
    region: number;
    chronaxie: Chronaxie;
    beamType: BeamTypeEnum;
    augmentationDot?: AugmentationDot;
    affiliatedSymbols: SingleNoteAffiliatedSymbol[];
    accidental?: Accidental;
} & Frame;
export type NotesNumberInfo = {
    id: string;
    /** 0=休止符, 1-7=do re mi fa sol la si, 'X'=节奏音符（无音高，仅节奏） */
    syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X';
    accidental?: Accidental;
    /** 正数=音符上方的八度点（高八度），负数=下方的八度点（低八度），0=无 */
    octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;
    graceNotes?: NotesNumberInfo[];
    graceNotesAfter?: NotesNumberInfo[];
};
export type NoteNumber = {
    id: string;
    chronaxie: Chronaxie;
    notesInfo: NotesNumberInfo[];
    augmentationDot?: AugmentationDot;
    affiliatedSymbols: SingleNoteAffiliatedSymbol[];
    beamType: BeamTypeEnum;
    widthRatio?: number;
    widthRatioForMeasure?: number;
} & Frame;
