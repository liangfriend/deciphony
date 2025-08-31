import {NoteName} from "../../types";
import {AccidentalEnum, KeySignatureEnum, Octave, SolmizationEnum, NoteLetterEnum} from "../../musicScoreEnum";

// 调号对应升降音（以C大调为基准，升降写在音名上）
const keySignatureAccidentalsMap: Record<KeySignatureEnum, Partial<Record<NoteLetterEnum, AccidentalEnum>>> = {
    C: {},
    G: {F: AccidentalEnum.Sharp},
    D: {F: AccidentalEnum.Sharp, C: AccidentalEnum.Sharp},
    A: {F: AccidentalEnum.Sharp, C: AccidentalEnum.Sharp, G: AccidentalEnum.Sharp},
    E: {F: AccidentalEnum.Sharp, C: AccidentalEnum.Sharp, G: AccidentalEnum.Sharp, D: AccidentalEnum.Sharp},
    B: {
        F: AccidentalEnum.Sharp,
        C: AccidentalEnum.Sharp,
        G: AccidentalEnum.Sharp,
        D: AccidentalEnum.Sharp,
        A: AccidentalEnum.Sharp
    },
    'F#': {
        F: AccidentalEnum.Sharp,
        C: AccidentalEnum.Sharp,
        G: AccidentalEnum.Sharp,
        D: AccidentalEnum.Sharp,
        A: AccidentalEnum.Sharp,
        E: AccidentalEnum.Sharp
    },
    'C#': {
        F: AccidentalEnum.Sharp,
        C: AccidentalEnum.Sharp,
        G: AccidentalEnum.Sharp,
        D: AccidentalEnum.Sharp,
        A: AccidentalEnum.Sharp,
        E: AccidentalEnum.Sharp,
        B: AccidentalEnum.Sharp
    },
    Cb: {
        B: AccidentalEnum.Flat,
        E: AccidentalEnum.Flat,
        A: AccidentalEnum.Flat,
        D: AccidentalEnum.Flat,
        G: AccidentalEnum.Flat,
        C: AccidentalEnum.Flat,
        F: AccidentalEnum.Flat
    },
    Gb: {
        B: AccidentalEnum.Flat,
        E: AccidentalEnum.Flat,
        A: AccidentalEnum.Flat,
        D: AccidentalEnum.Flat,
        G: AccidentalEnum.Flat,
        C: AccidentalEnum.Flat
    },
    Db: {
        B: AccidentalEnum.Flat,
        E: AccidentalEnum.Flat,
        A: AccidentalEnum.Flat,
        D: AccidentalEnum.Flat,
        G: AccidentalEnum.Flat
    },
    Ab: {B: AccidentalEnum.Flat, E: AccidentalEnum.Flat, A: AccidentalEnum.Flat, D: AccidentalEnum.Flat},
    Eb: {B: AccidentalEnum.Flat, E: AccidentalEnum.Flat, A: AccidentalEnum.Flat},
    Bb: {B: AccidentalEnum.Flat, E: AccidentalEnum.Flat},
    F: {B: AccidentalEnum.Flat},
};

// C 大调音阶顺序，对应唱名
const noteLetterOrder: NoteLetterEnum[] = [
    NoteLetterEnum.C,
    NoteLetterEnum.D,
    NoteLetterEnum.E,
    NoteLetterEnum.F,
    NoteLetterEnum.G,
    NoteLetterEnum.A,
    NoteLetterEnum.B,
];

const solmizationOrder: SolmizationEnum[] = [
    SolmizationEnum.DO,
    SolmizationEnum.RE,
    SolmizationEnum.MI,
    SolmizationEnum.FA,
    SolmizationEnum.SOL,
    SolmizationEnum.LA,
    SolmizationEnum.TI,
];

export function noteNameToSolmization(
    noteName: NoteName,
    keySignature: KeySignatureEnum
): { solmization: SolmizationEnum; accidental: AccidentalEnum; octave: Octave } {
    const keyAccidentals = keySignatureAccidentalsMap[keySignature] || {};

    // 找到 C 大调音阶中 noteName 对应的位置
    const indexInC = noteLetterOrder.indexOf(noteName.letter);
    if (indexInC === -1) throw new Error("Invalid note letter");

    // 调号中该音是否被升降调
    const keyAccidental = keyAccidentals[noteName.letter] ?? AccidentalEnum.Natural;

    // 最终唱名的音符字母（在 C 大调音阶里对应 DO->C, RE->D ...）
    // 找到 indexInC 在唱名顺序里的位置
    const solmization = solmizationOrder[indexInC];

    // 计算唱名的升降号 = noteName 的实际 accidental - key 中的 accidental
    // 简单处理为：实际音 - 调号音 = 唱名 accidental
    let accidental: AccidentalEnum = AccidentalEnum.Natural;
    if (noteName.accidental !== keyAccidental) {
        // 简化，只处理基本情况
        if (noteName.accidental === AccidentalEnum.Sharp) {
            accidental = AccidentalEnum.Sharp;
        } else if (noteName.accidental === AccidentalEnum.Flat) {
            accidental = AccidentalEnum.Flat;
        } else {
            accidental = AccidentalEnum.Natural;
        }
    }

    // 八度处理：唱名 DO 对应 C 的八度
    const octaveOffset = 0; // 简化处理，可根据 DO 对应 C 的八度规则调整
    const octave = noteName.octave + octaveOffset;

    return {
        solmization,
        accidental,
        octave,
    };
}

function testNoteNameToSolmization() {
    const testCases: { note: NoteName; key: KeySignatureEnum }[] = [
        {note: {letter: NoteLetterEnum.C, accidental: AccidentalEnum.Natural, octave: 4}, key: KeySignatureEnum.C},
        {note: {letter: NoteLetterEnum.F, accidental: AccidentalEnum.Sharp, octave: 4}, key: KeySignatureEnum.G},
        {note: {letter: NoteLetterEnum.A, accidental: AccidentalEnum.Natural, octave: 4}, key: KeySignatureEnum.F},
        {note: {letter: NoteLetterEnum.B, accidental: AccidentalEnum.Sharp, octave: 5}, key: KeySignatureEnum['C#']},
        {note: {letter: NoteLetterEnum.E, accidental: AccidentalEnum.Flat, octave: 3}, key: KeySignatureEnum.Eb},
    ];

    testCases.forEach(({note, key}) => {
        const result = noteNameToSolmization(note, key);
        console.log(`Key: ${key}, Note: ${note.letter}${note.accidental}${note.octave} -> Solmization: ${SolmizationEnum[result.solmization]}${result.accidental}${result.octave}`);
    });
}

// 执行测试
testNoteNameToSolmization();