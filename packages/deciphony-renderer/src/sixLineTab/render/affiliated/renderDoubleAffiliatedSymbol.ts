import type {RenderDoubleAffiliatedSymbolParams} from '../types';
import {renderMusicScoreAffiliatedSymbols} from '@/render/affiliated';

/** @deprecated 使用 render/affiliated 规则引擎 */
export function renderDoubleAffiliatedSymbol(params: RenderDoubleAffiliatedSymbolParams): void {
    const {musicScore, idMap, VDoms, skinName} = params;
    renderMusicScoreAffiliatedSymbols(musicScore, {
        VDoms,
        idMap,
        skinName,
    });
}
