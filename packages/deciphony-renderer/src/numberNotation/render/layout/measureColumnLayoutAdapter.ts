import type {Measure, MeasureNoteSlot, NoteNumber} from '@/types/MusicScoreType';
import {slotSymbol} from '@/standardStaff/render/utils/staffSlot';
import type {NumberNotationSkinPack} from '@/types/common';
import type {ColumnLayoutSlotAdapter} from '@/render/layout/measureColumnLayout';
import {
  getBarlineSkinKey,
  getKeySignatureSkinKey,
  getTimeSignatureSkinKey,
} from '../utils/skinKey';
import {
  getNoteHeadColumnWidthRatio,
  getNumberNotationExtraOnsetRatios,
  getSlotLayoutChronaxie,
} from '../utils/note';

export function computeNumberNotationMeasureFixedWidths(
  measure: Measure,
  skin: NumberNotationSkinPack,
): { prefixW: number; suffixW: number } {
  let prefixW = 0;
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
    getChronaxie: (note) =>
      getSlotLayoutChronaxie(slotSymbol(note as MeasureNoteSlot) as NoteNumber),
    getNoteWidthRatio: (note) =>
      getNoteHeadColumnWidthRatio(note as MeasureNoteSlot, skin, measureHeight),
    getExtraOnsetRatios: (note, slotOnset) =>
      getNumberNotationExtraOnsetRatios(note as MeasureNoteSlot, skin).map((e) => ({
        onset: slotOnset + e.onsetOffset,
        ratio: e.ratio,
      })),
  };
}
