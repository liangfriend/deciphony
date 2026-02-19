import {VDom} from "@/types/common";
import {DoubleAffiliatedSymbolNameEnum} from "@/enums/musicScoreEnum";
import type {RenderDoubleAffiliatedSymbolParams} from "../types";

/**
 * 附属型符号渲染：连音线(slur)、反复房子(volta) 等
 */
export function renderDoubleAffiliatedSymbol(params: RenderDoubleAffiliatedSymbolParams): void {
  const {musicScore, idMap, VDoms} = params;
  const symbols = musicScore.affiliatedSymbols ?? [];
  for (let i = 0; i < symbols.length; i++) {
    const affiliatedSymbol = symbols[i];
    if (affiliatedSymbol.name === DoubleAffiliatedSymbolNameEnum.slur) {
      const startNote = idMap.get(affiliatedSymbol.startId)?.noteHead;
      const endNote = idMap.get(affiliatedSymbol.endId)?.noteHead;
      if (!startNote || !endNote) continue;
      const slurData = affiliatedSymbol.data?.slur;
      const relStart = slurData?.relativeStartPoint ?? {x: 0, y: 0};
      const relEnd = slurData?.relativeEndPoint ?? {x: 0, y: 0};
      const startPoint = {
        x: startNote.x + startNote.w / 2 + relStart.x,
        y: startNote.y + startNote.h / 2 + relStart.y,
      };
      const endPoint = {
        x: endNote.x + endNote.w / 2 + relEnd.x,
        y: endNote.y + endNote.h / 2 + relEnd.y,
      };
      const defaultSlur = {
        relativeStartPoint: {x: 0, y: 0},
        relativeEndPoint: {x: 0, y: 0},
        relativeControlPoint: {x: 0, y: 0},
        thickness: 2,
      };
      const slurVDom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint,
        endPoint,
        targetId: affiliatedSymbol.id,
        zIndex: 1001,
        tag: 'affiliation',
        skinName: 'default',
        dataComment: '连音线',
        special: {
          slur: slurData ? JSON.parse(JSON.stringify(slurData)) : defaultSlur,
        },
      };
      VDoms.push(slurVDom);
    }
    if (affiliatedSymbol.name === DoubleAffiliatedSymbolNameEnum.volta) {
      const measureVDom = idMap.get(affiliatedSymbol.startId)?.measure;
      if (!measureVDom) continue;
      const measureH = measureVDom.h;
      const voltaW = measureVDom.w + (affiliatedSymbol.relativeW ?? 0);
      const voltaH = measureH / 2 + (affiliatedSymbol.relativeH ?? 0);
      const voltaX = measureVDom.x + (affiliatedSymbol.relativeX ?? 0);
      const voltaY = measureVDom.y - voltaH;
      const voltaVDom: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {volta: affiliatedSymbol.data?.volta ?? {}},
        x: voltaX,
        y: voltaY,
        w: voltaW,
        h: voltaH,
        zIndex: 1001,
        tag: 'affiliation',
        skinName: 'default',
        targetId: affiliatedSymbol.id,
        dataComment: '反复房子',
      };
      VDoms.push(voltaVDom);
    }
  }
}
