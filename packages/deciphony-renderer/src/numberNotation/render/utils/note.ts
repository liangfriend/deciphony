import type {Measure, NoteNumber} from "@/types/MusicScoreType";
import type {NumberNotationSkinPack} from "@/types/common";
import {resolveWidthRatio} from "@/utils/widthRatio";
import {
  getAccidentalSkinKey,
  getAugmentationDotSkinKey,
  getBarlineSkinKey,
  getKeySignatureSkinKey, getSyllableSkinKey,
  getTimeSignatureSkinKey,
} from "./skinKey";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
import {graceNoteNumberAfterWidth, graceNoteNumberBeforeWidth} from "@/numberNotation/render/grace/renderGraceNumber";


/** 简谱音符位时值 */
export function getSlotChronaxie(note: NoteNumber): number {
  return note.chronaxie || 64;
}

/** 是否为休止符位：syllable===0 */
export function isSlotRest(note: NoteNumber): boolean {
  return !note.notesInfo.length || note.notesInfo.every((n) => n.syllable === 0);
}

/** 休止符位时值 */
export function getSlotRestChronaxie(note: NoteNumber): number {
  return note.chronaxie ?? 64;
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

function collectSubWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  pick: (item: { widthRatio?: number; widthRatioForMeasure?: number } | undefined, data?: number) => number,
): number {
  let sub = 0;
  for (const n of note.notesInfo) {
    if (n.accidental) {
      sub += pick(skin[getAccidentalSkinKey(n.accidental.type)], n.accidental.widthRatio);
    }
    if (n.augmentationDot) {
      sub += pick(skin[getAugmentationDotSkinKey(n.augmentationDot)], n.augmentationDot.widthRatio);
    }
  }
  if (note.augmentationDot && !note.notesInfo.some((n) => n.augmentationDot)) {
    sub += pick(skin[getAugmentationDotSkinKey(note.augmentationDot)], note.augmentationDot.widthRatio);
  }
  return sub;
}

function graceWidthRatioForNoteNumber(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight: number,
): number {
  if (isSlotRest(note)) return 0;
  let before = 0;
  let after = 0;
  for (const ni of note.notesInfo) {
    before = Math.max(before, graceNoteNumberBeforeWidth(ni.graceNotes, note, skin, measureHeight));
    after = Math.max(after, graceNoteNumberAfterWidth(ni.graceNotesAfter, note, skin, measureHeight));
  }
  return ((before + after) / measureHeight) * 4;
}

/** 音符在小节内的宽度占比 */
export function getNoteWidthRatio(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const slotChronaxie = getSlotChronaxie(note);
  // 获取宽度1234567X都一样
  const slotSkinKey = getSyllableSkinKey('X');
  const slotW = resolveWidthRatio(note.widthRatio, skin[slotSkinKey]?.widthRatio);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectSubWidthRatio(note, skin, (item, data) => resolveWidthRatio(data, item?.widthRatio));
  return base + sub + graceWidthRatioForNoteNumber(note, skin, measureHeight);
}

/** 音符对小节在单谱表内宽度占比的系数 */
export function getNoteWidthRatioForMeasure(
  note: NoteNumber,
  skin: NumberNotationSkinPack,
  measureHeight = skin[NumberNotationSkinKeyEnum.Measure]?.h ?? 45,
): number {
  const slotChronaxie = getSlotChronaxie(note);
  // 获取宽度1234567X都一样
  const slotSkinKey = getSyllableSkinKey('X');
  const slotW = resolveWidthRatio(note.widthRatioForMeasure, skin[slotSkinKey]?.widthRatioForMeasure);
  const base = slotW * getChronaxieWidthCoefficient(slotChronaxie);
  const sub = collectSubWidthRatio(note, skin, (item, data) => resolveWidthRatio(data, item?.widthRatioForMeasure));
  return base + sub + graceWidthRatioForNoteNumber(note, skin, measureHeight);
}

/** 小节的宽度系数 */
export function getMeasureWidthRatio(measure: Measure, skin: NumberNotationSkinPack): number {
  let acc = 0;
  acc += resolveWidthRatio(measure.widthRatioForMeasure, skin[NumberNotationSkinKeyEnum.Measure]?.widthRatioForMeasure);
  for (let i = 0; i < measure.notes.length; i++) {
    acc += getNoteWidthRatioForMeasure(measure.notes[i] as NoteNumber, skin);
  }
  if (measure.barline_f) {
    acc += resolveWidthRatio(measure.barline_f.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_f.type)]?.widthRatioForMeasure);
  }
  if (measure.barline_b) {
    acc += resolveWidthRatio(measure.barline_b.widthRatioForMeasure, skin[getBarlineSkinKey(measure.barline_b.type)]?.widthRatioForMeasure);
  }
  // 虽然measure保留了这两个属性，但是简谱不应该渲染谱号
  // if (measure.clef_f) {
  //     acc += resolveWidthRatio(measure.clef_f.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_f.type, true)]?.widthRatioForMeasure);
  // }
  // if (measure.clef_b) {
  //     acc += resolveWidthRatio(measure.clef_b.widthRatioForMeasure, skin[getClefSkinKey(measure.clef_b.type, false)]?.widthRatioForMeasure);
  // }
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
