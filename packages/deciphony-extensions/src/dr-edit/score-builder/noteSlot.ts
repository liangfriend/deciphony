import {getMeasureNoteList, isNoteRest, isNoteSymbol, isNoteNumberSymbol, slotSymbol} from '@deciphony/renderer';
import type {Measure, MeasureNoteSlot, NoteNumber, NoteRest, NotesInfo, NoteSymbol, StaffSlot} from '@deciphony/renderer';
import {assertIndex} from './id';
import {createNoteNumber, createNoteRest, createNoteSymbol, createNotesInfo, createNotesNumberInfo} from './factories';
import {computeMeasureOnsetBefore} from './autoBeam';
import type {CreateNoteNumberOptions, CreateNoteRestOptions, CreateNoteSymbolOptions} from './types';

/** 在小节指定下标插入音符槽 */
export function insertNoteSlot(
    measure: Measure,
    at: number,
    slot: MeasureNoteSlot,
): MeasureNoteSlot {
    const notes = getMeasureNoteList(measure);
    assertIndex('noteIndex', at, notes.length + 1);
    notes.splice(at, 0, slot);
    return slot;
}

/** 移除小节内指定下标的音符槽 */
export function removeNoteSlot(measure: Measure, noteIndex: number): MeasureNoteSlot {
    const notes = getMeasureNoteList(measure);
    assertIndex('noteIndex', noteIndex, notes.length);
    const [removed] = notes.splice(noteIndex, 1);
    return removed!;
}

export function insertNoteSymbol(
    measure: Measure,
    at: number,
    options: CreateNoteSymbolOptions = {},
): MeasureNoteSlot {
    const withBeam =
        options.beamType != null || options.beamOnset != null
            ? options
            : {...options, beamOnset: computeMeasureOnsetBefore(measure, at)};
    return insertNoteSlot(measure, at, createNoteSymbol(withBeam));
}

export function insertNoteRest(
    measure: Measure,
    at: number,
    options: CreateNoteRestOptions = {},
): MeasureNoteSlot {
    return insertNoteSlot(measure, at, createNoteRest(options));
}

export function insertNoteNumber(
    measure: Measure,
    at: number,
    options: CreateNoteNumberOptions,
): MeasureNoteSlot {
    const withBeam =
        options.beamType != null || options.beamOnset != null
            ? options
            : {...options, beamOnset: computeMeasureOnsetBefore(measure, at)};
    return insertNoteSlot(measure, at, createNoteNumber(withBeam));
}

/** 向已有简谱 NoteNumber 追加一个声部（NotesNumberInfo） */
export function appendNotesNumberInfo(
    note: NoteNumber,
    syllable: NoteNumber['notesInfo'][number]['syllable'],
    partial?: Parameters<typeof createNotesNumberInfo>[1],
): NoteNumber['notesInfo'][number] {
    const lead = note.notesInfo[0]
    const info = createNotesNumberInfo(syllable, {
        chronaxie: lead?.chronaxie,
        beamType: lead?.beamType,
        ...partial,
    });
    note.notesInfo.push(info);
    return info;
}

/** 向已有五线谱 NoteSymbol 追加一个音符头（NotesInfo） */
export function appendNotesInfo(
    note: NoteSymbol,
    region: number,
    partial?: Omit<Parameters<typeof createNotesInfo>[0], 'region'>,
): NotesInfo {
    const lead = note.notesInfo[0]
    const info = createNotesInfo({
        region,
        chronaxie: lead?.chronaxie,
        beamType: lead?.beamType,
        direction: lead?.direction,
        ...partial,
    });
    note.notesInfo.push(info);
    return info;
}

export function isNoteNumberSlot(slot: MeasureNoteSlot | StaffSlot | NoteNumber): boolean {
    if ('symbol' in slot) return isNoteNumberSymbol(slot.symbol);
    return isNoteNumberSymbol(slot);
}

export function isSlotRestLike(slot: MeasureNoteSlot | StaffSlot | NoteNumber): boolean {
    const body = 'symbol' in slot ? slot.symbol : slot;
    if (isNoteRest(body)) return true;
    if (isNoteNumberSymbol(body)) {
        return !body.notesInfo.length || body.notesInfo.every((ni) => ni.syllable === 0);
    }
    return false;
}

export function isSlotNoteLike(slot: MeasureNoteSlot | StaffSlot | NoteNumber): boolean {
    const body = 'symbol' in slot ? slot.symbol : slot;
    return isNoteSymbol(body) || (isNoteNumberSymbol(body) && !isSlotRestLike(slot));
}

/** 取槽内五线 NoteSymbol（否则 null） */
export function slotNoteSymbol(slot: MeasureNoteSlot): NoteSymbol | null {
    const body = slotSymbol(slot);
    return isNoteSymbol(body) ? body : null;
}
