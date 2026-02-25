import type {Measure, NoteSymbol} from "@/types/MusicScoreType";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
import {CLEF_NOTE_GAP_RATIO} from "../constants";

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

/** 音符在小节内的宽度占比与布局：仅用 widthRatio（含时值系数、变音、谱号、附点等） */
export function getNoteWidthRatio(note: NoteSymbol): number {
  const base = (note.widthRatio ?? 0) * getChronaxieWidthCoefficient(getSlotChronaxie(note));
  let sub = 0;
  if (note.type === NoteSymbolTypeEnum.Note) {
    if (note.clef) sub += note.clef.widthRatio + CLEF_NOTE_GAP_RATIO;
    for (const beat of [note.voicePart, note.voicePart2].filter(Boolean)) {
      for (const n of beat!.notesInfo) {
        if (n.accidental?.widthRatio) sub += n.accidental.widthRatio;
      }
      if (beat!.augmentationDot?.widthRatio) sub += beat!.augmentationDot.widthRatio;
    }
  } else {
    if (note.clef) sub += note.clef.widthRatio + CLEF_NOTE_GAP_RATIO;
    if (note.augmentationDot?.widthRatio) sub += note.augmentationDot.widthRatio;
  }
  return base + sub;
}

/** 音符对小节在单谱表内宽度占比的系数：仅用 widthRatioForMeasure */
export function getNoteWidthRatioForMeasure(note: NoteSymbol): number {
  const base = (note.widthRatioForMeasure ?? 0) * getChronaxieWidthCoefficient(getSlotChronaxie(note));
  let sub = 0;
  if (note.type === NoteSymbolTypeEnum.Note) {
    if (note.clef) sub += note.clef.widthRatioForMeasure + CLEF_NOTE_GAP_RATIO;
    for (const beat of [note.voicePart, note.voicePart2].filter(Boolean)) {
      for (const n of beat!.notesInfo) {
        if (n.accidental?.widthRatioForMeasure) sub += n.accidental.widthRatioForMeasure;
      }
      if (beat!.augmentationDot?.widthRatioForMeasure) sub += beat!.augmentationDot.widthRatioForMeasure;
    }
  } else {
    if (note.clef) sub += note.clef.widthRatioForMeasure + CLEF_NOTE_GAP_RATIO;
    if (note.augmentationDot?.widthRatioForMeasure) sub += note.augmentationDot.widthRatioForMeasure;
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
