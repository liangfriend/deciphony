import type {Measure, NoteNumber} from '@/types/MusicScoreType';
import type {NumberNotationSkinPack} from '@/types/common';
import type {ColumnLayoutSlotAdapter} from '@/render/layout/measureColumnLayout';
import {
  getBarlineSkinKey,
  getKeySignatureSkinKey,
  getTimeSignatureSkinKey,
} from '../utils/skinKey';
import {getNoteColumnWidthRatio, getSlotChronaxie} from '../utils/note';

export function computeNumberNotationMeasureFixedWidths(
  measure: Measure,
  skin: NumberNotationSkinPack,
): { prefixW: number; suffixW: number } {
  let prefixW = 0;
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
  if (measure.timeSignature_b) {
    const item = skin[getTimeSignatureSkinKey(measure.timeSignature_b.type)];
    if (item) suffixW += item.w;
  }
  return {prefixW, suffixW};
}

export function createNumberNotationColumnLayoutAdapter(
  skin: NumberNotationSkinPack,
  measureHeight: number,
): ColumnLayoutSlotAdapter {
  return {
    isLayoutSlot: () => true,
    getChronaxie: (note) => getSlotChronaxie(note as NoteNumber),
    getNoteWidthRatio: (note) => getNoteColumnWidthRatio(note as NoteNumber, skin, measureHeight),
  };
}
