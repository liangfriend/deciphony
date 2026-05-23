import type {Measure, NoteSymbol, NotesInfo} from "@/types/MusicScoreType";
import type {StandardStaffSkinPack} from "@/types/common";
import {BeamTypeEnum, NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
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

export type VoiceGroup = {
  direction: 'up' | 'down';
  notesInfo: NotesInfo[];
  chronaxie: Chronaxie;
  beamType: BeamTypeEnum;
};

/** 按符干方向分组：同方向多条 notesInfo 视为和弦 */
export function getVoiceGroups(note: NoteSymbol): VoiceGroup[] {
  if (note.type === NoteSymbolTypeEnum.Rest || note.notesInfo.length === 0) return [];
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

/** 音符位取各声部方向中最大时值用于宽度系数 */
export function getSlotChronaxie(note: NoteSymbol): number {
  if (note.type === NoteSymbolTypeEnum.Rest) return note.chronaxie ?? 64;
  let max = 64;
  for (const ni of note.notesInfo) {
    if (ni.chronaxie > max) max = ni.chronaxie;
  }
  return max;
}

/** 是否为休止符位 */
export function isSlotRest(note: NoteSymbol): boolean {
  return note.type === NoteSymbolTypeEnum.Rest;
}

/** 休止符位时值 */
export function getSlotRestChronaxie(note: NoteSymbol): number {
  if (note.type === NoteSymbolTypeEnum.Rest) return note.chronaxie ?? 64;
  return getSlotChronaxie(note);
}

/** widthRatio/widthRatioForMeasure 以四分音符(64)为 1；时值换算系数 */
export function getChronaxieWidthCoefficient(chronaxie: number): number {
  if (chronaxie === 256) return 1.5;
  if (chronaxie === 128) return 1.3;
  if (chronaxie === 64) return 1;
  if (chronaxie === 32) return 0.8;
  if (chronaxie === 16) return 0.7;
  if (chronaxie === 8) return 0.6;
  if (chronaxie === 4) return 0.55;
  if (chronaxie === 2) return 0.5;
  if (chronaxie === 1) return 0.45;
  return 1;
}

function collectNoteSubWidthRatio(
  note: NoteSymbol,
  skin: StandardStaffSkinPack,
  pick: (item: { widthRatio?: number; widthRatioForMeasure?: number } | undefined, data?: number) => number,
): number {
  let sub = 0;
  if (note.clef) {
    sub += pick(skin[getClefSkinKey(note.clef.clefType, false)], note.clef.widthRatio) + CLEF_NOTE_GAP_RATIO;
  }
  if (note.type === NoteSymbolTypeEnum.Note) {
    for (const ni of note.notesInfo) {
      if (ni.accidental) {
        sub += pick(skin[getAccidentalSkinKey(ni.accidental.type)], ni.accidental.widthRatio);
      }
      if (ni.augmentationDot) {
        sub += pick(skin[getAugmentationDotSkinKey(ni.augmentationDot)], ni.augmentationDot.widthRatio);
      }
    }
  } else {
    if (note.augmentationDot) {
      sub += pick(skin[getAugmentationDotSkinKey(note.augmentationDot)], note.augmentationDot.widthRatio);
    }
  }
  return sub;
}

/** 音符在小节内的宽度占比 */
export function getNoteWidthRatio(note: NoteSymbol, skin: StandardStaffSkinPack): number {
  const slotChronaxie = getSlotChronaxie(note);
  const isRest = isSlotRest(note);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  const slotW = resolveWidthRatio(note.widthRatio, skin[slotSkinKey]?.widthRatio);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectNoteSubWidthRatio(note, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio));
  return base + sub;
}

/** 音符对小节在单谱表内宽度占比的系数 */
export function getNoteWidthRatioForMeasure(note: NoteSymbol, skin: StandardStaffSkinPack): number {
  const slotChronaxie = getSlotChronaxie(note);
  const isRest = isSlotRest(note);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  const slotW = resolveWidthRatio(note.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectNoteSubWidthRatio(note, skin, (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure));
  return base + sub;
}

/** 小节的宽度系数 */
export function getMeasureWidthRatio(measure: Measure, skin: StandardStaffSkinPack): number {
  let acc = 0;
  acc += resolveWidthRatio(measure.widthRatioForMeasure, skin[StandardStaffSkinKeyEnum.Measure]?.widthRatioForMeasure);
  for (let i = 0; i < measure.notes.length; i++) {
    acc += getNoteWidthRatioForMeasure(measure.notes[i] as NoteSymbol, skin);
  }
  if (measure.barline_f) {
    acc += resolveWidthRatio(measure.barline_f.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_f.barlineType)]?.widthRatioForMeasure);
  }
  if (measure.barline_b) {
    acc += resolveWidthRatio(measure.barline_b.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_b.barlineType)]?.widthRatioForMeasure);
  }
  if (measure.clef_f) {
    acc += resolveWidthRatio(measure.clef_f.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_f.clefType, true)]?.widthRatioForMeasure);
  }
  if (measure.clef_b) {
    acc += resolveWidthRatio(measure.clef_b.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_b.clefType, false)]?.widthRatioForMeasure);
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
