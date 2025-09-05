import {Midi, NoteName, NoteString} from "deciphony-core/types";

export type Base64 = string

export type ToneColor = Record<NoteString, Base64>;

export type ToneSequence = {
    midi:Midi,

};