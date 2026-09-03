/**
 * 小节内音符横坐标：按 chronaxie onset 分列，列宽由 DEFAULT + getNoteWidthRatio 比例分配。
 * 线谱 / 简谱共用；见 doc/规范文档/小节内音符横坐标布局.md
 */

import type {Measure} from '@/types/MusicScoreType';

/** 每 onset 格基础 widthRatio（与音符 ratio 相加） */
export const DEFAULT_CELL_BASE_WIDTH_RATIO = 10;

function paddingPx(ratio: number, measureHeight: number): number {
  if (!Number.isFinite(measureHeight) || measureHeight <= 0) return 0;
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return ratio * measureHeight;
}

/**
 * 变宽左内边距（相对 measureHeight）。
 * 前置定宽符号到第一列变宽符号之间的距离；计入变宽区内，从音符列可分配宽度中扣除。
 */
export const NOTE_DOMAIN_LEFT_PADDING_RATIO = 0.2;

/**
 * 变宽右内边距（相对 measureHeight）。
 * 最后一列变宽符号到后置定宽符号之间的距离；计入变宽区内。
 * 暂无视觉需求，默认 0；布局仍扣除，便于以后改常量即可生效。
 */
export const NOTE_DOMAIN_RIGHT_PADDING_RATIO = 0;

export function getNoteDomainLeftPadding(measureHeight: number): number {
  return paddingPx(NOTE_DOMAIN_LEFT_PADDING_RATIO, measureHeight);
}

export function getNoteDomainRightPadding(measureHeight: number): number {
  return paddingPx(NOTE_DOMAIN_RIGHT_PADDING_RATIO, measureHeight);
}

function withNoteDomainInnerPadding(
  noteDomainW: number,
  noteDomainStartOffset: number,
  measureHeight: number,
): { noteDomainW: number; noteDomainStartOffset: number } {
  const domainW = Math.max(0, noteDomainW);
  const leftPad = Math.min(getNoteDomainLeftPadding(measureHeight), domainW);
  const afterLeft = domainW - leftPad;
  const rightPad = Math.min(getNoteDomainRightPadding(measureHeight), afterLeft);
  return {
    noteDomainW: afterLeft - rightPad,
    noteDomainStartOffset: noteDomainStartOffset + leftPad,
  };
}

export type SlotColumnGeometry = {
  /** 相对音符列区起点的列起始 x（变宽区已扣除左右内边距） */
  startInDomain: number;
  /** 列宽 */
  width: number;
};

export type MeasureColumnLayout = {
  /** 音符列区起点相对 measureX 的偏移（prefixW/maxPrefixW + 左内边距） */
  noteDomainStartOffset: number;
  /** 音符列可分配宽度（变宽区扣除左右内边距） */
  noteDomainW: number;
  /** 小节（连谱为同列 max）音符/休止符时值总和，用于 64 格插值 */
  totalChronaxie: number;
  /** 有音符起始的 onset → 列起点（相对音符列区） */
  onsetStartInDomain: ReadonlyMap<number, number>;
  /** 有音符起始的 onset → 列几何（相对音符列区） */
  onsetColumnGeometry: ReadonlyMap<number, SlotColumnGeometry>;
  /** 与 measure.notes 下标对齐；非布局 slot 为 null */
  slotGeometries: (SlotColumnGeometry | null)[];
};

export type ColumnLayoutSlotAdapter = {
  isLayoutSlot: (note: unknown) => boolean;
  getChronaxie: (note: unknown) => number;
  getNoteWidthRatio: (note: unknown) => number;
  /** 简谱：加时线虚拟 onset → widthRatio（不含 DEFAULT） */
  getExtraOnsetRatios?: (note: unknown, slotOnset: number) => Array<{ onset: number; ratio: number }>;
};

type OnsetSlotRef = {
  onset: number;
  slotIndex: number;
  note: unknown;
};

function collectOnsetSlots(measure: Measure, adapter: ColumnLayoutSlotAdapter): OnsetSlotRef[] {
  const refs: OnsetSlotRef[] = [];
  let acc = 0;
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    if (!adapter.isLayoutSlot(note)) continue;
    refs.push({onset: acc, slotIndex: i, note});
    acc += adapter.getChronaxie(note);
  }
  return refs;
}

function measureTotalChronaxie(measure: Measure, adapter: ColumnLayoutSlotAdapter): number {
  let acc = 0;
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    if (!adapter.isLayoutSlot(note)) continue;
    acc += adapter.getChronaxie(note);
  }
  return acc;
}

function pushOnsetRatio(
  ratioByOnset: Map<number, number[]>,
  onset: number,
  ratio: number,
): void {
  const list = ratioByOnset.get(onset);
  if (list) list.push(ratio);
  else ratioByOnset.set(onset, [ratio]);
}

function mergeOnsetRatios(
  measures: Measure[],
  adapter: ColumnLayoutSlotAdapter,
): Map<number, number[]> {
  const ratioByOnset = new Map<number, number[]>();
  for (const measure of measures) {
    if (!measure) continue;
    for (const ref of collectOnsetSlots(measure, adapter)) {
      const ratio = DEFAULT_CELL_BASE_WIDTH_RATIO + adapter.getNoteWidthRatio(ref.note);
      pushOnsetRatio(ratioByOnset, ref.onset, ratio);
      if (adapter.getExtraOnsetRatios) {
        for (const extra of adapter.getExtraOnsetRatios(ref.note, ref.onset)) {
          pushOnsetRatio(ratioByOnset, extra.onset, DEFAULT_CELL_BASE_WIDTH_RATIO + extra.ratio);
        }
      }
    }
  }
  return ratioByOnset;
}

function averageCellWidthRatio(ratios: number[]): number {
  if (ratios.length === 0) return DEFAULT_CELL_BASE_WIDTH_RATIO;
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

function buildColumnGeometryFromRatios(
  ratioByOnset: Map<number, number[]>,
  noteDomainW: number,
): Map<number, SlotColumnGeometry> {
  const onsets = [...ratioByOnset.keys()].sort((a, b) => a - b);
  const geometryByOnset = new Map<number, SlotColumnGeometry>();

  if (onsets.length === 0) return geometryByOnset;

  const cellWidthRatio = new Map<number, number>();
  let totalCellWidthRatio = 0;
  for (const g of onsets) {
    const avg = averageCellWidthRatio(ratioByOnset.get(g) ?? []);
    cellWidthRatio.set(g, avg);
    totalCellWidthRatio += avg;
  }

  if (totalCellWidthRatio <= 0) {
    const equalW = noteDomainW / onsets.length;
    let cum = 0;
    for (const g of onsets) {
      geometryByOnset.set(g, {startInDomain: cum, width: equalW});
      cum += equalW;
    }
    return geometryByOnset;
  }

  let cum = 0;
  for (const g of onsets) {
    const w = (cellWidthRatio.get(g)! / totalCellWidthRatio) * noteDomainW;
    geometryByOnset.set(g, {startInDomain: cum, width: w});
    cum += w;
  }
  return geometryByOnset;
}

function assignSlotGeometries(
  measure: Measure,
  adapter: ColumnLayoutSlotAdapter,
  geometryByOnset: Map<number, SlotColumnGeometry>,
): (SlotColumnGeometry | null)[] {
  const slotGeometries: (SlotColumnGeometry | null)[] = new Array(measure.notes.length).fill(null);
  for (const ref of collectOnsetSlots(measure, adapter)) {
    const geo = geometryByOnset.get(ref.onset);
    if (geo) slotGeometries[ref.slotIndex] = geo;
  }
  return slotGeometries;
}

function onsetStartsFromGeometry(
  geometryByOnset: Map<number, SlotColumnGeometry>,
): Map<number, number> {
  const map = new Map<number, number>();
  for (const [onset, geo] of geometryByOnset) {
    map.set(onset, geo.startInDomain);
  }
  return map;
}

/** 简谱增时线对齐用的 chronaxie 小格（四分音符） */
export const CHRONAXIE_GRID_UNIT = 64;

/** 某 slot 在小节内的 onset（前面 slot 时值累加） */
export function computeSlotOnset(
  measure: Measure,
  slotIndex: number,
  adapter: ColumnLayoutSlotAdapter,
): number {
  let acc = 0;
  for (let i = 0; i < measure.notes.length && i < slotIndex; i++) {
    const note = measure.notes[i];
    if (!adapter.isLayoutSlot(note)) continue;
    acc += adapter.getChronaxie(note);
  }
  return acc;
}

/**
 * 音符列区内 chronaxie 位置 → x（相对列区起点，已含左右内边距）。
 * 优先用 onset 列起点；否则按 totalChronaxie 比例插值（64 格边界）。
 */
export function resolveXInDomainAtChronaxie(
  layout: MeasureColumnLayout,
  chronaxie: number,
): number {
  const {totalChronaxie, noteDomainW, onsetStartInDomain} = layout;
  if (totalChronaxie <= 0 || noteDomainW <= 0) return 0;
  const t = Math.max(0, Math.min(chronaxie, totalChronaxie));
  const atOnset = onsetStartInDomain.get(t);
  if (atOnset != null) return atOnset;
  return (t / totalChronaxie) * noteDomainW;
}

/**
 * 简谱加时线 x（相对音符列区起点）：取 onset 列几何左缘。
 */
export function resolveAddLineXInSlot(
  layout: MeasureColumnLayout,
  onset: number,
): number | null {
  const geo = layout.onsetColumnGeometry.get(onset);
  return geo ? geo.startInDomain : null;
}

/**
 * 简谱增/休止符加时线 x（相对音符列区起点）。
 * 对齐目标 64 格所在列内锚点：列起点 + 列宽/2 - symbolW/2（与同 onset 符头 slotX 一致）。
 * 无 onset 列时取 [chronaxie-64, chronaxie] 时轴段中心再居中。
 */
export function resolveAddLineXInDomain(
  layout: MeasureColumnLayout,
  chronaxie: number,
  symbolW: number,
): number {
  const geo = layout.onsetColumnGeometry.get(chronaxie);
  if (geo != null) {
    return geo.startInDomain + geo.width / 2 - symbolW / 2;
  }
  const t = Math.max(0, Math.min(chronaxie, layout.totalChronaxie));
  const tPrev = Math.max(0, t - CHRONAXIE_GRID_UNIT);
  const x0 = resolveXInDomainAtChronaxie(layout, tPrev);
  const x1 = resolveXInDomainAtChronaxie(layout, t);
  const cellW = Math.max(0, x1 - x0);
  return x0 + cellW / 2 - symbolW / 2;
}

/** 单谱表小节列布局 */
export function buildMeasureColumnLayout(
  measure: Measure,
  noteDomainW: number,
  noteDomainStartOffset: number,
  adapter: ColumnLayoutSlotAdapter,
  measureHeight: number,
): MeasureColumnLayout {
  // 这里子所以传数组，是因为可能存在连谱模式，所以需要合并多个谱表的小节列布局，而这个函数是通用的
  const padded = withNoteDomainInnerPadding(noteDomainW, noteDomainStartOffset, measureHeight);
  const ratioByOnset = mergeOnsetRatios([measure], adapter);
  const geometryByOnset = buildColumnGeometryFromRatios(ratioByOnset, padded.noteDomainW);
  return {
    noteDomainStartOffset: padded.noteDomainStartOffset,
    noteDomainW: padded.noteDomainW,
    totalChronaxie: measureTotalChronaxie(measure, adapter),
    onsetStartInDomain: onsetStartsFromGeometry(geometryByOnset),
    onsetColumnGeometry: geometryByOnset,
    slotGeometries: assignSlotGeometries(measure, adapter, geometryByOnset),
  };
}

/**
 * 连谱：同小节列各谱表 onset 列 ratio 取平均，列几何共用。
 * `measures[i]` 与 `grandStaff.staves[i]` 对齐；缺失小节传 null/undefined 跳过。
 */
export function buildLinkedMeasureColumnLayouts(
  measures: (Measure | null | undefined)[],
  noteDomainW: number,
  noteDomainStartOffset: number,
  adapter: ColumnLayoutSlotAdapter,
  measureHeight: number,
): (MeasureColumnLayout | null)[] {
  const present = measures.filter((m): m is Measure => !!m);
  const padded = withNoteDomainInnerPadding(noteDomainW, noteDomainStartOffset, measureHeight);
  const ratioByOnset = mergeOnsetRatios(present, adapter);
  const geometryByOnset = buildColumnGeometryFromRatios(ratioByOnset, padded.noteDomainW);

  return measures.map((measure) => {
    if (!measure) return null;
    return {
      noteDomainStartOffset: padded.noteDomainStartOffset,
      noteDomainW: padded.noteDomainW,
      totalChronaxie: maxMeasureTotalChronaxie(measures, adapter),
      onsetStartInDomain: onsetStartsFromGeometry(geometryByOnset),
      onsetColumnGeometry: geometryByOnset,
      slotGeometries: assignSlotGeometries(measure, adapter, geometryByOnset),
    };
  });
}

/** 连谱下同列各谱表时值累加的最大值（规格 §3.1，布局侧可用于校验/扩展） */
export function maxMeasureTotalChronaxie(
  measures: (Measure | null | undefined)[],
  adapter: ColumnLayoutSlotAdapter,
): number {
  let max = 0;
  for (const measure of measures) {
    if (!measure) continue;
    max = Math.max(max, measureTotalChronaxie(measure, adapter));
  }
  return max;
}
