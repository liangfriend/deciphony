import {AccidentalEnum, KeySignatureEnum, SolmizationEnum} from "../../musicScoreEnum";
import {Octave} from "../../types";

// 变音符号优先级（可以调整顺序）
const prioritySharp: AccidentalEnum[] = [
    AccidentalEnum.Natural,
    AccidentalEnum.Sharp,
    AccidentalEnum.Flat,

];
const priorityFlat: AccidentalEnum[] = [
    AccidentalEnum.Natural,
    AccidentalEnum.Flat,
    AccidentalEnum.Sharp,
];
const keySignatureIndexMap: Record<KeySignatureEnum, number> = {
    [KeySignatureEnum.Cb]: 59, // Cb = B (比 C 小一半音)
    [KeySignatureEnum.Gb]: 66, // Gb = F#
    [KeySignatureEnum.Db]: 61, // Db = C#
    [KeySignatureEnum.Ab]: 68, // Ab = G#
    [KeySignatureEnum.Eb]: 63, // Eb = D#
    [KeySignatureEnum.Bb]: 70, // Bb = A#
    [KeySignatureEnum.F]: 65,  // F
    [KeySignatureEnum.C]: 60,  // C
    [KeySignatureEnum.G]: 67,  // G
    [KeySignatureEnum.D]: 62,  // D
    [KeySignatureEnum.A]: 69,  // A
    [KeySignatureEnum.E]: 64,  // E
    [KeySignatureEnum.B]: 71,  // B
    ["F#"]: 66,                // F#
    ["C#"]: 61,                // C#
};
const octaveMap: Record<
    number,
    {
        sharp: { solmization: SolmizationEnum; accidental: AccidentalEnum };
        flat: { solmization: SolmizationEnum; accidental: AccidentalEnum };
    }
> = {
    0: {
        sharp: {solmization: SolmizationEnum.DO, accidental: AccidentalEnum.None},
        flat: {solmization: SolmizationEnum.DO, accidental: AccidentalEnum.None}
    },

    1: {
        sharp: {solmization: SolmizationEnum.DO, accidental: AccidentalEnum.Sharp},
        flat: {solmization: SolmizationEnum.RE, accidental: AccidentalEnum.Flat}
    },

    2: {
        sharp: {solmization: SolmizationEnum.RE, accidental: AccidentalEnum.None},
        flat: {solmization: SolmizationEnum.RE, accidental: AccidentalEnum.None}
    },

    3: {
        sharp: {solmization: SolmizationEnum.RE, accidental: AccidentalEnum.Sharp},
        flat: {solmization: SolmizationEnum.MI, accidental: AccidentalEnum.Flat}
    },

    4: {
        sharp: {solmization: SolmizationEnum.MI, accidental: AccidentalEnum.None},
        flat: {solmization: SolmizationEnum.MI, accidental: AccidentalEnum.None}
    },

    5: {
        sharp: {solmization: SolmizationEnum.FA, accidental: AccidentalEnum.None},
        flat: {solmization: SolmizationEnum.FA, accidental: AccidentalEnum.None}
    },

    6: {
        sharp: {solmization: SolmizationEnum.FA, accidental: AccidentalEnum.Sharp},
        flat: {solmization: SolmizationEnum.SOL, accidental: AccidentalEnum.Flat}
    },

    7: {
        sharp: {solmization: SolmizationEnum.SOL, accidental: AccidentalEnum.None},
        flat: {solmization: SolmizationEnum.SOL, accidental: AccidentalEnum.None}
    },

    8: {
        sharp: {solmization: SolmizationEnum.SOL, accidental: AccidentalEnum.Sharp},
        flat: {solmization: SolmizationEnum.LA, accidental: AccidentalEnum.Flat}
    },

    9: {
        sharp: {solmization: SolmizationEnum.LA, accidental: AccidentalEnum.None},
        flat: {solmization: SolmizationEnum.LA, accidental: AccidentalEnum.None}
    },

    10: {
        sharp: {solmization: SolmizationEnum.LA, accidental: AccidentalEnum.Sharp},
        flat: {solmization: SolmizationEnum.TI, accidental: AccidentalEnum.Flat}
    },

    11: {
        sharp: {solmization: SolmizationEnum.TI, accidental: AccidentalEnum.None},
        flat: {solmization: SolmizationEnum.TI, accidental: AccidentalEnum.None}
    },
};

function midiToSolmization(
    midi: number,
    keySignature: KeySignatureEnum,
    priority: AccidentalEnum.Sharp | AccidentalEnum.Flat = AccidentalEnum.Sharp
): { solmization: SolmizationEnum; accidental: AccidentalEnum; octave: Octave } {
    const baseMidi = keySignatureIndexMap[keySignature];
    const baseIndex = midi - baseMidi;

    const noteIndex = ((baseIndex % 12) + 12) % 12;

    const octave = Math.floor(baseIndex / 12) + 4;

    const mapping = octaveMap[noteIndex];
    const result = priority === AccidentalEnum.Sharp ? mapping.sharp : mapping.flat;

    return {
        solmization: result.solmization,
        accidental: result.accidental,
        octave,
    };
}

export default midiToSolmization;
// console.log(midiToSolmization(60, KeySignatureEnum.C))
