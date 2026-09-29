import type {
  MeasureNoteSlot,
  MeasureNoteSymbol,
  NoteNumber,
  NoteRest,
  NoteSymbol,
  StaffSlot,
} from '@/types/MusicScoreType';
import {NoteSymbolTypeEnum} from '@/enums/musicScoreEnum';

/** 取槽内记谱体 */
export function slotSymbol(slot: MeasureNoteSlot): MeasureNoteSymbol {
  return slot.symbol;
}

export function isNoteRest(slot: StaffSlot | NoteNumber | MeasureNoteSymbol): slot is NoteRest {
  return 'type' in slot && slot.type === NoteSymbolTypeEnum.Rest;
}

export function isNoteSymbol(slot: StaffSlot | NoteNumber | MeasureNoteSymbol): slot is NoteSymbol {
  return 'type' in slot && slot.type === NoteSymbolTypeEnum.Note;
}

export function isStaffSlot(slot: StaffSlot | NoteNumber | MeasureNoteSymbol): slot is StaffSlot {
  return isNoteSymbol(slot) || isNoteRest(slot);
}

export function isNoteNumberSymbol(slot: StaffSlot | NoteNumber | MeasureNoteSymbol): slot is NoteNumber {
  return !('type' in slot);
}

export function slotIsNoteSymbol(slot: MeasureNoteSlot): boolean {
  return isNoteSymbol(slot.symbol);
}

export function slotIsNoteRest(slot: MeasureNoteSlot): boolean {
  return isNoteRest(slot.symbol);
}

export function slotIsNoteNumber(slot: MeasureNoteSlot): boolean {
  return isNoteNumberSymbol(slot.symbol);
}
