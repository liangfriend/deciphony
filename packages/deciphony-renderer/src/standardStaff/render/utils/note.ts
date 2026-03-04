import type {Measure, NoteSymbol} from "@/types/MusicScoreType";
import type {StandardStaffSkinPack} from "@/types/common";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
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

/** 音符位取两声部中最大时值用于宽度系数 */
export function getSlotChronaxie(note: NoteSymbol): number {
  if (note.type === NoteSymbolTypeEnum.Rest) return note.chronaxie;
  let max = note.voicePart.chronaxie;
  if (note.voicePart2 && note.voicePart2.chronaxie > max) max = note.voicePart2.chronaxie;
  return max || 64;
}

/** 是否为休止符位：type===Rest  */
export function isSlotRest(note: NoteSymbol): boolean {
  return note.type === NoteSymbolTypeEnum.Rest;
}

/** 休止符位取第一个有拍子的声部的时值用于休止符形状 */
export function getSlotRestChronaxie(note: NoteSymbol): number {
  if (note.type === NoteSymbolTypeEnum.Rest) return note.chronaxie;
  return note.voicePart?.chronaxie ?? note.voicePart2?.chronaxie ?? 64;
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

/** 音符在小节内的宽度占比与布局：仅用 widthRatio（含时值系数、变音、谱号、附点等）；数据优先，否则用皮肤，0 为有效值 */
export function getNoteWidthRatio(note: NoteSymbol, skin: StandardStaffSkinPack): number {
  const slotChronaxie = getSlotChronaxie(note);
  const isRest = isSlotRest(note);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  const slotW = resolveWidthRatio(note.widthRatio, skin[slotSkinKey]?.widthRatio);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  let sub = 0;
  if (note.type === NoteSymbolTypeEnum.Note) {
    if (note.clef) {
      sub += resolveWidthRatio(note.clef.widthRatio, skin[getClefSkinKey(note.clef.clefType, false)]?.widthRatio) + CLEF_NOTE_GAP_RATIO;
    }
    for (const beat of [note.voicePart, note.voicePart2].filter(Boolean)) {
      for (const n of beat!.notesInfo) {
        if (n.accidental) sub += resolveWidthRatio(n.accidental.widthRatio, skin[getAccidentalSkinKey(n.accidental.type)]?.widthRatio);
      }
      if (beat!.augmentationDot) {
        sub += resolveWidthRatio(beat!.augmentationDot.widthRatio, skin[getAugmentationDotSkinKey(beat!.augmentationDot)]?.widthRatio);
      }
    }
  } else {
    if (note.clef) {
      sub += resolveWidthRatio(note.clef.widthRatio, skin[getClefSkinKey(note.clef.clefType, false)]?.widthRatio) + CLEF_NOTE_GAP_RATIO;
    }
    if (note.augmentationDot) {
      sub += resolveWidthRatio(note.augmentationDot.widthRatio, skin[getAugmentationDotSkinKey(note.augmentationDot)]?.widthRatio);
    }
  }
  return base + sub;
}

/** 音符对小节在单谱表内宽度占比的系数：仅用 widthRatioForMeasure；数据优先，否则用皮肤，0 为有效值 */
export function getNoteWidthRatioForMeasure(note: NoteSymbol, skin: StandardStaffSkinPack): number {
  const slotChronaxie = getSlotChronaxie(note);
  const isRest = isSlotRest(note);
  const slotSkinKey = isRest ? getRestSkinKey(slotChronaxie) : getNoteHeadSkinKey(slotChronaxie);
  const slotW = resolveWidthRatio(note.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  let sub = 0;
  if (note.type === NoteSymbolTypeEnum.Note) {
    if (note.clef) {
      sub += resolveWidthRatio(note.clef.widthRatioForMeasure, skin[getClefSkinKey(note.clef.clefType, false)]?.widthRatioForMeasure) + CLEF_NOTE_GAP_RATIO;
    }
    for (const beat of [note.voicePart, note.voicePart2].filter(Boolean)) {
      for (const n of beat!.notesInfo) {
        if (n.accidental) sub += resolveWidthRatio(n.accidental.widthRatioForMeasure, skin[getAccidentalSkinKey(n.accidental.type)]?.widthRatioForMeasure);
      }
      if (beat!.augmentationDot) {
        sub += resolveWidthRatio(beat!.augmentationDot.widthRatioForMeasure, skin[getAugmentationDotSkinKey(beat!.augmentationDot)]?.widthRatioForMeasure);
      }
    }
  } else {
    if (note.clef) {
      sub += resolveWidthRatio(note.clef.widthRatioForMeasure, skin[getClefSkinKey(note.clef.clefType, false)]?.widthRatioForMeasure) + CLEF_NOTE_GAP_RATIO;
    }
    if (note.augmentationDot) {
      sub += resolveWidthRatio(note.augmentationDot.widthRatioForMeasure, skin[getAugmentationDotSkinKey(note.augmentationDot)]?.widthRatioForMeasure);
    }
  }
  return base + sub;
}

/** 小节的宽度系数（小节在单谱表内的宽度占比）；数据优先，否则用皮肤，0 为有效值 */
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
