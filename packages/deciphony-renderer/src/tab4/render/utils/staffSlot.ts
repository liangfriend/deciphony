import type {NoteNumber, NoteRest, NoteSymbol, StaffSlot} from '@/types/MusicScoreType';
import {NoteSymbolTypeEnum} from '@/enums/musicScoreEnum';

export function isNoteRest(slot: StaffSlot | NoteNumber): slot is NoteRest {
  return 'type' in slot && slot.type === NoteSymbolTypeEnum.Rest;
}

export function isNoteSymbol(slot: StaffSlot | NoteNumber): slot is NoteSymbol {
  return 'type' in slot && slot.type === NoteSymbolTypeEnum.Note;
}

export function isStaffSlot(slot: StaffSlot | NoteNumber): slot is StaffSlot {
  return isNoteSymbol(slot) || isNoteRest(slot);
}
