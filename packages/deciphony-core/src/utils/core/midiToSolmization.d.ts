import { AccidentalEnum, KeySignatureEnum, SolmizationEnum } from "../../musicScoreEnum";
import { Octave } from "../../types";
declare function midiToSolmization(midi: number, keySignature: KeySignatureEnum, priority?: AccidentalEnum.Sharp | AccidentalEnum.Flat): {
    solmization: SolmizationEnum;
    accidental: AccidentalEnum;
    octave: Octave;
};
export default midiToSolmization;
