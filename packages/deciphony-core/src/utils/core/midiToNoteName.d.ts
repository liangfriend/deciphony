import { Midi, NoteName } from "../../types";
import { AccidentalEnum } from "../../musicScoreEnum";
declare function midiToNoteName(midi: Midi, priority?: AccidentalEnum.Sharp | AccidentalEnum.Flat): NoteName;
export default midiToNoteName;
