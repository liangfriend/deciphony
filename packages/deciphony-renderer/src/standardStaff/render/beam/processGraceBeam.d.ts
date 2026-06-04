/**
 * 倚音符杠处理。
 *
 * 与普通符杠（processBeam）逻辑对齐，差异：
 * - 数据源是 NoteSymbol 上的 graceNotes / graceNotesAfter，而非小节内主音符；
 * - 前置倚音数组 index0 靠主音，需先 reverse 成视觉左→右再组杠；
 * - 符干/符杠尺寸按 GRACE_NOTE_SCALE（50%）缩放；
 * - 符杠接点 x 用 graceStemBeamAttachX（组内缘），绘制段界仍用符干中心 + overlap 嵌入。
 */
import type { StandardStaffSkinPack } from "@/types/common";
import { VDom } from "@/types/common";
import type { StaffSlot } from "@/types/MusicScoreType";
import type { NodeIdMap } from "../types";
export declare function processGraceBeam(params: {
    measure: {
        notes: StaffSlot[];
    };
    nodeIdMap: NodeIdMap;
    vDoms: VDom[];
    /** 本小节符号 VDom 在 vDoms 中的起始下标（push 符号前记录） */
    symbolVDomsStartIdx: number;
    symbolVDomsLength: number;
    skin: StandardStaffSkinPack;
    measureHeight: number;
    measureLineWidth: number;
    skinName?: string;
}): void;
