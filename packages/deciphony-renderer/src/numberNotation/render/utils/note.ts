import type {Measure, NoteNumber, NoteSymbol} from "@/types/MusicScoreType";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
import {CLEF_NOTE_GAP_RATIO} from "../constants";

/** 简谱音符位取 voicePart 时值用于宽度系数 */
export function getSlotChronaxie(note: NoteNumber): number {
  return note.voicePart.chronaxie || 64;
}

/** 是否为休止符位：简谱 syllable===0 或五线谱 type===Rest */
export function isSlotRest(note: NoteNumber): boolean {
  if ('type' in note && note.type === NoteSymbolTypeEnum.Rest) return true;
  return !note.voicePart.notesInfo.length || note.voicePart.notesInfo.every((n) => n.syllable === 0);
}

/** 休止符位取第一个有拍子的声部的时值用于休止符形状 */
export function getSlotRestChronaxie(note: NoteNumber): number {
  return note.voicePart.chronaxie ?? 64;
}

/** widthRatio/widthRatioForMeasure 以四分音符(64)为 1；时值换算系数 */
export function getChronaxieWidthCoefficient(chronaxie: number): number {
  if (chronaxie === 256) return 4;
  if (chronaxie === 128) return 2;
  if (chronaxie === 64) return 1;
  if (chronaxie === 32) return 0.5;
  if (chronaxie === 16) return 0.25;
  if (chronaxie === 8) return 0.25;
  if (chronaxie === 4) return 0.25;
  if (chronaxie === 2) return 0.25;
  if (chronaxie === 1) return 0.25;
  return 1;
}

/** 音符在小节内的宽度占比与布局：仅用 widthRatio（含时值系数、变音、谱号、附点等） */
export function getNoteWidthRatio(note: NoteNumber): number {
  const base = (note.widthRatio ?? 0) * getChronaxieWidthCoefficient(getSlotChronaxie(note));
  let sub = 0;
  if (note.clef) sub += note.clef.widthRatio + CLEF_NOTE_GAP_RATIO;
  const beat = note.voicePart;
  for (const n of beat.notesInfo) {
    const acc = 'accidental' in n ? n.accidental : (n as { accidental?: { widthRatio?: number } }).accidental;
    if (acc?.widthRatio) sub += acc.widthRatio;
  }
  if (beat.augmentationDot?.widthRatio) sub += beat.augmentationDot.widthRatio;
  return base + sub;
}

/** 音符对小节在单谱表内宽度占比的系数：仅用 widthRatioForMeasure（本包仅处理 NoteNumber） */
export function getNoteWidthRatioForMeasure(note: NoteNumber): number {
  const base = (note.widthRatioForMeasure ?? 0) * getChronaxieWidthCoefficient(getSlotChronaxie(note));
  let sub = 0;
  if (note.clef) sub += note.clef.widthRatioForMeasure + CLEF_NOTE_GAP_RATIO;
  const beat = note.voicePart;
  for (const n of beat.notesInfo) {
    const acc = 'accidental' in n ? n.accidental : (n as {
      accidental?: { widthRatioForMeasure?: number }
    }).accidental;
      if (acc?.widthRatioForMeasure) sub += acc.widthRatioForMeasure;
  }
  if (beat.augmentationDot?.widthRatioForMeasure) sub += beat.augmentationDot.widthRatioForMeasure;
  return base + sub;
}

/** 小节的宽度系数（小节在单谱表内的宽度占比） */
export function getMeasureWidthRatio(measure: Measure): number {
  let acc = 0;
  acc += measure.widthRatioForMeasure;
  for (let i = 0; i < measure.notes.length; i++) {
    acc += getNoteWidthRatioForMeasure(measure.notes[i] as NoteNumber | NoteSymbol);
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
