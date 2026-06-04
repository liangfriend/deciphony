import type { StandardStaffSkinPack } from "@/types/common";
import { VDom } from "@/types/common";
import { NoteSymbol } from "@/types/MusicScoreType";
import type { NodeIdMap } from "../types";
export type RenderStemAndTailParams = {
    note: NoteSymbol;
    headX: number;
    headY: number;
    headW: number;
    headH: number;
    measureY: number;
    measureHeight: number;
    measureWidth: number;
    skin: StandardStaffSkinPack;
    zIndex: number;
    idMap: NodeIdMap;
    chronaxie?: number;
    direction?: 'up' | 'down';
    stemTargetId?: string;
    headCenterYOther?: number;
    skinName?: string;
    /** 倚音：符干在布局阶段调整 y/h；符尾用 VDom.scale 并做中心缩放 x/y 补偿 */
    isGrace?: boolean;
};
/**
 * 符干与符尾：chronaxie < 256 出符干，≤32 出符尾
 */
export declare function renderStemAndTail(params: RenderStemAndTailParams): VDom[];
/** 倚音符干（布局 y/h）+ 符尾（VDom.scale + 中心缩放 x/y 补偿） */
export declare function renderGraceStemAndTail(params: Omit<RenderStemAndTailParams, 'isGrace'>): VDom[];
