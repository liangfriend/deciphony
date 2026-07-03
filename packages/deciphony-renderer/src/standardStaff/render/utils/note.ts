import type {Measure, NoteRest, NoteSymbol, NotesInfo, StaffSlot} from "@/types/MusicScoreType";
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
import {isNoteRest, isNoteSymbol} from "./staffSlot";

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

export function getRestChronaxie(rest: NoteRest): Chronaxie {
  return rest.chronaxie;
}

/** 音符 / 休止符位的时值（用于宽度与 onset 累积；和弦取 notesInfo 最大 chronaxie） */
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
    for (const ni of slot.notesInfo) {
      if (ni.accidental) {
        sub += pick(skin[getAccidentalSkinKey(ni.accidental.type)], ni.accidental.widthRatio);
      }
      if (ni.augmentationDot) {
        sub += pick(skin[getAugmentationDotSkinKey(ni.augmentationDot)], ni.augmentationDot.widthRatio);
      }
    }
  } else if (slot.augmentationDot) {
    sub += pick(skin[getAugmentationDotSkinKey(slot.augmentationDot)], slot.augmentationDot.widthRatio);
  }
  return sub;
}

/** 音符 / 休止符在小节内的宽度占比 */
export function getNoteWidthRatio(
  slot: StaffSlot,
  skin: StandardStaffSkinPack,
  _measureHeight = skin[StandardStaffSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const slotChronaxie = getSlotChronaxie(slot);
  const isRest = isNoteRest(slot);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  const slotW = resolveWidthRatio(slot.widthRatio, skin[slotSkinKey]?.widthRatio);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectSlotSubWidthRatio(slot, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio));
  return base + sub;
}

/** 音符 / 休止符对小节在单谱表内宽度占比的系数 */
export function getNoteWidthRatioForMeasure(
  slot: StaffSlot,
  skin: StandardStaffSkinPack,
  _measureHeight = skin[StandardStaffSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const slotChronaxie = getSlotChronaxie(slot);
  const isRest = isNoteRest(slot);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  // 音符带widthRatio优先用音符的，否则用皮肤包的
  const slotW = resolveWidthRatio(slot.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectSlotSubWidthRatio(slot, skin, (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure));
  return base + sub;
}

/** 小节的宽度系数（五线谱：仅统计 StaffSlot） */
export function getMeasureWidthRatio(measure: Measure, skin: StandardStaffSkinPack): number {
  let acc = 0;
  acc += resolveWidthRatio(measure.widthRatioForMeasure, skin[StandardStaffSkinKeyEnum.Measure]?.widthRatioForMeasure);
  for (let i = 0; i < measure.notes.length; i++) {
    const slot = measure.notes[i];
    if (isNoteSymbol(slot) || isNoteRest(slot)) {
      acc += getNoteWidthRatioForMeasure(slot, skin);
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
