import {isNoteRest, isNoteSymbol} from 'deciphony-renderer';
import type {MusicScore, NoteNumber, NotesInfo, NoteSymbol, StaffSlot} from 'deciphony-renderer';
import type {
  GrandStaffPath,
  LocatedGrandStaff,
  LocatedMeasure,
  LocatedNoteSlot,
  LocatedNotesInfo,
  LocatedSingleStaff,
  MeasurePath,
  NotePath,
  NotesInfoPath,
  SingleStaffPath,
} from './types';
import {assertIndex} from './id';

// —— 按索引解析（越界抛错）——

export function resolveGrandStaff(score: MusicScore, path: GrandStaffPath) {
  assertIndex('grandStaffIndex', path.grandStaffIndex, score.grandStaffs.length);
  return score.grandStaffs[path.grandStaffIndex]!;
}

export function resolveSingleStaff(score: MusicScore, path: SingleStaffPath) {
  const gs = resolveGrandStaff(score, path);
  assertIndex('singleStaffIndex', path.singleStaffIndex, gs.staves.length);
  return gs.staves[path.singleStaffIndex]!;
}

export function resolveMeasure(score: MusicScore, path: MeasurePath) {
  const staff = resolveSingleStaff(score, path);
  assertIndex('measureIndex', path.measureIndex, staff.measures.length);
  return staff.measures[path.measureIndex]!;
}

export function resolveNoteSlot(score: MusicScore, path: NotePath): StaffSlot | NoteNumber {
  const measure = resolveMeasure(score, path);
  assertIndex('noteIndex', path.noteIndex, measure.notes.length);
  return measure.notes[path.noteIndex]!;
}

export function resolveNoteSymbol(score: MusicScore, path: NotePath): NoteSymbol {
  const slot = resolveNoteSlot(score, path);
  if (!isNoteSymbol(slot)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是五线谱 NoteSymbol`);
  }
  return slot;
}

export function resolveNoteRest(score: MusicScore, path: NotePath): import('deciphony-renderer').NoteRest {
  const slot = resolveNoteSlot(score, path);
  if (!isNoteRest(slot)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是 NoteRest`);
  }
  return slot;
}

export function isNoteNumberSlot(slot: StaffSlot | NoteNumber): slot is NoteNumber {
  return !('type' in slot);
}

export function resolveNoteNumber(score: MusicScore, path: NotePath): NoteNumber {
  const slot = resolveNoteSlot(score, path);
  if (!isNoteNumberSlot(slot)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是简谱 NoteNumber`);
  }
  return slot;
}

export function resolveNotesInfo(score: MusicScore, path: NotesInfoPath): NotesInfo {
  const note = resolveNoteSymbol(score, path);
  assertIndex('notesInfoIndex', path.notesInfoIndex, note.notesInfo.length);
  return note.notesInfo[path.notesInfoIndex]!;
}

// —— 按引用定位（编辑 UI 锚点）——

export function indexOfGrandStaff(score: MusicScore, target: import('deciphony-renderer').GrandStaff): number {
  return score.grandStaffs.indexOf(target);
}

export function indexOfSingleStaff(
  grandStaff: import('deciphony-renderer').GrandStaff,
  target: import('deciphony-renderer').SingleStaff,
): number {
  return grandStaff.staves.indexOf(target);
}

export function indexOfMeasure(
  singleStaff: import('deciphony-renderer').SingleStaff,
  target: import('deciphony-renderer').Measure,
): number {
  return singleStaff.measures.indexOf(target);
}

export function indexOfNoteSlot(
  measure: import('deciphony-renderer').Measure,
  target: StaffSlot | NoteNumber,
): number {
  return measure.notes.indexOf(target);
}

export function locateGrandStaff(score: MusicScore, target: import('deciphony-renderer').GrandStaff): LocatedGrandStaff | null {
  const grandStaffIndex = indexOfGrandStaff(score, target);
  if (grandStaffIndex < 0) return null;
  return {grandStaffIndex, grandStaff: target};
}

export function locateSingleStaff(
  score: MusicScore,
  target: import('deciphony-renderer').SingleStaff,
): LocatedSingleStaff | null {
  for (let grandStaffIndex = 0; grandStaffIndex < score.grandStaffs.length; grandStaffIndex++) {
    const grandStaff = score.grandStaffs[grandStaffIndex]!;
    const singleStaffIndex = indexOfSingleStaff(grandStaff, target);
    if (singleStaffIndex >= 0) {
      return {grandStaffIndex, singleStaffIndex, grandStaff, singleStaff: target};
    }
  }
  return null;
}

export function locateMeasure(
  score: MusicScore,
  target: import('deciphony-renderer').Measure,
): LocatedMeasure | null {
  for (const gs of score.grandStaffs) {
    for (const staff of gs.staves) {
      const measureIndex = indexOfMeasure(staff, target);
      if (measureIndex >= 0) {
        const located = locateSingleStaff(score, staff);
        if (!located) continue;
        return {
          ...located,
          measureIndex,
          measure: target,
        };
      }
    }
  }
  return null;
}

export function locateNoteSlot(
  score: MusicScore,
  target: StaffSlot | NoteNumber,
): LocatedNoteSlot | null {
  for (const gs of score.grandStaffs) {
    for (const staff of gs.staves) {
      for (const measure of staff.measures) {
        const noteIndex = indexOfNoteSlot(measure, target);
        if (noteIndex >= 0) {
          const located = locateMeasure(score, measure);
          if (!located) continue;
          return {...located, noteIndex, slot: target};
        }
      }
    }
  }
  return null;
}

/** 按 NotesInfo.id 查找（slur 端点、播放序列等均须用此 id） */
export function locateNotesInfoById(
  score: MusicScore,
  notesInfoId: string,
): LocatedNotesInfo | null {
  for (const gs of score.grandStaffs) {
    for (const staff of gs.staves) {
      for (const measure of staff.measures) {
        for (let noteIndex = 0; noteIndex < measure.notes.length; noteIndex++) {
          const slot = measure.notes[noteIndex]!;
          if (!isNoteSymbol(slot)) continue;
          const tryList = [
            ...slot.notesInfo,
            ...(slot.graceNotes ?? []),
            ...(slot.graceNotesAfter ?? []),
          ];
          const idx = tryList.findIndex((ni) => ni.id === notesInfoId);
          if (idx < 0) continue;
          const notesInfoIndex = slot.notesInfo.findIndex((ni) => ni.id === notesInfoId);
          if (notesInfoIndex < 0) continue;
          return {
            grandStaffIndex: indexOfGrandStaff(score, gs),
            singleStaffIndex: indexOfSingleStaff(gs, staff),
            measureIndex: indexOfMeasure(staff, measure),
            noteIndex,
            notesInfoIndex,
            grandStaff: gs,
            singleStaff: staff,
            measure,
            note: slot,
            notesInfo: slot.notesInfo[notesInfoIndex]!,
          };
        }
      }
    }
  }
  return null;
}
