import { NoteSymbolTypeEnum } from '@/enums/musicScoreEnum';
export function isNoteRest(slot) {
    return 'type' in slot && slot.type === NoteSymbolTypeEnum.Rest;
}
export function isNoteSymbol(slot) {
    return 'type' in slot && slot.type === NoteSymbolTypeEnum.Note;
}
export function isStaffSlot(slot) {
    return isNoteSymbol(slot) || isNoteRest(slot);
}
