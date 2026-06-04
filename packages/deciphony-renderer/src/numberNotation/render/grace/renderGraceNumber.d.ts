/**
 * 简谱倚音：NotesNumberInfo 级（graceNotes 挂在主音 notesInfo 上）；时值/符杠取自父 NoteNumber
 */
import { VDom } from "@/types/common";
import type { NumberNotationSkinPack } from "@/types/common";
import type { NoteNumber, NotesNumberInfo } from "@/types/MusicScoreType";
import type { NodeIdMap } from "../types";
/** 单条倚音 NotesNumberInfo 占位宽度（视觉缩放后） */
export declare function estimateGraceNotesNumberInfoWidth(ni: NotesNumberInfo, parent: NoteNumber, skin: NumberNotationSkinPack, measureHeight: number): number;
export declare function graceNoteNumberBeforeWidth(graceNotes: NotesNumberInfo[] | undefined, parent: NoteNumber, skin: NumberNotationSkinPack, measureHeight: number): number;
export declare function graceNoteNumberAfterWidth(graceNotesAfter: NotesNumberInfo[] | undefined, parent: NoteNumber, skin: NumberNotationSkinPack, measureHeight: number): number;
export type RenderGraceNumberCtx = {
    measureY: number;
    measureHeight: number;
    skin: NumberNotationSkinPack;
    skinName: string;
    zIndex: number;
    idMap: NodeIdMap;
    out: VDom[];
};
/** 在 headX 渲染一条倚音（不含减时线；减时线由 processGraceReduceLines 第二遍连接） */
export declare function renderGraceNotesNumberInfoAt(ni: NotesNumberInfo, parent: NoteNumber, headX: number, ctx: RenderGraceNumberCtx): void;
/** 前置倚音：index0 靠主音，整体向左扩散 */
export declare function renderGraceNotesNumberBefore(graceNotes: NotesNumberInfo[] | undefined, parent: NoteNumber, mainHeadX: number, ctx: RenderGraceNumberCtx): void;
/** 后置倚音：向右扩散 */
export declare function renderGraceNotesNumberAfter(graceNotesAfter: NotesNumberInfo[] | undefined, parent: NoteNumber, mainHeadX: number, mainRefW: number, ctx: RenderGraceNumberCtx): void;
