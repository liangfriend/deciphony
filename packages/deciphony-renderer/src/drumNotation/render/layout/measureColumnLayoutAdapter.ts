import type {Measure, MeasureNoteSlot} from '@/types/MusicScoreType';
import type {DrumNotationSkinPack} from '@/types/common';
import {
  buildLinkedMeasureColumnLayouts,
  countMergedOnsetColumns,
  mergedMeasureWidthRatio,
  type ColumnLayoutSlotAdapter,
} from '@/render/layout/measureColumnLayout';
import {getMeasureVoices} from '@/utils/measureNotes';
import type {DrumMeasureColumnLayout, DrumVoice, LongRestRole} from '../types';
import {getMeasureWidthRatio, getNoteWidthRatio, getSlotLayoutChronaxie} from '../utils/note';
import {isDrumSlot, slotSymbol} from '../utils/staffSlot';
import {getPrefixParts, getSuffixParts, sumPartsWidth} from '../utils/measureParts';

export function computeDrumMeasureFixedWidths(
  measure: Measure,
  skin: DrumNotationSkinPack,
  role?: LongRestRole | null,
): { prefixW: number; suffixW: number } {
  return {
    prefixW: sumPartsWidth(getPrefixParts(measure, role), skin),
    suffixW: sumPartsWidth(getSuffixParts(measure, role), skin),
  };
}

type VoiceSlot = { slot: MeasureNoteSlot; voice: DrumVoice };

/** 列布局按「声部 → 伪小节」处理：slot 统一包成 VoiceSlot，宽度按所在声部计算错位 */
export function createDrumColumnLayoutAdapter(skin: DrumNotationSkinPack): ColumnLayoutSlotAdapter {
  return {
    isLayoutSlot: (note) => isDrumSlot(slotSymbol((note as VoiceSlot).slot)),
    getChronaxie: (note) => getSlotLayoutChronaxie(slotSymbol((note as VoiceSlot).slot) as never),
    getNoteWidthRatio: (note) => getNoteWidthRatio((note as VoiceSlot).slot, (note as VoiceSlot).voice, skin),
  };
}

function voiceMeasure(measure: Measure, voice: DrumVoice): Measure {
  const slots = getMeasureVoices(measure)[voice];
  return {...measure, notes: slots.map((slot) => ({slot, voice}) as unknown as MeasureNoteSlot)};
}

/** 同一小节位置（连谱各谱表 / 非连谱单个）的宽度占比：上下声部合并 onset 列；长休止符小节不计列 */
export function drumMeasureWidthRatio(
  measures: (Measure | null | undefined)[],
  roles: (LongRestRole | null | undefined)[],
  skin: DrumNotationSkinPack,
): number {
  const adapter = createDrumColumnLayoutAdapter(skin);
  const voiceMeasures = measures.flatMap((m, i) =>
    m && !roles[i] ? [voiceMeasure(m, 'up'), voiceMeasure(m, 'down')] : []);
  return mergedMeasureWidthRatio(
    measures,
    adapter,
    (m, i) => getMeasureWidthRatio(m, skin, roles[i]),
    countMergedOnsetColumns(voiceMeasures, adapter),
  );
}

/**
 * 上下声部视作连谱：所有小节的所有声部一起合并 onset 列，列几何共用；
 * `measures[i]` 缺省（或长休止符）传 null，对应结果为 null。
 */
export function buildDrumColumnLayouts(
  measures: (Measure | null | undefined)[],
  noteDomainW: number,
  noteDomainStartOffset: number,
  skin: DrumNotationSkinPack,
  measureHeight: number,
): (DrumMeasureColumnLayout | null)[] {
  const voiceMeasures: (Measure | null)[] = [];
  for (const m of measures) {
    voiceMeasures.push(m ? voiceMeasure(m, 'up') : null, m ? voiceMeasure(m, 'down') : null);
  }
  const layouts = buildLinkedMeasureColumnLayouts(
    voiceMeasures,
    noteDomainW,
    noteDomainStartOffset,
    createDrumColumnLayoutAdapter(skin),
    measureHeight,
  );
  return measures.map((m, i) => {
    const up = layouts[i * 2];
    const down = layouts[i * 2 + 1];
    return m && up && down ? {up, down} : null;
  });
}
