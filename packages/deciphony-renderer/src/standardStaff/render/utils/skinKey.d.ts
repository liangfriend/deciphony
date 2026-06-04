import { BarlineTypeEnum, BracketTypeEnum, ClefTypeEnum, KeySignatureTypeEnum, TimeSignatureTypeEnum } from "@/enums/musicScoreEnum";
import { StandardStaffSkinKeyEnum } from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type { AugmentationDot } from "@/types/MusicScoreType";
import { AccidentalTypeEnum } from "@/enums/musicScoreEnum";
export declare function getBarlineSkinKey(barlineType: BarlineTypeEnum): StandardStaffSkinKeyEnum;
/** 连谱小节线皮肤 key（BarlineTypeEnum → linked_*） */
export declare function getLinkedBarlineSkinKey(barlineType: BarlineTypeEnum): StandardStaffSkinKeyEnum;
/** 谱号类型 + 是否前置 */
export declare function getClefSkinKey(clefType: ClefTypeEnum, isFront: boolean): StandardStaffSkinKeyEnum;
/** 小节生效谱号：可传 noteIndex 表示该音符位前生效的谱号 */
export declare function getClefForMeasure(measures: import("@/types/MusicScoreType").Measure[], measureIndex: number, noteIndex?: number): ClefTypeEnum;
/** 调号 y 偏移：皮肤按 treble 布局，中音/次中音 +5.5，低音 +11 */
export declare function getKeySignatureYOffset(clefType: ClefTypeEnum, measureHeight: number, measureLineWidth: number): number;
export declare function getKeySignatureSkinKey(type: KeySignatureTypeEnum): StandardStaffSkinKeyEnum;
export declare function getTimeSignatureSkinKey(type?: TimeSignatureTypeEnum): StandardStaffSkinKeyEnum;
/** 时值 chronaxie → 音符头皮肤 */
export declare function getNoteHeadSkinKey(chronaxie: number): StandardStaffSkinKeyEnum;
/** 时值 chronaxie → 休止符皮肤 */
export declare function getRestSkinKey(chronaxie: number): StandardStaffSkinKeyEnum;
/** 时值 chronaxie ≤32 → 符尾皮肤；direction 为 down 时用符尾倒（_r） */
export declare function getNoteTailSkinKey(chronaxie: number, direction?: 'up' | 'down'): StandardStaffSkinKeyEnum;
export declare function chronaxieToBeamLineCount(chronaxie: number): number;
export declare function getAccidentalSkinKey(type: AccidentalTypeEnum): StandardStaffSkinKeyEnum;
/** 连谱号类型 → 皮肤 key */
export declare function getBracketSkinKey(type: BracketTypeEnum): StandardStaffSkinKeyEnum;
export declare function getAugmentationDotSkinKey(augmentationDot: AugmentationDot): StandardStaffSkinKeyEnum;
