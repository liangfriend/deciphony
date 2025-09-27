import {
    AccidentalEnum,
    ClefEnum,
    KeySignatureEnum,
    SolmizationEnum,
    StaffPositionTypeEnum,
    StaffRegionEnum
} from "../../musicScoreEnum";
import {NoteName, Octave, StaffRegion} from "../../types";

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
function midiToSolmization(
    midi: number,
    keySignature: KeySignatureEnum,
    priority: AccidentalEnum.Sharp | AccidentalEnum.Flat = AccidentalEnum.Sharp
): { solmization: SolmizationEnum; accidental: AccidentalEnum; octave: Octave } {


    return {
        solmization: ,
        accidental: ,
        octave: ,
    };
}