import { AccidentalEnum, KeySignatureEnum, SolmizationEnum } from "../../musicScoreEnum";
declare function solmizationToMidi(solmization: SolmizationEnum, accidental: Exclude<AccidentalEnum, AccidentalEnum.Natural>, keySignature: KeySignatureEnum, octave: number): number;
export default solmizationToMidi;
