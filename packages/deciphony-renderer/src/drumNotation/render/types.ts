/**
 * 渲染相关类型定义
 */

import type {DrumNotationSkinPack, VDom, VDomTagType} from "@/types/common";
import type {Measure} from "@/types/MusicScoreType";
import type {MeasureColumnLayout} from "@/render/layout/measureColumnLayout";

/** id -> 以 vDom.tag 为键的 VDom 对象，便于按 tag 查找同一 id 下的音符头/符干/符尾等 */
export type NodeIdMap = Map<string, Partial<Record<VDomTagType, VDom>>>;

export type DrumVoice = 'up' | 'down';

/** 鼓谱小节列布局：上下声部共用 onset 列几何，slotGeometries 各自对齐本声部槽位 */
export type DrumMeasureColumnLayout = Record<DrumVoice, MeasureColumnLayout>;

export type LongRestKind = 'complete' | 'head' | 'content' | 'tail';

/** 长休止符小节在所属连续组中的角色；startIndex / endIndex 为组首尾小节下标（同一单谱表内） */
export type LongRestRole = {
  kind: LongRestKind;
  startIndex: number;
  endIndex: number;
};

export type RenderSymbolParams = {
  measure: Measure;
  measures: Measure[];
  measureIndex: number;
  measureX: number;
  measureY: number;
  measureWidth: number;
  measureHeight: number;
  measureLineWidth: number;
  skin: DrumNotationSkinPack;
  idMap: NodeIdMap;
  skinName?: string;
  /** 连谱预计算的列布局；缺省时 renderSymbol 内按本小节上下声部构建 */
  columnLayout?: DrumMeasureColumnLayout | null;
  /** 非 null 时小节处于长休止符状态：不渲染音符，前后置符号按角色取舍 */
  longRest?: LongRestRole | null;
};
