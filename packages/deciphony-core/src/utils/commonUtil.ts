import {NoteName, NoteString} from "../types";
import {AccidentalEnum, NoteLetterEnum} from "../musicScoreEnum";

// MIDI 到音名映射 (C 大调，含升号优先)
const NOTE_TABLE: { letter: NoteLetterEnum; accidental: AccidentalEnum }[] = [
    {letter: NoteLetterEnum.C, accidental: AccidentalEnum.Natural},
    {letter: NoteLetterEnum.C, accidental: AccidentalEnum.Sharp},
    {letter: NoteLetterEnum.D, accidental: AccidentalEnum.Natural},
    {letter: NoteLetterEnum.D, accidental: AccidentalEnum.Sharp},
    {letter: NoteLetterEnum.E, accidental: AccidentalEnum.Natural},
    {letter: NoteLetterEnum.F, accidental: AccidentalEnum.Natural},
    {letter: NoteLetterEnum.F, accidental: AccidentalEnum.Sharp},
    {letter: NoteLetterEnum.G, accidental: AccidentalEnum.Natural},
    {letter: NoteLetterEnum.G, accidental: AccidentalEnum.Sharp},
    {letter: NoteLetterEnum.A, accidental: AccidentalEnum.Natural},
    {letter: NoteLetterEnum.A, accidental: AccidentalEnum.Sharp},
    {letter: NoteLetterEnum.B, accidental: AccidentalEnum.Natural},
];

export function hzToMidi(
    hz: number
): { midi: number; noteName: NoteName; noteString: NoteString } {
    if (hz <= 0) throw new Error("Frequency must be positive");

    // 1. 频率转 MIDI (四舍五入到最近的音高)
    const midi = Math.round(69 + 12 * Math.log2(hz / 440));

    // 2. 计算音名
    const pitchClass = ((midi % 12) + 12) % 12; // 防止负数
    const octave = Math.floor(midi / 12) - 1; // MIDI 0 = C-1

    const {letter, accidental} = NOTE_TABLE[pitchClass];

    const noteName: NoteName = {letter, accidental, octave};
    const noteString = `${letter}${accidental}${octave}` as NoteString;

    return {midi, noteName, noteString};
}
