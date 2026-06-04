import { AccidentalTypeEnum, BarlineTypeEnum, BracketTypeEnum, ClefTypeEnum, KeySignatureTypeEnum, TimeSignatureTypeEnum } from "@/enums/musicScoreEnum";
import { NumberNotationSkinKeyEnum } from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import type { AugmentationDot } from "@/types/MusicScoreType";
export declare function getBarlineSkinKey(barlineType: BarlineTypeEnum): NumberNotationSkinKeyEnum;
/** 连谱小节线皮肤 key（BarlineTypeEnum → linked_*） */
export declare function getLinkedBarlineSkinKey(barlineType: BarlineTypeEnum): NumberNotationSkinKeyEnum;
/** 谱号类型 + 是否前置 简谱没有谱号*/
/** 小节生效谱号：可传 noteIndex 表示该音符位前生效的谱号 */
export declare function getClefForMeasure(measures: import("@/types/MusicScoreType").Measure[], measureIndex: number, noteIndex?: number): ClefTypeEnum;
export declare function getKeySignatureSkinKey(type: KeySignatureTypeEnum): NumberNotationSkinKeyEnum;
export declare function getTimeSignatureSkinKey(type?: TimeSignatureTypeEnum): NumberNotationSkinKeyEnum;
export declare function chronaxieToBeamLineCount(chronaxie: number): number;
export declare function getAccidentalSkinKey(type: AccidentalTypeEnum): NumberNotationSkinKeyEnum;
/** 连谱号类型 → 皮肤 key */
export declare function getBracketSkinKey(type: BracketTypeEnum): NumberNotationSkinKeyEnum;
export declare function getAugmentationDotSkinKey(augmentationDot: AugmentationDot): NumberNotationSkinKeyEnum;
/** 简谱 syllable → 数字皮肤 key。0=休止符(Number_0)，1-7=音高，'X'=节奏音符(Number_X) */
export declare function getSyllableSkinKey(syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X'): NumberNotationSkinKeyEnum;
/** 时值 chronaxie → 简谱减时线皮肤 key（32→1条线，16→2条…） */
export declare function getReduceLineSkinKey(chronaxie: number): NumberNotationSkinKeyEnum;
