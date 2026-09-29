import type {Measure, MeasureNoteSlot, StaffSlot} from '@/types/MusicScoreType';
import type {StandardStaffSkinPack} from '@/types/common';
import type {ColumnLayoutSlotAdapter} from '@/render/layout/measureColumnLayout';
import {
  getBarlineSkinKey,
  getClefSkinKey,
  getKeySignatureSkinKey,
  getTimeSignatureSkinKey,
} from '../utils/skinKey';
import {getNoteWidthRatio, getSlotLayoutChronaxie} from '../utils/note';
import {slotIsNoteRest, slotIsNoteSymbol, slotSymbol} from '../utils/staffSlot';

export function computeStandardMeasureFixedWidths(
  measure: Measure,
  skin: StandardStaffSkinPack,
): { prefixW: number; suffixW: number } {
  let prefixW = 0;
  if (measure.clef_f) {
    const item = skin[getClefSkinKey(measure.clef_f.type, true)];
    if (item) prefixW += item.w;
  }
  if (measure.keySignature_f) {
    const item = skin[getKeySignatureSkinKey(measure.keySignature_f.type)];
    if (item) prefixW += item.w;
  }
  if (measure.timeSignature_f) {
    const item = skin[getTimeSignatureSkinKey(measure.timeSignature_f.type)];
    if (item) prefixW += item.w;
  }
  if (measure.barline_f) {
    const item = skin[getBarlineSkinKey(measure.barline_f.type)];
    if (item) prefixW += item.w;
  }

  let suffixW = 0;
  if (measure.barline_b) {
    const item = skin[getBarlineSkinKey(measure.barline_b.type)];
    if (item) suffixW += item.w;
  }
  if (measure.clef_b) {
    const item = skin[getClefSkinKey(measure.clef_b.type, false)];
    if (item) suffixW += item.w;
  }
  if (measure.keySignature_b) {
    const item = skin[getKeySignatureSkinKey(measure.keySignature_b.type)];
    if (item) suffixW += item.w;
  }
  if (measure.timeSignature_b) {
    const item = skin[getTimeSignatureSkinKey(measure.timeSignature_b.type)];
    if (item) suffixW += item.w;
  }
  return {prefixW, suffixW};
}

export function createStandardStaffColumnLayoutAdapter(
  skin: StandardStaffSkinPack,
  measureHeight: number,
): ColumnLayoutSlotAdapter {
  return {
    isLayoutSlot: (note): note is MeasureNoteSlot =>
      slotIsNoteSymbol(note as MeasureNoteSlot) || slotIsNoteRest(note as MeasureNoteSlot),
    getChronaxie: (note) => getSlotLayoutChronaxie(slotSymbol(note as MeasureNoteSlot) as StaffSlot),
    getNoteWidthRatio: (note) => getNoteWidthRatio(note as MeasureNoteSlot, skin, measureHeight),
  };
}
