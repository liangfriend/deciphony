import type { NumberNotationSkinPack, StandardStaffSkinPack, VDom } from '@/types/common';
import type { Measure } from '@/types/MusicScoreType';
import type { NodeIdMap } from '@/standardStaff/render/types';
/** 反复符号默认贴齐小节顶边上方（相对 measureHeight 的比例） */
export declare const REPEAT_MARK_ABOVE_RATIO: number;
export type RenderMeasureRepeatParams = {
    measure: Measure;
    measureX: number;
    measureY: number;
    measureWidth: number;
    measureHeight: number;
    skin: StandardStaffSkinPack | NumberNotationSkinPack;
    idMap: NodeIdMap;
    skinName?: string;
};
export declare function renderMeasureRepeat(params: RenderMeasureRepeatParams): VDom[];
