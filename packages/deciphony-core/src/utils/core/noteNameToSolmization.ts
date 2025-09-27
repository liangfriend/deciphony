import {NoteName, Octave} from "../../types";
import {AccidentalEnum, KeySignatureEnum, SolmizationEnum, NoteLetterEnum} from "../../musicScoreEnum";


const solmizationMap = {
    [KeySignatureEnum.C]: {
        [NoteLetterEnum.C]: {
            [AccidentalEnum.None]:SolmizationEnum.DO,
            [AccidentalEnum.Sharp]:
        },
        [NoteLetterEnum.D]: SolmizationEnum.RE,
        [NoteLetterEnum.E]: SolmizationEnum.MI,
        [NoteLetterEnum.F]: SolmizationEnum.FA,
        [NoteLetterEnum.G]: SolmizationEnum.SOL,
        [NoteLetterEnum.A]: SolmizationEnum.LA,
        [NoteLetterEnum.B]: SolmizationEnum.TI,
    },
    [KeySignatureEnum.D]: {
        [NoteLetterEnum.D]: SolmizationEnum.DO,
        [NoteLetterEnum.E]: SolmizationEnum.RE,
        [NoteLetterEnum.F]: SolmizationEnum.MI,
        [NoteLetterEnum.G]: SolmizationEnum.FA,
        [NoteLetterEnum.A]: SolmizationEnum.SOL,
        [NoteLetterEnum.B]: SolmizationEnum.LA,
        [NoteLetterEnum.C]: SolmizationEnum.TI,
    }
}

export function noteNameToSolmization(
    noteName: NoteName,
    keySignature: KeySignatureEnum
): { solmization: SolmizationEnum; accidental: AccidentalEnum; octave: Octave } {

    return {
        solmization: solmizationMap[keySignature][noteName.letter][noteName.accidental],
        accidental: noteName.accidental,
        octave: noteName.octave,
    };
}


function testNoteNameToSolmization() {
    const testCases: { note: NoteName; key: KeySignatureEnum }[] = [
        {note: {letter: NoteLetterEnum.C, accidental: AccidentalEnum.None, octave: 4}, key: KeySignatureEnum.D},
        // {note: {letter: NoteLetterEnum.F, accidental: AccidentalEnum.Sharp, octave: 4}, key: KeySignatureEnum.G},
        // {note: {letter: NoteLetterEnum.A, accidental: AccidentalEnum.None, octave: 4}, key: KeySignatureEnum.F},
        // {note: {letter: NoteLetterEnum.B, accidental: AccidentalEnum.Sharp, octave: 5}, key: KeySignatureEnum['C#']},
        // {note: {letter: NoteLetterEnum.E, accidental: AccidentalEnum.Flat, octave: 3}, key: KeySignatureEnum.Eb},
    ];
    testCases.forEach(({note, key}) => {
        const result = noteNameToSolmization(note, key);
        console.log(`Key: ${key}, Note: ${note.letter}${note.accidental}${note.octave} -> Solmization: ${SolmizationEnum[result.solmization]}${result.accidental}${result.octave}`);
    });
}

// 执行测试
testNoteNameToSolmization();