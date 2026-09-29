import type {DrumNote, DrumRest, DrumSlot, MeasureNoteSlot, MeasureNoteSymbol} from '@/types/MusicScoreType';
import {NoteSymbolTypeEnum} from '@/enums/musicScoreEnum';

/** 取槽内记谱体 */
export function slotSymbol(slot: MeasureNoteSlot): MeasureNoteSymbol {
  return slot.symbol;
}

export function isDrumRest(sym: MeasureNoteSymbol): sym is DrumRest {
  return 'type' in sym && sym.type === NoteSymbolTypeEnum.Rest;
}

export function isDrumNote(sym: MeasureNoteSymbol): sym is DrumNote {
  return 'type' in sym && sym.type === NoteSymbolTypeEnum.Note;
}

export function isDrumSlot(sym: MeasureNoteSymbol): sym is DrumSlot {
  return isDrumNote(sym) || isDrumRest(sym);
}

export function slotIsDrumSlot(slot: MeasureNoteSlot): boolean {
  return isDrumSlot(slot.symbol);
}
