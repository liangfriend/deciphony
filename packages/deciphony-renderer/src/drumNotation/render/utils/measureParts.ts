import type {Frame, VDom} from '@/types/common';
import type {Measure} from '@/types/MusicScoreType';
import {DrumNotationSkinKeyEnum} from '@/drumNotation/enums/drumNotationSkinKeyEnum';
import type {LongRestRole} from '../types';
import {longRestShowsPrefix, longRestShowsSuffix} from './longRest';
import {getBarlineSkinKey, getClefSkinKey, getKeySignatureSkinKey, getTimeSignatureSkinKey} from './skinKey';

/** 小节前后置定宽符号（谱号 / 调号 / 拍号 / 小节线） */
export type MeasurePart = {
  skinKey: DrumNotationSkinKeyEnum;
  tag: VDom['tag'];
  dataComment: string;
  targetId: string;
  data: Partial<Frame>;
};

/** 前置符号，顺序：谱号 → 调号 → 拍号 → 前置小节线；长休止符组内非组首不渲染 */
export function getPrefixParts(measure: Measure, role?: LongRestRole | null): MeasurePart[] {
  if (!longRestShowsPrefix(role)) return [];
  const parts: MeasurePart[] = [];
  if (measure.clef_f) {
    parts.push({
      skinKey: getClefSkinKey(measure.clef_f.type, true),
      tag: 'clef_f',
      dataComment: '前置谱号',
      targetId: measure.clef_f.id ?? '',
      data: measure.clef_f,
    });
  }
  if (measure.keySignature_f) {
    parts.push({
      skinKey: getKeySignatureSkinKey(measure.keySignature_f.type),
      tag: 'keySignature_f',
      dataComment: '前置调号',
      targetId: measure.keySignature_f.id ?? '',
      data: measure.keySignature_f,
    });
  }
  if (measure.timeSignature_f) {
    parts.push({
      skinKey: getTimeSignatureSkinKey(measure.timeSignature_f.type),
      tag: 'timeSignature_f',
      dataComment: '前置拍号',
      targetId: measure.timeSignature_f.id ?? '',
      data: measure.timeSignature_f,
    });
  }
  if (measure.barline_f) {
    parts.push({
      skinKey: getBarlineSkinKey(measure.barline_f.type),
      tag: 'barline_f',
      dataComment: '前置小节线',
      targetId: measure.barline_f.id ?? '',
      data: measure.barline_f,
    });
  }
  return parts;
}

/** 后置符号，顺序：后置小节线 → 谱号 → 调号 → 拍号；长休止符组内非组尾不渲染 */
export function getSuffixParts(measure: Measure, role?: LongRestRole | null): MeasurePart[] {
  if (!longRestShowsSuffix(role)) return [];
  const parts: MeasurePart[] = [];
  if (measure.barline_b) {
    parts.push({
      skinKey: getBarlineSkinKey(measure.barline_b.type),
      tag: 'barline_b',
      dataComment: '后置小节线',
      targetId: measure.barline_b.id ?? '',
      data: measure.barline_b,
    });
  }
  if (measure.clef_b) {
    parts.push({
      skinKey: getClefSkinKey(measure.clef_b.type, false),
      tag: 'clef_b',
      dataComment: '后置谱号',
      targetId: measure.clef_b.id ?? '',
      data: measure.clef_b,
    });
  }
  if (measure.keySignature_b) {
    parts.push({
      skinKey: getKeySignatureSkinKey(measure.keySignature_b.type),
      tag: 'keySignature_b',
      dataComment: '后置调号',
      targetId: measure.keySignature_b.id ?? '',
      data: measure.keySignature_b,
    });
  }
  if (measure.timeSignature_b) {
    parts.push({
      skinKey: getTimeSignatureSkinKey(measure.timeSignature_b.type),
      tag: 'timeSignature_b',
      dataComment: '后置拍号',
      targetId: measure.timeSignature_b.id ?? '',
      data: measure.timeSignature_b,
    });
  }
  return parts;
}

export function sumPartsWidth(parts: MeasurePart[], skin: Record<string, { w: number } | undefined>): number {
  let w = 0;
  for (const p of parts) w += skin[p.skinKey]?.w ?? 0;
  return w;
}
