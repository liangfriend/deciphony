import {ToneSequence} from "../types/type";
import {TimeSignature} from "deciphony-core/types";
import TonePlayer from "./TonePlayer";
import {ChronaxieEnum} from "deciphony-core/enum";
import {toneDurationToTimestamp} from "../utils/baseUtil";

class ToneSequencePlayer extends TonePlayer {
    sequence: ToneSequence[] = []
    timeSignature: TimeSignature = {
        beat: 4,
        chronaxie: ChronaxieEnum.quarter
    }

    constructor({context}: { context: AudioContext }) {
        super({context})
    }

    async playSequence(sequence: ToneSequence[]) {
        const item = sequence[0]
        if (item && item.type === 'note') {
            await this.step(sequence, 0)
        } else if (item.type === 'rest') {
            await this.step(sequence, 0)
        }

    }

    async step(sequence: ToneSequence[], index: number) {
        if (index === sequence.length) {
            return
        }
        const item = sequence[index]
        const time = toneDurationToTimestamp(item.duration, this.bpm)
        if (item.type === 'note') {
            await this.tapMiDI(item.midi, item.duration)
            setTimeout(() => {
                this.step(sequence, index + 1);
            }, time)
        } else if (item.type === 'rest') {
            setTimeout(() => {
                const time = toneDurationToTimestamp(item.duration, this.bpm)
                this.step(sequence, index + 1);
            }, time)
        }

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

    stopSequence() {

    }
}

export default ToneSequencePlayer;
