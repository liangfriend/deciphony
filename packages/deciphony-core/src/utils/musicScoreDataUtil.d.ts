import { AccidentalEnum, ChronaxieEnum, ClefEnum, KeySignatureEnum } from "../musicScoreEnum";
import { BeamGroup, IndexData, Measure, MsSymbol, MsSymbolContainer, MsType, MultipleStaves, MusicScore, MusicScoreIndex, NoteHead, NoteName, NoteNumber, NoteString, SingleStaff, SpanSymbol, StaffRegion } from "../types";
export declare function noteNameToNoteString(noteName: NoteName): NoteString;
export declare function noteNameToHelmholtz(noteName: NoteName): string;
export declare function hasNoteTail(chronaxie: ChronaxieEnum): boolean;
export declare function hasNoteStem(chronaxie: ChronaxieEnum): boolean;
export declare function getMsSymbolAccidental(noteHead: NoteHead | NoteNumber, musicScore: MusicScore): {
    accidental: AccidentalEnum;
    measureAccidental: AccidentalEnum;
};
export declare function getMsSymbolKeySignature(msSymbol: MsSymbol, musicScore: MusicScore): KeySignatureEnum;
export declare function getMsSymbolClef(msSymbol: MsSymbol, musicScore: MusicScore): ClefEnum;
export type TraverseLevel = 'multipleStaves' | 'singleStaff' | 'measure' | 'container' | 'symbol';
export type TraverseOrder = 'asc' | 'desc';
export interface TraverseContext {
    multipleStavesIndex: number;
    singleStaffIndex: number;
    measureIndex: number;
    msSymbolContainerIndex?: number;
    msSymbolIndex?: number;
    multipleStaves?: MultipleStaves;
    singleStaff?: SingleStaff;
    measure?: Measure;
    msSymbolContainer?: MsSymbolContainer;
    msSymbol?: MsSymbol;
}
export type TraverseCallback = (context: TraverseContext) => boolean | void;
export declare function traverseMusicScore(musicScore: MusicScore, { level, order, callback }: {
    level: TraverseLevel;
    order?: TraverseOrder;
    callback: TraverseCallback;
}): void;
export declare function traverseMeasure(startIndex: MusicScoreIndex, endIndex: MusicScoreIndex, musicScore: MusicScore, callBack: (measure: Measure, singleStaff: SingleStaff, multipleStaves: MultipleStaves) => void): void;
export declare function setMultipleStavesIndex(musicScore: MusicScore): void;
export declare function setSingleStaffArrayIndex(multipleStaves: MultipleStaves): void;
export declare function setMeasureArrayIndex(singleStaff: SingleStaff): void;
export declare function setMsSymbolContainerArrayIndex(measure: Measure): void;
export declare function setMsSymbolArrayIndex(container: MsSymbolContainer): void;
export declare function setChildMsSymbolArrayIndex(msSymbol: MsSymbol, musicScore?: MusicScore): void;
export declare function mapGenerate(musicScore: MusicScore): void;
/**
 * 将五线谱位置 (StaffRegion) 映射到整数坐标
 */
export declare function staffRegionToIndex(pos: StaffRegion): number;
/**
 * 将整数坐标转换回五线谱位置 (StaffRegion)
 */
export declare function indexToStaffRegion(index: number): StaffRegion;
export declare function judgeDirection(region: number | StaffRegion): 'up' | 'down';
export declare function getTarget(id: number, msDataMap: Record<number, MsType>): MsType | undefined;
export declare function getDataWithIndex(index: MusicScoreIndex, musicScore: MusicScore): IndexData;
export declare function getMeasureRelatedSpanSymbolList(measure: Measure, musicScore: MusicScore): Set<number>;
export declare function getSingleStaffRelatedSpanSymbolList(singleStaff: SingleStaff, musicScore: MusicScore): Set<number>;
export declare function getMultipleStavesRelatedSpanSymbolList(multipleStaves: MultipleStaves, musicScore: MusicScore): Set<number>;
export declare function getMusicScoreRelatedSpanSymbolList(musicScore: MusicScore): Set<number>;
export declare function updateSpanSymbolView(spanSymbolIdList: Set<number>, musicScore: MusicScore): void;
export declare function getMainMsSymbol(msSymbol: MsSymbol, musicScore: MusicScore): MsSymbol;
export declare function getBeamGroup(beamId: number, measure: Measure): BeamGroup;
export declare function getNext(target: Exclude<MsType, SpanSymbol>, musicScore: MusicScore, nextCount?: number): Exclude<MsType, SpanSymbol>;
export declare function msSymbolPropertiesInherit(newMsSymbol: MsSymbol, oldMsSymbol: MsSymbol): void;
export declare function forEachMsSymbolContainer(startMsSymbolContainer: MsSymbolContainer, endMsSymbolContainer: MsSymbolContainer, musicScore: MusicScore, callback: (container: MsSymbolContainer) => void): void;
