import { AccidentalEnum, ClefEnum, KeySignatureEnum } from "../../musicScoreEnum";
import { StaffRegion } from "../../types";
declare function getAccidentalForStaffPosition(key: KeySignatureEnum, pos: StaffRegion, clef: ClefEnum): AccidentalEnum;
export default getAccidentalForStaffPosition;
