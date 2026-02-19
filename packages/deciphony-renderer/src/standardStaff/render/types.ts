/**
 * 渲染相关类型定义
 */

import type {VDom, VDomTagType} from "@/types/common";
import type {Measure, MusicScore} from "@/types/MusicScoreType";

/** id -> 以 vDom.tag 为键的 VDom 对象，便于按 tag 查找同一 id 下的音符头/符干/符尾等 */
export type NodeIdMap = Map<string, Partial<Record<VDomTagType, VDom>>>;

export type RenderSymbolParams = {
  measure: Measure;
  measures: Measure[];
  measureIndex: number;
  measureX: number;
  measureY: number;
  measureWidth: number;
  measureHeight: number;
  measureLineWidth: number;
  skin: import("@/types/common").StandardStaffSkinPack;
  idMap: NodeIdMap;
};

export type RenderDoubleAffiliatedSymbolParams = {
  musicScore: MusicScore;
  VDoms: VDom[];
  idMap: NodeIdMap;
};
