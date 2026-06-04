/**

 * 五线谱倚音：NoteSymbol 级（graceNotes 为 NotesInfo[]）；VDom.scale 由 group.vue 缩放至 50%

 */
import { VDom } from "@/types/common";
import type { StandardStaffSkinPack } from "@/types/common";
import type { NoteSymbol, NotesInfo } from "@/types/MusicScoreType";
import type { NodeIdMap } from "../types";
/** 估算单条倚音 NotesInfo 占位宽度（视觉缩放后） */
export declare function estimateGraceNotesInfoWidth(ni: NotesInfo, skin: StandardStaffSkinPack, measureHeight: number): number;
export declare function graceBeforeWidth(graceNotes: NotesInfo[] | undefined, skin: StandardStaffSkinPack, measureHeight: number): number;
export declare function graceAfterWidth(graceNotesAfter: NotesInfo[] | undefined, skin: StandardStaffSkinPack, measureHeight: number): number;
export type RenderGraceStaffParams = {
    ni: NotesInfo;
    headAnchorX: number;
    noteCenterY: (region: number) => number;
    measureY: number;
    measureHeight: number;
    measureLineWidth: number;
    measureWidth: number;
    skin: StandardStaffSkinPack;
    skinName: string;
    zIndex: number;
    note: NoteSymbol;
    idMap: NodeIdMap;
    out: VDom[];
};
export declare function renderGraceNotesInfo(params: RenderGraceStaffParams): void;
export declare function renderGraceNotesBefore(graceNotes: NotesInfo[] | undefined, mainHeadX: number, ctx: Omit<RenderGraceStaffParams, 'ni' | 'headAnchorX'>): void;
export declare function renderGraceNotesAfter(graceNotesAfter: NotesInfo[] | undefined, mainHeadX: number, mainHeadW: number, ctx: Omit<RenderGraceStaffParams, 'ni' | 'headAnchorX'>): void;
