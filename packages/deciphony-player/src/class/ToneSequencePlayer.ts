import {ToneSequence} from "../types/type";
import {TimeSignature} from "deciphony-core/types";
import TonePlayer from "./TonePlayer";
import {ChronaxieEnum} from "deciphony-core/enum";

class ToneSequencePlayer extends TonePlayer {
    sequence: ToneSequence[]
    bpm: number
    timeSignature: TimeSignature

    constructor() {
        super();
        this.bpm = 120
        this.sequence = []
        this.timeSignature = {
            beat: 4,
            chronaxie: ChronaxieEnum.quarter
        }
    }
    playSequence(sequence: ToneSequence[]): void {

        await this._setSource(note)
    }
    stop() {
        if (this.source) {
            this.source.stop();
            // disconnect让source更快的释放资源
            this.source.disconnect();
        }
        this.pauseTime = 0;
        this.startTime = 0
    }
}

export default ToneSequencePlayer;
