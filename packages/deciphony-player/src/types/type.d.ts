import {Midi, NoteName, NoteString} from "deciphony-core/types";
import {ChronaxieEnum, DotEnum} from "deciphony-core/enum";

export type Base64 = string

export type ToneColor = Record<NoteString, Base64>;


export type ToneSequence = {
    type: 'note'
    midi: Midi,
    volume: number,// 0~1
    duration: `${ChronaxieEnum}${DotEnum}`,
} | {
    type: 'rest'
};