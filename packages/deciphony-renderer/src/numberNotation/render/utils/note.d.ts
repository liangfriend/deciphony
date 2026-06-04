import type { Measure, NoteNumber } from "@/types/MusicScoreType";
import type { NumberNotationSkinPack } from "@/types/common";
/** 简谱音符位时值 */
export declare function getSlotChronaxie(note: NoteNumber): number;
/** 是否为休止符位：syllable===0 */
export declare function isSlotRest(note: NoteNumber): boolean;
/** 休止符位时值 */
export declare function getSlotRestChronaxie(note: NoteNumber): number;
/** widthRatio/widthRatioForMeasure 以四分音符(64)为 1；时值换算系数 */
export declare function getChronaxieWidthCoefficient(chronaxie: number): number;
/** 音符在小节内的宽度占比 */
export declare function getNoteWidthRatio(note: NoteNumber, skin: NumberNotationSkinPack, measureHeight?: number): number;
/** 音符对小节在单谱表内宽度占比的系数 */
export declare function getNoteWidthRatioForMeasure(note: NoteNumber, skin: NumberNotationSkinPack, measureHeight?: number): number;
/** 小节的宽度系数 */
export declare function getMeasureWidthRatio(measure: Measure, skin: NumberNotationSkinPack): number;
