import {AccidentalEnum, KeySignatureEnum, SolmizationEnum,} from "../../musicScoreEnum";

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

function solmizationToMidi(
    solmization: SolmizationEnum,
    accidental: Exclude<AccidentalEnum, AccidentalEnum.Natural>,
    keySignature: KeySignatureEnum,
    octave: number
): number {
    const baseMidi = keySignatureIndexMap[keySignature];

    // 固定调 DO-RE-MI 半音偏移表
    const solmizationOffset: Record<SolmizationEnum, number> = {
        [SolmizationEnum.DO]: 0,
        [SolmizationEnum.RE]: 2,
        [SolmizationEnum.MI]: 4,
        [SolmizationEnum.FA]: 5,
        [SolmizationEnum.SOL]: 7,
        [SolmizationEnum.LA]: 9,
        [SolmizationEnum.TI]: 11,
    };

    let offset = solmizationOffset[solmization];

    // 根据变音符修正
    switch (accidental) {
        case AccidentalEnum.Sharp:
            offset += 1;
            break;
        case AccidentalEnum.Flat:
            offset -= 1;
            break;
        case AccidentalEnum.DoubleSharp:
            offset += 2;
            break;
        case AccidentalEnum.DoubleFlat:
            offset -= 2;
            break;
        case AccidentalEnum.None:
            break;
    }

    // 跨八度处理
    const midi = baseMidi + (octave - 4) * 12 + offset;

    return midi;
}

export default solmizationToMidi


// 执行测试
// console.log(solmizationToMidi(SolmizationEnum.TI, AccidentalEnum.Sharp, KeySignatureEnum.D, 4))