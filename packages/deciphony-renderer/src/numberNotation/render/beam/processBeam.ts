/**
 * 符杠处理：简谱无符干符尾，此处为空实现；若后续支持简谱符杠可扩展
 */

import type {NumberNotationSkinPack} from "@/types/common";
import {NoteNumber} from "@/types/MusicScoreType";
import type {NodeIdMap} from "../types";

export function processBeam(params: {
  measure: { notes: NoteNumber[] };
  nodeIdMap: NodeIdMap;
  vDoms: import("@/types/common").VDom[];
  symbolVDomsLength: number;
  skin: NumberNotationSkinPack;
  measureHeight: number;
  measureLineWidth: number;
}): void {
  // 简谱使用减时线表示时值，无符干符尾，无需符杠处理
  void params;
}
