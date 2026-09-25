import { StaffRegion } from "../../types";
import { AccidentalEnum, ClefEnum } from "../../musicScoreEnum";
declare function regionToMidi(region: StaffRegion, accidental: AccidentalEnum, clef: ClefEnum): number;
export default regionToMidi;
