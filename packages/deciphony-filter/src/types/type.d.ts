import {Midi, NoteName, NoteString} from "deciphony-core";
import {ChronaxieEnum, DotEnum} from "deciphony-core";

export type Base64 = string

export type ToneColor = Record<NoteString, Base64>;

export type ToneDuration = `${ChronaxieEnum}${DotEnum}`
export type ToneSequence = {
    type: 'note'
    midi: Midi,
    volume: number,// 0~1
    duration: ToneDuration,
} | {
    type: 'rest',
    duration: ToneDuration,
};