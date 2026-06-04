import type { Measure, NoteRest, NoteSymbol, NotesInfo, StaffSlot } from "@/types/MusicScoreType";
import type { StandardStaffSkinPack } from "@/types/common";
import { BeamTypeEnum } from "@/enums/musicScoreEnum";
import type { Chronaxie } from "@/types/common";
export type VoiceGroup = {
    direction: 'up' | 'down';
    notesInfo: NotesInfo[];
    chronaxie: Chronaxie;
    beamType: BeamTypeEnum;
};
/** 按符干方向分组：同方向多条 notesInfo 视为和弦 */
export declare function getVoiceGroups(note: NoteSymbol): VoiceGroup[];
export declare function getVoiceGroupForDirection(note: NoteSymbol, direction: 'up' | 'down'): VoiceGroup | undefined;
export declare function getRestChronaxie(rest: NoteRest): Chronaxie;
/** 音符 / 休止符位的时值（用于宽度与皮肤） */
export declare function getSlotChronaxie(slot: StaffSlot): number;
export declare function isSlotRest(slot: StaffSlot): slot is NoteRest;
export declare function getSlotRestChronaxie(slot: StaffSlot): number;
/** widthRatio/widthRatioForMeasure 以四分音符(64)为 1；时值换算系数 */
export declare function getChronaxieWidthCoefficient(chronaxie: number): number;
/** 音符 / 休止符在小节内的宽度占比 */
export declare function getNoteWidthRatio(slot: StaffSlot, skin: StandardStaffSkinPack, measureHeight?: number): number;
/** 音符 / 休止符对小节在单谱表内宽度占比的系数 */
export declare function getNoteWidthRatioForMeasure(slot: StaffSlot, skin: StandardStaffSkinPack, measureHeight?: number): number;
/** 小节的宽度系数（五线谱：仅统计 StaffSlot） */
export declare function getMeasureWidthRatio(measure: Measure, skin: StandardStaffSkinPack): number;
