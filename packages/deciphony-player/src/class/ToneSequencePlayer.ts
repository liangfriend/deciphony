import {SamplerData, ToneSequence} from "../types/type";
import {Midi, NoteName, NoteString} from "deciphony-core/types";
import {base64ToArrayBuffer} from "../utils/baseUtil";
import midiToNoteName from "deciphony-core/utils/core/midiToNoteName";
import {noteNameToNoteString} from "deciphony-core/utils/musicScoreDataUtil";
import TonePlayer from "./TonePlayer";

class ToneSequencePlayer extends TonePlayer {
    sampler: SamplerData;
    private _onEnd: (() => void) | null = null;
    sequence: ToneSequence
    constructor() {
        super();
        this.sampler = {};
        this.sequence= []
    }
    addSequence(sequence: ToneSequence): void {
        this.sequence = sequence;
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


if(音色数量 > 2) {
    文案 = 展示;
}else if(音色数量 === '亮音大钢琴') {
    文案 = 不展示
}else {
    ???
}