import { AccidentalEnum, BarLineTypeEnum, ChronaxieEnum, ClefEnum, KeySignatureEnum, MsSymbolContainerTypeEnum, MsSymbolTypeEnum, SolmizationEnum, SpanSymbolTypeEnum } from "../musicScoreEnum";
import { Measure, MsSymbol, MsSymbolContainer, MultipleStaves, MusicScore, SingleStaff, SpanSymbol, StaffRegion, TimeSignature } from "../types";
export declare function spanSymbolTemplate(options: {
    type?: SpanSymbolTypeEnum;
    startTargetId: number;
    endTargetId: number;
}): SpanSymbol | null;
export declare function msSymbolTemplate(options?: {
    type?: MsSymbolTypeEnum;
    region?: StaffRegion;
    chronaxie?: ChronaxieEnum;
    barLineType?: BarLineTypeEnum;
    clef?: ClefEnum;
    keySignature?: KeySignatureEnum;
    timeSignature?: TimeSignature;
    accidental?: AccidentalEnum;
    direction?: 'up' | 'down';
    octave?: number;
    solmization?: SolmizationEnum;
}): MsSymbol;
export declare function msSymbolContainerTemplate(options?: {
    type?: MsSymbolContainerTypeEnum;
}): MsSymbolContainer;
export declare function measureTemplate(options?: {
    barLineType?: BarLineTypeEnum;
}): Measure;
export declare function singleStaffTemplate(options?: {}): SingleStaff;
export declare function multipleStavesTemplate(options?: {}): MultipleStaves;
export declare function musicScoreTemplate(options?: {}): MusicScore;
