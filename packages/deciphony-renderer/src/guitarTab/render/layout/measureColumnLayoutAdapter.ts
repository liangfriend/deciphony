import type {Measure, StaffSlot} from '@/types/MusicScoreType';
import type {GuitarTabSkinPack} from '@/types/common';
import type {ColumnLayoutSlotAdapter} from '@/render/layout/measureColumnLayout';
import {
    getBarlineSkinKey,
    getTimeSignatureSkinKey,
} from '../utils/skinKey';
import {
    getNoteHeadColumnWidthRatio,
    getGuitarTabExtraOnsetRatios,
    getSlotLayoutChronaxie,
} from '../utils/note';
import {isStaffSlot} from '../utils/staffSlot';

export function computeStandardMeasureFixedWidths(
    measure: Measure,
    skin: GuitarTabSkinPack,
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

export function createGuitarTabColumnLayoutAdapter(
    skin: GuitarTabSkinPack,
    measureHeight: number,
): ColumnLayoutSlotAdapter {
    return {
        isLayoutSlot: (note): note is StaffSlot => isStaffSlot(note as StaffSlot),
        getChronaxie: (note) => getSlotLayoutChronaxie(note as StaffSlot),
        getNoteWidthRatio: (note) => getNoteHeadColumnWidthRatio(note as StaffSlot, skin, measureHeight),
        getExtraOnsetRatios: (note, slotOnset) =>
            getGuitarTabExtraOnsetRatios(note as StaffSlot, skin).map((e) => ({
                onset: slotOnset + e.onsetOffset,
                ratio: e.ratio,
            })),
    };
}
