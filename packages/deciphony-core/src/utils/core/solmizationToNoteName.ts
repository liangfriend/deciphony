import {KeySignatureEnum, SolmizationEnum, NoteLetterEnum, AccidentalEnum,} from "../../musicScoreEnum";
import {NoteName} from "../../types";

// 调号对应升降音位置（简化只考虑C大调为基准）
const keySignatureAccidentalsMap: Record<KeySignatureEnum, Partial<Record<NoteLetterEnum, AccidentalEnum>>> = {
    Cb: {
        C: AccidentalEnum.Flat,
        D: AccidentalEnum.Flat,
        E: AccidentalEnum.Flat,
        F: AccidentalEnum.Flat,
        G: AccidentalEnum.Flat,
        A: AccidentalEnum.Flat,
        B: AccidentalEnum.Flat
    },
    Gb: {
        F: AccidentalEnum.Flat,
        C: AccidentalEnum.Flat,
        G: AccidentalEnum.Flat,
        D: AccidentalEnum.Flat,
        A: AccidentalEnum.Flat
    },
    Db: {
        B: AccidentalEnum.Flat,
        E: AccidentalEnum.Flat,
        A: AccidentalEnum.Flat,
        D: AccidentalEnum.Flat,
        G: AccidentalEnum.Flat
    },
    Ab: {E: AccidentalEnum.Flat, A: AccidentalEnum.Flat, D: AccidentalEnum.Flat, G: AccidentalEnum.Flat},
    Eb: {B: AccidentalEnum.Flat, E: AccidentalEnum.Flat, A: AccidentalEnum.Flat},
    Bb: {B: AccidentalEnum.Flat, E: AccidentalEnum.Flat},
    F: {B: AccidentalEnum.Flat},
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
    }
}

// C大调自然音名对应唱名
const cMajorSolmizationMap: Record<SolmizationEnum, NoteLetterEnum> = {
    [SolmizationEnum.DO]: NoteLetterEnum.C,
    [SolmizationEnum.RE]: NoteLetterEnum.D,
    [SolmizationEnum.MI]: NoteLetterEnum.E,
    [SolmizationEnum.FA]: NoteLetterEnum.F,
    [SolmizationEnum.SOL]: NoteLetterEnum.G,
    [SolmizationEnum.LA]: NoteLetterEnum.A,
    [SolmizationEnum.TI]: NoteLetterEnum.B,
}

function solmizationToNoteName(
    solmization: SolmizationEnum,
    keySignature: KeySignatureEnum,
    baseOctave: number
): NoteName {
    const keyAccidentals = keySignatureAccidentalsMap[keySignature];

    // C大调音阶字母顺序
    const scaleLetters: NoteLetterEnum[] = [
        NoteLetterEnum.C,
        NoteLetterEnum.D,
        NoteLetterEnum.E,
        NoteLetterEnum.F,
        NoteLetterEnum.G,
        NoteLetterEnum.A,
        NoteLetterEnum.B,
    ];

    // 调号 DO 对应的基础字母（例如 D 调的 DO = D）
    const keyDoLetter = (() => {
        // 简单映射，只考虑自然调号（可拓展）
        switch (keySignature) {
            case KeySignatureEnum.C:
                return NoteLetterEnum.C;
            case KeySignatureEnum.G:
                return NoteLetterEnum.G;
            case KeySignatureEnum.D:
                return NoteLetterEnum.D;
            case KeySignatureEnum.A:
                return NoteLetterEnum.A;
            case KeySignatureEnum.E:
                return NoteLetterEnum.E;
            case KeySignatureEnum.B:
                return NoteLetterEnum.B;
            case KeySignatureEnum.F:
                return NoteLetterEnum.F;
            case KeySignatureEnum['F#']:
                return NoteLetterEnum.F;
            case KeySignatureEnum['C#']:
                return NoteLetterEnum.C;
            case KeySignatureEnum.Bb:
                return NoteLetterEnum.B;
            case KeySignatureEnum.Eb:
                return NoteLetterEnum.E;
            case KeySignatureEnum.Ab:
                return NoteLetterEnum.A;
            case KeySignatureEnum.Db:
                return NoteLetterEnum.D;
            case KeySignatureEnum.Gb:
                return NoteLetterEnum.G;
            case KeySignatureEnum.Cb:
                return NoteLetterEnum.C;
            default:
                return NoteLetterEnum.C;
        }
    })();

    // 计算音阶 index
    const solIndex = solmization - 1;

    // 计算字母
    let letterIndex = (scaleLetters.indexOf(keyDoLetter) + solIndex) % 7;
    const letter = scaleLetters[letterIndex];

    // 计算八度
    const octaveOffset = Math.floor((scaleLetters.indexOf(keyDoLetter) + solIndex) / 7);
    const octave = baseOctave + octaveOffset;

    // 调号升降
    const accidental = keyAccidentals[letter] ?? AccidentalEnum.Natural;

    return {letter, accidental, octave};
}

export default solmizationToNoteName

// 测试函数
function testSolmizationToNoteName() {
    const testCases: Array<{
        solmization: SolmizationEnum,
        key: KeySignatureEnum,
        octave: number,
        expected: string
    }> = [
        {solmization: SolmizationEnum.TI, key: KeySignatureEnum.C, expected: "C", octave: 4},
        {solmization: SolmizationEnum.TI, key: KeySignatureEnum.E, expected: "D", octave: 4},
        {solmization: SolmizationEnum.MI, key: KeySignatureEnum.C, expected: "E", octave: 4},
        {solmization: SolmizationEnum.FA, key: KeySignatureEnum.G, expected: "F#", octave: 4},
        {solmization: SolmizationEnum.SOL, key: KeySignatureEnum.F, expected: "G", octave: 4},
        {solmization: SolmizationEnum.LA, key: KeySignatureEnum.D, expected: "A", octave: 4},
        {solmization: SolmizationEnum.TI, key: KeySignatureEnum.B, expected: "B#", octave: 4}, // B大调
    ];

    testCases.forEach(({solmization, key, octave, expected}) => {
        const note = solmizationToNoteName(solmization, key, octave);
        const noteStr = `${note.letter}${note.accidental}${note.octave}`;
        console.log(`Solmization ${SolmizationEnum[solmization]} in key ${key} -> ${noteStr}`);
    });

    console.log("All tests done.");
}

// 执行测试
// testSolmizationToNoteName();