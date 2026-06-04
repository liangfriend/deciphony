/**
 * 普通音符符杠处理。
 *
 * 整体流程：
 * 1. 按符干方向（up / down）分别扫描小节，把相邻可连杠的音符分成若干组；
 * 2. 每组：收集符干接点 → 算斜率 → 规划每根符杠线的绘制方式 → 拉长符干至符杠 → 生成符杠 VDom；
 * 3. 被连杠的音符移除符尾（符尾由符杠替代）。
 *
 * 符杠 VDom 以 noteBeam 标签输出，实际绘制由 beam.vue 根据 special.beam 渲染。
 */
import type { StandardStaffSkinPack } from "@/types/common";
import { VDom } from "@/types/common";
import type { StaffSlot } from "@/types/MusicScoreType";
import type { NodeIdMap } from "../types";
export declare function processBeam(params: {
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
