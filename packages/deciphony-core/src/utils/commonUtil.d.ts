import { NoteName, NoteString } from "../types";
export declare function hzToMidi(hz: number): {
    midi: number;
    noteName: NoteName;
    noteString: NoteString;
};
