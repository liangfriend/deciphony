import { StaffRegion } from "../../types";
import { AccidentalEnum, ClefEnum } from "../../musicScoreEnum";
declare function midiToRegion(midi: number, clef: ClefEnum, priority?: AccidentalEnum.Sharp | AccidentalEnum.Flat): {
    staffRegion: StaffRegion;
    accidental: AccidentalEnum;
};
export default midiToRegion;
