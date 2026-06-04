import {ClefTypeEnum, TimeSignatureTypeEnum} from 'deciphony-renderer';
import type {GrandStaff, Measure, MusicScore, SingleStaff} from 'deciphony-renderer';
import {assertIndex} from './id';
import {
  cloneMeasureHeaderFromPrev,
  createGrandStaff,
  createMeasure,
  createSingleStaff,
} from './factories';

/** 在曲谱指定下标插入复谱表 */
export function insertGrandStaff(score: MusicScore, at: number): GrandStaff {
  assertIndex('grandStaffIndex', at, score.grandStaffs.length + 1);
  const staff = createGrandStaff();
  score.grandStaffs.splice(at, 0, staff);
  return staff;
}

/** 在复谱表指定下标插入单谱表 */
export function insertSingleStaff(grandStaff: GrandStaff, at: number): SingleStaff {
  assertIndex('singleStaffIndex', at, grandStaff.staves.length + 1);
  const singleStaff = createSingleStaff();
  grandStaff.staves.splice(at, 0, singleStaff);
  return singleStaff;
}

function newMeasureForInsert(singleStaff: SingleStaff, at: number): Measure {
  let measure = createMeasure(
    at === 0 && singleStaff.measures.length === 0
      ? {clef: ClefTypeEnum.Treble, timeSignature: TimeSignatureTypeEnum['4_4']}
      : {},
  );

  if (at > 0) {
    const header = cloneMeasureHeaderFromPrev(singleStaff.measures[at - 1]!);
    if (!measure.clef_f && header.clef_f) measure.clef_f = header.clef_f;
    if (!measure.timeSignature_f && header.timeSignature_f) {
      measure.timeSignature_f = header.timeSignature_f;
    }
    if (!measure.keySignature_f && header.keySignature_f) {
      measure.keySignature_f = header.keySignature_f;
    }
  }

  return measure;
}

/** 在单谱表指定下标插入小节 */
export function insertMeasure(singleStaff: SingleStaff, at: number): Measure {
  assertIndex('measureIndex', at, singleStaff.measures.length + 1);
  const measure = newMeasureForInsert(singleStaff, at);
  singleStaff.measures.splice(at, 0, measure);
  return measure;
}
