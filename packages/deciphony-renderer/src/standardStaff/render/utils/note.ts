import type {Measure, NoteSymbol} from "@/types/MusicScoreType";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
import {CLEF_NOTE_GAP_RATIO} from "../constants";

/** 音符位取两声部中最大时值用于宽度系数 */
export function getSlotChronaxie(note: NoteSymbol): number {
  let max = 0;
  for (const beat of note.voicePart1) {
    if (beat.chronaxie > max) max = beat.chronaxie;
  }
  for (const beat of note.voicePart2) {
    if (beat.chronaxie > max) max = beat.chronaxie;
  }
  return max || 64;
}

/** 是否为休止符位：type===Rest  */
export function isSlotRest(note: NoteSymbol): boolean {
  if (note.type === NoteSymbolTypeEnum.Rest) return true;
  return false
  // 或两声部均无音符
  // const hasNotes = (arr: NoteSymbol['voicePart1']) => arr.some((b) => b.notesInfo.length > 0);
  // return !hasNotes(note.voicePart1) && !hasNotes(note.voicePart2);
}

/** 休止符位取第一个有拍子的声部的时值用于休止符形状 */
export function getSlotRestChronaxie(note: NoteSymbol): number {
  const first = note.voicePart1[0] ?? note.voicePart2[0];
  return first?.chronaxie ?? 64;
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

/** 音符在小节内的宽度占比与布局：仅用 widthRatio（含时值系数、变音、谱号、附点等） */
export function getNoteWidthRatio(note: NoteSymbol): number {
  const base = (note.widthRatio ?? 0) * getChronaxieWidthCoefficient(getSlotChronaxie(note));
  let sub = 0;
  if (note.clef) sub += note.clef.widthRatio + CLEF_NOTE_GAP_RATIO;
  for (const beat of note.voicePart1) {
    for (const n of beat.notesInfo) {
      if (n.accidental?.widthRatio) sub += n.accidental.widthRatio;
    }
    if (beat.augmentationDot?.widthRatio) sub += beat.augmentationDot.widthRatio;
  }
  for (const beat of note.voicePart2) {
    for (const n of beat.notesInfo) {
      if (n.accidental?.widthRatio) sub += n.accidental.widthRatio;
    }
    if (beat.augmentationDot?.widthRatio) sub += beat.augmentationDot.widthRatio;
  }
  return base + sub;
}

/** 音符对小节在单谱表内宽度占比的系数：仅用 widthRatioForMeasure */
export function getNoteWidthRatioForMeasure(note: NoteSymbol): number {
  const base = (note.widthRatioForMeasure ?? 0) * getChronaxieWidthCoefficient(getSlotChronaxie(note));
  let sub = 0;
  if (note.clef) sub += note.clef.widthRatioForMeasure + CLEF_NOTE_GAP_RATIO;
  for (const beat of note.voicePart1) {
    for (const n of beat.notesInfo) {
      if (n.accidental?.widthRatioForMeasure) sub += n.accidental.widthRatioForMeasure;
    }
    if (beat.augmentationDot?.widthRatioForMeasure) sub += beat.augmentationDot.widthRatioForMeasure;
  }
  for (const beat of note.voicePart2) {
    for (const n of beat.notesInfo) {
      if (n.accidental?.widthRatioForMeasure) sub += n.accidental.widthRatioForMeasure;
    }
    if (beat.augmentationDot?.widthRatioForMeasure) sub += beat.augmentationDot.widthRatioForMeasure;
  }
  return base + sub;
}

/** 小节的宽度系数（小节在单谱表内的宽度占比） */
export function getMeasureWidthRatio(measure: Measure): number {
  let acc = 0;
  acc += measure.widthRatioForMeasure;
  for (let i = 0; i < measure.notes.length; i++) {
    acc += getNoteWidthRatioForMeasure(measure.notes[i] as NoteSymbol);
  }
  if (measure.barline) acc += measure.barline.widthRatioForMeasure;
  if (measure.clef_f) acc += measure.clef_f.widthRatioForMeasure;
  if (measure.clef_b) acc += measure.clef_b.widthRatioForMeasure;
  if (measure.keySignature_f) acc += measure.keySignature_f.widthRatioForMeasure;
  if (measure.keySignature_b) acc += measure.keySignature_b.widthRatioForMeasure;
  if (measure.timeSignature_f) acc += measure.timeSignature_f.widthRatioForMeasure;
  if (measure.timeSignature_b) acc += measure.timeSignature_b.widthRatioForMeasure;
  return acc;
}
