import type {GrandStaff, SingleStaff} from 'deciphony-renderer';
import type {MusicScore} from 'deciphony-renderer';
import {assertIndex} from './id';

export function removeGrandStaff(score: MusicScore, grandStaffIndex: number): void {
  assertIndex('grandStaffIndex', grandStaffIndex, score.grandStaffs.length);
  score.grandStaffs.splice(grandStaffIndex, 1);
}

export function removeSingleStaff(grandStaff: GrandStaff, singleStaffIndex: number): void {
  assertIndex('singleStaffIndex', singleStaffIndex, grandStaff.staves.length);
  grandStaff.staves.splice(singleStaffIndex, 1);
}

export function removeMeasure(singleStaff: SingleStaff, measureIndex: number): void {
  assertIndex('measureIndex', measureIndex, singleStaff.measures.length);
  singleStaff.measures.splice(measureIndex, 1);
}
