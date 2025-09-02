import {Midi, NoteName} from "../../types";
import {NoteLetterEnum, AccidentalEnum} from "../../musicScoreEnum";

const basePitchClass: Record<NoteLetterEnum, number> = {
    [NoteLetterEnum.C]: 0,
    [NoteLetterEnum.D]: 2,
    [NoteLetterEnum.E]: 4,
    [NoteLetterEnum.F]: 5,
    [NoteLetterEnum.G]: 7,
    [NoteLetterEnum.A]: 9,
    [NoteLetterEnum.B]: 11,
};

const accidentalOffset: Record<AccidentalEnum, number> = {
    [AccidentalEnum.Natural]: 0,
    [AccidentalEnum.Sharp]: 1,
    [AccidentalEnum.Flat]: -1,
    [AccidentalEnum.DoubleSharp]: 2,
    [AccidentalEnum.DoubleFlat]: -2,
};

function noteNameToMidi(noteName: NoteName): Midi {
    const {letter, accidental, octave} = noteName;

    const base = basePitchClass[letter];
    const offset = accidentalOffset[accidental] ?? 0;
    const pitchClass = base + offset;

    const midi: Midi = (octave + 1) * 12 + pitchClass;

    if (midi < 0 || midi > 127) {
        throw new Error(`Note out of MIDI range: ${JSON.stringify(noteName)} => ${midi}`);
    }

    return midi;
}

export default noteNameToMidi;

// console.log(noteNameToMidi({letter: NoteLetterEnum.C, accidental: AccidentalEnum.Natural, octave: 4}));
// // 60 (C4)
//
// console.log(noteNameToMidi({letter: NoteLetterEnum.D, accidental: AccidentalEnum.Flat, octave: 4}));
// // 61 (Db4)
//
// console.log(noteNameToMidi({letter: NoteLetterEnum.C, accidental: AccidentalEnum.Sharp, octave: 4}));
// // 61 (C#4)
//
// console.log(noteNameToMidi({letter: NoteLetterEnum.B, accidental: AccidentalEnum.Natural, octave: 3}));
// 59 (B3)
