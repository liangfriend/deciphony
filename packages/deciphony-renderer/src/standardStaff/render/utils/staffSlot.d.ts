import type { NoteNumber, NoteRest, NoteSymbol, StaffSlot } from '@/types/MusicScoreType';
export declare function isNoteRest(slot: StaffSlot | NoteNumber): slot is NoteRest;
export declare function isNoteSymbol(slot: StaffSlot | NoteNumber): slot is NoteSymbol;
export declare function isStaffSlot(slot: StaffSlot | NoteNumber): slot is StaffSlot;
