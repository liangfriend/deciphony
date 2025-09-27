import {Midi, NoteName} from "../../types";
import {NoteLetterEnum, AccidentalEnum} from "../../musicScoreEnum";

/*
* 手写
* */
const letterIndexMap = {
    [NoteLetterEnum.C]: 0,
    [NoteLetterEnum.D]: 2,
    [NoteLetterEnum.E]: 4,
    [NoteLetterEnum.F]: 5,
    [NoteLetterEnum.G]: 7,
    [NoteLetterEnum.A]: 9,
    [NoteLetterEnum.B]: 11,
}
const AccentalIndexMap = {
    [AccidentalEnum.None]: 0,
    [AccidentalEnum.Sharp]: 1,
    [AccidentalEnum.Flat]: -1,
    [AccidentalEnum.DoubleFlat]: -2,
    [AccidentalEnum.DoubleSharp]: 2,
}

function noteNameToMidi(noteName: NoteName): Midi {
    const letterIndex = letterIndexMap[noteName.letter]
    const octaveIndex = (noteName.octave + 1) * 12
    const accidental = AccentalIndexMap[noteName.accidental ?? 0]
    const midi = letterIndex + octaveIndex + accidental
    return midi;
}

export default noteNameToMidi;

// console.log(noteNameToMidi({letter: NoteLetterEnum.C, accidental: AccidentalEnum.None, octave: 4}));
// // 60 (C4)
//
// console.log(noteNameToMidi({letter: NoteLetterEnum.D, accidental: AccidentalEnum.Flat, octave: 4}));
// // 61 (Db4)
//
// console.log(noteNameToMidi({letter: NoteLetterEnum.C, accidental: AccidentalEnum.Sharp, octave: 4}));
// // 61 (C#4)
//
// console.log(noteNameToMidi({letter: NoteLetterEnum.B, accidental: AccidentalEnum.None, octave: 3}));
// // 59(B3)
