/**
 * 小节符号渲染：前置谱号→前置调号→前置拍号→音符→后置谱号→小节线→后置调号→后置拍号
 */
import { VDom } from "@/types/common";
import type { RenderSymbolParams } from "../types";
export declare function renderSymbol(params: RenderSymbolParams): VDom[];
/** 计算前置小节线在小节内的左边缘 x（clef_f + keySig_f + timeSig_f 之后，供连谱小节线 barline_f 定位） */
export declare function getBarlineFXInMeasure(measure: import("@/types/MusicScoreType").Measure, measureX: number, skin: import("@/types/common").StandardStaffSkinPack): number;
/** 计算后置小节线在小节内的左边缘 x（与 renderSymbol 中 rightParts 摆放一致，供连谱小节线 barline_b 定位） */
export declare function getBarlineXInMeasure(measure: import("@/types/MusicScoreType").Measure, measureX: number, measureWidth: number, skin: import("@/types/common").StandardStaffSkinPack): number;
