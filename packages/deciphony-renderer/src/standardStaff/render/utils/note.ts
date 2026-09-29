import type {Measure, MeasureNoteSlot, NoteRest, NoteSymbol, NotesInfo, StaffSlot} from "@/types/MusicScoreType";
import type {StandardStaffSkinPack} from "@/types/common";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import type {Chronaxie} from "@/types/common";
import {resolveWidthRatio} from "@/utils/widthRatio";
import {CLEF_NOTE_GAP_RATIO} from "../constants";
import {
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getBarlineSkinKey,
  getClefSkinKey,
  getKeySignatureSkinKey,
  getNoteHeadSkinKey,
  getRestSkinKey,
  getTimeSignatureSkinKey,
} from "./skinKey";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import {GRACE_NOTE_SCALE} from "@/render/graceNote";
import {isNoteRest, isNoteSymbol, slotIsNoteRest, slotIsNoteSymbol, slotSymbol} from "./staffSlot";
import {getMeasureSlots} from '@/utils/measureNotes';

export type VoiceGroup = {
  direction: 'up' | 'down';
  notesInfo: NotesInfo[];
  chronaxie: Chronaxie;
  beamType: BeamTypeEnum;
};

/** 按符干方向分组：同方向多条 notesInfo 视为和弦 */
export function getVoiceGroups(note: NoteSymbol): VoiceGroup[] {
  if (note.notesInfo.length === 0) return [];
  const map = new Map<'up' | 'down', NotesInfo[]>();
  for (const ni of note.notesInfo) {
    const list = map.get(ni.direction) ?? [];
    list.push(ni);
    map.set(ni.direction, list);
  }
  return (['up', 'down'] as const)
  .filter((d) => map.has(d))
  .map((direction) => {
    const entries = map.get(direction)!;
    return {
      direction,
      notesInfo: entries,
      chronaxie: entries[0]!.chronaxie,
      beamType: entries[0]!.beamType,
    };
  });
}

export function getVoiceGroupForDirection(note: NoteSymbol, direction: 'up' | 'down'): VoiceGroup | undefined {
  return getVoiceGroups(note).find((g) => g.direction === direction);
}

/**
 * relativeX 参与合并（相同才合并，见合并键），但 relativeY/W/H 偏移会破坏符干的垂直/宽度贴合，
 * 带这类偏移的音符独立渲染符干符尾，不参与合并。
 */
export function hasNonXRelativeOffset(n: NotesInfo): boolean {
  return (n.relativeY ?? 0) !== 0
    || (n.relativeW ?? 0) !== 0
    || (n.relativeH ?? 0) !== 0;
}

/**
 * 共用一条符干的音符分组：direction + chronaxie + relativeX 相同者合并；
 * 带 relativeY/W/H 偏移的音符各自单独一组。
 */
export function getStemBuckets(notesInfo: NotesInfo[]): NotesInfo[][] {
  const buckets: NotesInfo[][] = [];
  const merged = new Map<string, NotesInfo[]>();
  for (const n of notesInfo) {
    if (hasNonXRelativeOffset(n)) {
      buckets.push([n]);
      continue;
    }
    const key = `${n.direction}|${n.chronaxie}|${n.relativeX ?? 0}`;
    let list = merged.get(key);
    if (!list) {
      list = [];
      merged.set(key, list);
      buckets.push(list);
    }
    list.push(n);
  }
  return buckets;
}

/**
 * 同一符干组内相邻（二度）音符头错位：
 * - 符干向上：自下而上扫描，与下方未错位音符相邻者移到符干右侧（'right'）；
 * - 符干向下：自上而下扫描，与上方未错位音符相邻者移到符干左侧（'left'）。
 * 结果：二度中靠上的音符头总在右边，连续二度交替错位。
 */
export function computeSecondDisplacement(notesInfo: NotesInfo[]): Map<string, 'left' | 'right'> {
  const result = new Map<string, 'left' | 'right'>();
  for (const bucket of getStemBuckets(notesInfo)) {
    if (bucket.length < 2) continue;
    const up = bucket[0]!.direction === 'up';
    const sorted = [...bucket].sort((a, b) => (up ? a.region - b.region : b.region - a.region));
    let prevRegion: number | null = null;
    let prevDisplaced = false;
    for (const n of sorted) {
      if (prevRegion != null && n.region === prevRegion) continue;
      const adjacent = prevRegion != null && Math.abs(n.region - prevRegion) === 1;
      const displaced: boolean = adjacent && !prevDisplaced;
      if (displaced) result.set(n.id, up ? 'right' : 'left');
      prevRegion = n.region;
      prevDisplaced = displaced;
    }
  }
  return result;
}

export function getRestChronaxie(rest: NoteRest): Chronaxie {
  return rest.chronaxie;
}

/** 附点延长后的时值（与播放 getDuration 一致） */
export function getDotExtendedChronaxie(chronaxie: number, dotCount: number): number {
  let total = chronaxie;
  let add = chronaxie;
  for (let i = 0; i < dotCount; i++) {
    add /= 2;
    total += add;
  }
  return total;
}

/** 列布局 onset 推进：含附点；音符取首个 notesInfo */
export function getSlotLayoutChronaxie(slot: StaffSlot): number {
  if (isNoteRest(slot)) {
    return getDotExtendedChronaxie(slot.chronaxie, slot.augmentationDot?.count ?? 0);
  }
  const lead = slot.notesInfo[0];
  if (!lead) return 64;
  return getDotExtendedChronaxie(lead.chronaxie, lead.augmentationDot?.count ?? 0);
}

/** 音符 / 休止符位的时值（用于宽度系数与符头 / 休止符皮肤；和弦取 notesInfo 最大 chronaxie） */
export function getSlotChronaxie(slot: StaffSlot): number {
  if (isNoteRest(slot)) return slot.chronaxie;
  if (slot.notesInfo.length === 0) return 64;
  let max = slot.notesInfo[0]!.chronaxie;
  for (let i = 1; i < slot.notesInfo.length; i++) {
    const c = slot.notesInfo[i]!.chronaxie;
    if (c > max) max = c;
  }
  return max;
}

export function isSlotRest(slot: StaffSlot): slot is NoteRest {
  return isNoteRest(slot);
}

export function getSlotRestChronaxie(slot: StaffSlot): number {
  if (isNoteRest(slot)) return slot.chronaxie;
  return getSlotChronaxie(slot);
}

/**
 * widthRatio 时值换算系数。
 * onset 列布局后，全/二/四分不再靠放大 ratio 给符尾/增时腾位（时长由 onset 对齐）；仅更短时值略缩小。
 */
export function getChronaxieWidthCoefficient(chronaxie: number): number {
  if (chronaxie >= 64) return 1;
  if (chronaxie === 32) return 0.8;
  if (chronaxie === 16) return 0.7;
  if (chronaxie === 8) return 0.6;
  if (chronaxie === 4) return 0.55;
  if (chronaxie === 2) return 0.5;
  if (chronaxie === 1) return 0.45;
  return 1;
}

function collectGraceNotesWidthRatio(
  graceNotes: NotesInfo[] | undefined,
  skin: StandardStaffSkinPack,
  pick: (item: { widthRatio?: number; widthRatioForMeasure?: number } | undefined, data?: number) => number,
): number {
  let sub = 0;
  for (const g of graceNotes ?? []) {
    sub += pick(skin[getNoteHeadSkinKey(g.chronaxie)], g.widthRatio) * GRACE_NOTE_SCALE;
    if (g.accidental) {
      sub += pick(skin[getAccidentalSkinKey(g.accidental.type)], g.accidental.widthRatio) * GRACE_NOTE_SCALE;
    }
    if (g.augmentationDot) {
      sub += pick(skin[getAugmentationDotSkinKey(g.augmentationDot)], g.augmentationDot.widthRatio) * GRACE_NOTE_SCALE;
    }
  }
  return sub;
}

function collectSlotSubWidthRatio(
  slot: StaffSlot,
  skin: StandardStaffSkinPack,
  pick: (item: { widthRatio?: number; widthRatioForMeasure?: number } | undefined, data?: number) => number,
): number {
  let sub = 0;
  if (slot.clef) {
    sub += pick(skin[getClefSkinKey(slot.clef.type, false)], slot.clef.widthRatio) + CLEF_NOTE_GAP_RATIO;
  }
  if (isNoteSymbol(slot)) {
    const displaced = computeSecondDisplacement(slot.notesInfo);
    for (const side of new Set(displaced.values())) {
      const ni = slot.notesInfo.find((n) => displaced.get(n.id) === side)!;
      sub += pick(skin[getNoteHeadSkinKey(ni.chronaxie)], ni.widthRatio);
    }
    for (const ni of slot.notesInfo) {
      if (ni.accidental) {
        sub += pick(skin[getAccidentalSkinKey(ni.accidental.type)], ni.accidental.widthRatio);
      }
      if (ni.augmentationDot) {
        sub += pick(skin[getAugmentationDotSkinKey(ni.augmentationDot)], ni.augmentationDot.widthRatio);
      }
    }
    sub += collectGraceNotesWidthRatio(slot.graceNotes, skin, pick);
    sub += collectGraceNotesWidthRatio(slot.graceNotesAfter, skin, pick);
  } else if (slot.augmentationDot) {
    sub += pick(skin[getAugmentationDotSkinKey(slot.augmentationDot)], slot.augmentationDot.widthRatio);
  }
  return sub;
}

/** 音符 / 休止符在小节内的宽度占比（widthRatio 在 MeasureNoteSlot 上） */
export function getNoteWidthRatio(
  measureSlot: MeasureNoteSlot,
  skin: StandardStaffSkinPack,
  _measureHeight = skin[StandardStaffSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const slot = slotSymbol(measureSlot);
  const slotChronaxie = getSlotChronaxie(slot as StaffSlot);
  const isRest = isNoteRest(slot as StaffSlot);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  const slotW = resolveWidthRatio(measureSlot.widthRatio, skin[slotSkinKey]?.widthRatio);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectSlotSubWidthRatio(slot as StaffSlot, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio));
  return base + sub;
}

/** 音符 / 休止符对小节在单谱表内宽度占比的系数 */
export function getNoteWidthRatioForMeasure(
  measureSlot: MeasureNoteSlot,
  skin: StandardStaffSkinPack,
  _measureHeight = skin[StandardStaffSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const slot = slotSymbol(measureSlot);
  const slotChronaxie = getSlotChronaxie(slot as StaffSlot);
  const isRest = isNoteRest(slot as StaffSlot);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  const slotW = resolveWidthRatio(measureSlot.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectSlotSubWidthRatio(
    slot as StaffSlot,
    skin,
    (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure),
  );
  return base + sub;
}

/** 小节的宽度系数（五线谱：仅统计 StaffSlot） */
export function getMeasureWidthRatio(measure: Measure, skin: StandardStaffSkinPack): number {
  let acc = 0;
  acc += resolveWidthRatio(measure.widthRatioForMeasure, skin[StandardStaffSkinKeyEnum.Measure]?.widthRatioForMeasure);
  for (const measureSlot of getMeasureSlots(measure)) {
    if (slotIsNoteSymbol(measureSlot) || slotIsNoteRest(measureSlot)) {
      acc += getNoteWidthRatioForMeasure(measureSlot, skin);
    }
  }
  if (measure.barline_f) {
    acc += resolveWidthRatio(measure.barline_f.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_f.type)]?.widthRatioForMeasure);
  }
  if (measure.barline_b) {
    acc += resolveWidthRatio(measure.barline_b.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_b.type)]?.widthRatioForMeasure);
  }
  if (measure.clef_f) {
    acc += resolveWidthRatio(measure.clef_f.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_f.type, true)]?.widthRatioForMeasure);
  }
  if (measure.clef_b) {
    acc += resolveWidthRatio(measure.clef_b.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_b.type, false)]?.widthRatioForMeasure);
  }
  if (measure.keySignature_f) {
    acc += resolveWidthRatio(measure.keySignature_f.widthRatioForMeasure, skin[getKeySignatureSkinKey(measure.keySignature_f.type)]?.widthRatioForMeasure);
  }
  if (measure.keySignature_b) {
    acc += resolveWidthRatio(measure.keySignature_b.widthRatioForMeasure, skin[getKeySignatureSkinKey(measure.keySignature_b.type)]?.widthRatioForMeasure);
  }
  if (measure.timeSignature_f) {
    acc += resolveWidthRatio(measure.timeSignature_f.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)]?.widthRatioForMeasure);
  }
  if (measure.timeSignature_b) {
    acc += resolveWidthRatio(measure.timeSignature_b.widthRatioForMeasure, skin[getTimeSignatureSkinKey(measure.timeSignature_b.type)]?.widthRatioForMeasure);
  }
  return acc;
}
