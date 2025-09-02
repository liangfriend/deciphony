import {Midi, NoteName, Octave} from "../../types";
import {AccidentalEnum, NoteLetterEnum} from "../../musicScoreEnum";


// 变音符号优先级（可以调整顺序）
const accidentalPriority: AccidentalEnum[] = [
    AccidentalEnum.Natural,
    AccidentalEnum.Sharp,
    AccidentalEnum.Flat,
    AccidentalEnum.DoubleSharp,
    AccidentalEnum.DoubleFlat,
];
// 定义一个候选列表（一个 pitchClass 对应多个可能的 NoteName）
const pitchClassMap: { [pc: number]: { letter: NoteLetterEnum; accidental: AccidentalEnum }[] } = {
    0: [{letter: NoteLetterEnum.C, accidental: AccidentalEnum.Natural}],
    1: [
        {letter: NoteLetterEnum.C, accidental: AccidentalEnum.Sharp},
        {letter: NoteLetterEnum.D, accidental: AccidentalEnum.Flat},
    ],
    2: [{letter: NoteLetterEnum.D, accidental: AccidentalEnum.Natural}],
    3: [
        {letter: NoteLetterEnum.D, accidental: AccidentalEnum.Sharp},
        {letter: NoteLetterEnum.E, accidental: AccidentalEnum.Flat},
    ],
    4: [{letter: NoteLetterEnum.E, accidental: AccidentalEnum.Natural}],
    5: [{letter: NoteLetterEnum.F, accidental: AccidentalEnum.Natural}],
    6: [
        {letter: NoteLetterEnum.F, accidental: AccidentalEnum.Sharp},
        {letter: NoteLetterEnum.G, accidental: AccidentalEnum.Flat},
    ],
    7: [{letter: NoteLetterEnum.G, accidental: AccidentalEnum.Natural}],
    8: [
        {letter: NoteLetterEnum.G, accidental: AccidentalEnum.Sharp},
        {letter: NoteLetterEnum.A, accidental: AccidentalEnum.Flat},
    ],
    9: [{letter: NoteLetterEnum.A, accidental: AccidentalEnum.Natural}],
    10: [
        {letter: NoteLetterEnum.A, accidental: AccidentalEnum.Sharp},
        {letter: NoteLetterEnum.B, accidental: AccidentalEnum.Flat},
    ],
    11: [{letter: NoteLetterEnum.B, accidental: AccidentalEnum.Natural}],
};

function midiToNoteName(midi: Midi): NoteName {
    if (midi < 0 || midi > 127) {
        throw new Error(`Invalid MIDI number: ${midi}`);
    }

    const pitchClass = midi % 12;
    const octave: Octave = Math.floor(midi / 12) - 1;

    const candidates = pitchClassMap[pitchClass];
    if (!candidates) {
        throw new Error(`No mapping for pitch class: ${pitchClass}`);
    }

    // 在 accidentalPriority 里的索引值越小，优先级越高
    const chosen = candidates.reduce((best, current) => {
        const bestIdx = accidentalPriority.indexOf(best.accidental);
        const currentIdx = accidentalPriority.indexOf(current.accidental);
        return currentIdx < bestIdx ? current : best;
    });

    return {
        letter: chosen.letter,
        accidental: chosen.accidental,
        octave,
    };
}

export default midiToNoteName;

// console.log(midiToNoteName(60));
// // { letter: 'C', accidental: '', octave: 4 }  → C4
//
// console.log(midiToNoteName(61));
// { letter: 'C', accidental: '#', octave: 4 } → C#4（因为优先级 # > b）
