import {isNoteRest, isNoteSymbol} from 'deciphony-renderer';
import type {Measure, NoteNumber, NoteRest, NotesInfo, NoteSymbol, StaffSlot} from 'deciphony-renderer';
import {assertIndex} from './id';
import {createNoteNumber, createNoteRest, createNoteSymbol, createNotesInfo, createNotesNumberInfo} from './factories';
import type {CreateNoteNumberOptions, CreateNoteRestOptions, CreateNoteSymbolOptions} from './types';

/** 在小节指定下标插入音符位（五线谱 NoteSymbol/NoteRest 或简谱 NoteNumber） */
export function insertNoteSlot(
    measure: Measure,
    at: number,
    slot: StaffSlot | NoteNumber,
): StaffSlot | NoteNumber {
    assertIndex('noteIndex', at, measure.notes.length + 1);
    measure.notes.splice(at, 0, slot);
    return slot;
}

/** 移除小节内指定下标的音符位 */
export function removeNoteSlot(measure: Measure, noteIndex: number): StaffSlot | NoteNumber {
    assertIndex('noteIndex', noteIndex, measure.notes.length);
    const [removed] = measure.notes.splice(noteIndex, 1);
    return removed!;
}

export function insertNoteSymbol(
    measure: Measure,
    at: number,
    options: CreateNoteSymbolOptions = {},
): NoteSymbol {
    return insertNoteSlot(measure, at, createNoteSymbol(options)) as NoteSymbol;
}

export function insertNoteRest(
    measure: Measure,
    at: number,
    options: CreateNoteRestOptions = {},
): NoteRest {
    return insertNoteSlot(measure, at, createNoteRest(options)) as NoteRest;
}

export function insertNoteNumber(
    measure: Measure,
    at: number,
    options: CreateNoteNumberOptions,
): NoteNumber {
    return insertNoteSlot(measure, at, createNoteNumber(options)) as NoteNumber;
}

/** 向已有简谱 NoteNumber 追加一个声部（NotesNumberInfo） */
export function appendNotesNumberInfo(
    note: NoteNumber,
    syllable: NoteNumber['notesInfo'][number]['syllable'],
    partial?: Parameters<typeof createNotesNumberInfo>[1],
): NoteNumber['notesInfo'][number] {
    const info = createNotesNumberInfo(syllable, partial);
    note.notesInfo.push(info);
    return info;
}

/** 向已有五线谱 NoteSymbol 追加一个音符头（NotesInfo） */
export function appendNotesInfo(
    note: NoteSymbol,
    region: number,
    partial?: Omit<Parameters<typeof createNotesInfo>[0], 'region'>,
): NotesInfo {
    const info = createNotesInfo({region, ...partial});
    note.notesInfo.push(info);
    return info;
}

export function isNoteNumberSlot(slot: StaffSlot | NoteNumber): slot is NoteNumber {
    return !('type' in slot);
}

export function isSlotRestLike(slot: StaffSlot | NoteNumber): boolean {
    if (isNoteRest(slot)) return true;
    if (isNoteNumberSlot(slot)) {
        return !slot.notesInfo.length || slot.notesInfo.every((ni) => ni.syllable === 0);
    }
    return false;
}

export function isSlotNoteLike(slot: StaffSlot | NoteNumber): slot is NoteSymbol | NoteNumber {
    if (isNoteSymbol(slot)) return true;
    return isNoteNumberSlot(slot) && !isSlotRestLike(slot);
}
