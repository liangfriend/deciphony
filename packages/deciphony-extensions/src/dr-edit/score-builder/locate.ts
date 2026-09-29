import {
  getMeasureNoteList,
  getMeasureSlots,
  isNoteNumberSymbol,
  isNoteRest,
  isNoteSymbol,
  slotSymbol,
} from '@deciphony/renderer';
import type {
  MeasureNoteSlot,
  MusicScore,
  NoteNumber,
  NotesInfo,
  NotesNumberInfo,
  NoteSymbol,
} from '@deciphony/renderer';
import type {
  GrandStaffPath,
  LocatedGrandStaff,
  LocatedMeasure,
  LocatedNoteSlot,
  LocatedNotesInfo,
  LocatedNotesNumberInfo,
  LocatedSingleStaff,
  LocatedSlotAffiliatedSymbol,
  MeasurePath,
  NotePath,
  NotesInfoPath,
  NotesNumberInfoPath,
  SingleStaffPath,
} from './types';
import {assertIndex} from './id';
import {isNoteNumberSlot as isMeasureNoteNumberSlot} from './noteSlot';

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

export function resolveNoteSlot(score: MusicScore, path: NotePath): MeasureNoteSlot {
  const notes = getMeasureNoteList(resolveMeasure(score, path));
  assertIndex('noteIndex', path.noteIndex, notes.length);
  return notes[path.noteIndex]!;
}

export function resolveNoteSymbol(score: MusicScore, path: NotePath): NoteSymbol {
  const body = slotSymbol(resolveNoteSlot(score, path));
  if (!isNoteSymbol(body)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是五线谱 NoteSymbol`);
  }
  return body;
}

export function resolveNoteRest(score: MusicScore, path: NotePath): import('@deciphony/renderer').NoteRest {
  const body = slotSymbol(resolveNoteSlot(score, path));
  if (!isNoteRest(body)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是 NoteRest`);
  }
  return body;
}

export function isNoteNumberSlot(slot: MeasureNoteSlot): slot is MeasureNoteSlot & {symbol: NoteNumber} {
  return isNoteNumberSymbol(slot.symbol);
}

export function resolveNoteNumber(score: MusicScore, path: NotePath): NoteNumber {
  const body = slotSymbol(resolveNoteSlot(score, path));
  if (!isNoteNumberSymbol(body)) {
    throw new TypeError(`notes[${path.noteIndex}] 不是简谱 NoteNumber`);
  }
  return body;
}

export function resolveNotesInfo(score: MusicScore, path: NotesInfoPath): NotesInfo {
  const note = resolveNoteSymbol(score, path);
  assertIndex('notesInfoIndex', path.notesInfoIndex, note.notesInfo.length);
  return note.notesInfo[path.notesInfoIndex]!;
}

export function resolveNotesNumberInfo(score: MusicScore, path: NotesNumberInfoPath): NotesNumberInfo {
  const note = resolveNoteNumber(score, path);
  assertIndex('notesNumberInfoIndex', path.notesNumberInfoIndex, note.notesInfo.length);
  return note.notesInfo[path.notesNumberInfoIndex]!;
}

// —— 按引用定位（编辑 UI 锚点）——

export function indexOfGrandStaff(score: MusicScore, target: import('@deciphony/renderer').GrandStaff): number {
  return score.grandStaffs.indexOf(target);
}

export function indexOfSingleStaff(
  grandStaff: import('@deciphony/renderer').GrandStaff,
  target: import('@deciphony/renderer').SingleStaff,
): number {
  return grandStaff.staves.indexOf(target);
}

export function indexOfMeasure(
  singleStaff: import('@deciphony/renderer').SingleStaff,
  target: import('@deciphony/renderer').Measure,
): number {
  return singleStaff.measures.indexOf(target);
}

export function indexOfNoteSlot(
  measure: import('@deciphony/renderer').Measure,
  target: MeasureNoteSlot,
): number {
  return getMeasureNoteList(measure).indexOf(target);
}

export function locateGrandStaff(score: MusicScore, target: import('@deciphony/renderer').GrandStaff): LocatedGrandStaff | null {
  const grandStaffIndex = indexOfGrandStaff(score, target);
  if (grandStaffIndex < 0) return null;
  return {grandStaffIndex, grandStaff: target};
}

export function locateSingleStaff(
  score: MusicScore,
  target: import('@deciphony/renderer').SingleStaff,
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
  target: import('@deciphony/renderer').Measure,
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
  target: MeasureNoteSlot,
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

/** 按 id 查找单 slot 附属（琶音 / 扫弦），连同宿主 slot 一并返回 */
export function locateSlotAffiliatedSymbolById(
  score: MusicScore,
  symbolId: string,
): LocatedSlotAffiliatedSymbol | null {
  for (const gs of score.grandStaffs) {
    for (const staff of gs.staves) {
      for (const measure of staff.measures) {
        const slots = getMeasureSlots(measure);
        for (let noteIndex = 0; noteIndex < slots.length; noteIndex++) {
          const slot = slots[noteIndex]!;
          const symbolIndex = slot.affiliatedSymbols?.findIndex((sym) => sym.id === symbolId) ?? -1;
          if (symbolIndex < 0) continue;
          const located = locateMeasure(score, measure);
          if (!located) return null;
          return {...located, noteIndex, slot, symbolIndex, symbol: slot.affiliatedSymbols![symbolIndex]!};
        }
      }
    }
  }
  return null;
}

/** 按 NotesNumberInfo.id 查找（简谱 slur 端点等；含前后倚音） */
export function locateNotesNumberInfoById(
  score: MusicScore,
  notesNumberInfoId: string,
): LocatedNotesNumberInfo | null {
  for (const gs of score.grandStaffs) {
    for (const staff of gs.staves) {
      for (const measure of staff.measures) {
        const notes = getMeasureNoteList(measure);
        for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
          const measureSlot = notes[noteIndex]!;
          if (!isMeasureNoteNumberSlot(measureSlot)) continue;
          const note = slotSymbol(measureSlot) as NoteNumber;
          const lists = [
            note.notesInfo,
            note.graceNotes ?? [],
            note.graceNotesAfter ?? [],
          ];
          for (const list of lists) {
            const idx = list.findIndex((ni) => ni.id === notesNumberInfoId);
            if (idx < 0) continue;
            return {
              grandStaffIndex: indexOfGrandStaff(score, gs),
              singleStaffIndex: indexOfSingleStaff(gs, staff),
              measureIndex: indexOfMeasure(staff, measure),
              noteIndex,
              notesNumberInfoIndex: idx,
              grandStaff: gs,
              singleStaff: staff,
              measure,
              note,
              notesNumberInfo: list[idx]!,
            };
          }
        }
      }
    }
  }
  return null;
}

/** 按 NotesInfo.id 查找（slur 端点、播放序列等均须用此 id；含前后倚音） */
export function locateNotesInfoById(
  score: MusicScore,
  notesInfoId: string,
): LocatedNotesInfo | null {
  for (const gs of score.grandStaffs) {
    for (const staff of gs.staves) {
      for (const measure of staff.measures) {
        const notes = getMeasureNoteList(measure);
        for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
          const measureSlot = notes[noteIndex]!;
          const slot = slotSymbol(measureSlot);
          if (!isNoteSymbol(slot)) continue;
          const lists = [
            slot.notesInfo,
            slot.graceNotes ?? [],
            slot.graceNotesAfter ?? [],
          ];
          for (const list of lists) {
            const idx = list.findIndex((ni) => ni.id === notesInfoId);
            if (idx < 0) continue;
            return {
              grandStaffIndex: indexOfGrandStaff(score, gs),
              singleStaffIndex: indexOfSingleStaff(gs, staff),
              measureIndex: indexOfMeasure(staff, measure),
              noteIndex,
              notesInfoIndex: idx,
              grandStaff: gs,
              singleStaff: staff,
              measure,
              note: slot,
              notesInfo: list[idx]!,
            };
          }
        }
      }
    }
  }
  return null;
}
