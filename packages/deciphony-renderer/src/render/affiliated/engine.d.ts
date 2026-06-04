import type { VDom } from '@/types/common';
import type { Measure, MusicScore, SingleNoteAffiliatedSymbol } from '@/types/MusicScoreType';
import type { NodeIdMap } from '@/standardStaff/render/types';
export type RenderAffiliatedContext = {
    VDoms: VDom[];
    idMap: NodeIdMap;
    skinName?: string;
    /** 当前谱面的皮肤包（五线谱或简谱其一） */
    skin?: Record<string, {
        w: number;
        h: number;
    }>;
    measureHeight?: number;
};
/** musicScore.affiliatedSymbols：双音符 / 双小节 */
export declare function renderMusicScoreAffiliatedSymbols(musicScore: MusicScore, ctx: RenderAffiliatedContext): void;
/** 单音符附属：在音符头渲染完成后调用 */
export declare function renderSingleNoteAffiliatedSymbols(symbols: SingleNoteAffiliatedSymbol[] | undefined, noteHead: VDom, ctx: RenderAffiliatedContext): void;
/** 单小节附属：measure.affiliatedSymbols */
export declare function renderSingleMeasureAffiliatedSymbols(measure: Measure, measureX: number, measureY: number, measureWidth: number, measureHeight: number, ctx: RenderAffiliatedContext): void;
