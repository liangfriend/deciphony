import type {GrandStaff, Measure, MusicScore, SingleStaff} from 'deciphony-renderer';
import {
  indexOfGrandStaff,
  indexOfMeasure,
  indexOfSingleStaff,
  insertGrandStaff as spliceGrandStaff,
  insertSingleStaff as spliceSingleStaff,
  insertMeasure as spliceMeasure,
  removeGrandStaff,
  removeMeasure,
  removeSingleStaff,
} from './score-builder';

// =================================复谱表（挂在曲谱上，需要 score）========================================

export function addGrandStaff(score: MusicScore): GrandStaff {
  return spliceGrandStaff(score, score.grandStaffs.length);
}

export function insertGrandStaff(
  score: MusicScore,
  anchor: GrandStaff,
  position: 'before' | 'after',
): GrandStaff {
  const idx = indexOfGrandStaff(score, anchor);
  if (idx < 0) throw new Error('复谱表不属于该曲谱');
  const at = position === 'before' ? idx : idx + 1;
  return spliceGrandStaff(score, at);
}

export function deleteGrandStaff(score: MusicScore, target: GrandStaff): void {
  const idx = indexOfGrandStaff(score, target);
  if (idx < 0) throw new Error('复谱表不属于该曲谱');
  removeGrandStaff(score, idx);
}

// =================================单谱表（挂在复谱表上）========================================

export function addSingleStaff(grandStaff: GrandStaff): SingleStaff {
  return spliceSingleStaff(grandStaff, grandStaff.staves.length);
}

export function insertSingleStaff(
  grandStaff: GrandStaff,
  anchor: SingleStaff,
  position: 'before' | 'after',
): SingleStaff {
  const idx = indexOfSingleStaff(grandStaff, anchor);
  if (idx < 0) throw new Error('单谱表不属于该复谱表');
  const at = position === 'before' ? idx : idx + 1;
  return spliceSingleStaff(grandStaff, at);
}

export function deleteSingleStaff(grandStaff: GrandStaff, target: SingleStaff): void {
  const idx = indexOfSingleStaff(grandStaff, target);
  if (idx < 0) throw new Error('单谱表不属于该复谱表');
  removeSingleStaff(grandStaff, idx);
}

// =================================小节（挂在单谱表上）========================================

export function addMeasure(singleStaff: SingleStaff): Measure {
  return spliceMeasure(singleStaff, singleStaff.measures.length);
}

export function insertMeasure(
  singleStaff: SingleStaff,
  anchor: Measure,
  position: 'before' | 'after',
): Measure {
  const idx = indexOfMeasure(singleStaff, anchor);
  if (idx < 0) throw new Error('小节不属于该单谱表');
  const at = position === 'before' ? idx : idx + 1;
  return spliceMeasure(singleStaff, at);
}

export function deleteMeasure(singleStaff: SingleStaff, target: Measure): void {
  const idx = indexOfMeasure(singleStaff, target);
  if (idx < 0) throw new Error('小节不属于该单谱表');
  removeMeasure(singleStaff, idx);
}

// =================================音符操作========================================
// 音符编辑较特殊，后续单独实现
