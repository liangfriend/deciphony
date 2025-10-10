import Player from "./Player";
import {ToneColor, ToneDuration, ToneSequence} from "../types/types";
import {ChronaxieEnum, Midi, NoteName, NoteString, TimeSignature} from "deciphony-core";
import {base64ToArrayBuffer, toneDurationToTimestamp} from "../utils/baseUtil";

/*
* 传入音色（一系列不同音高的音频文件）播放
* */
class TonePlayer extends Player {
    toneColor: ToneColor = {};
    bpm: number = 120;
    timeSignature: TimeSignature = {
        beat: 4,
        chronaxie: ChronaxieEnum.quarter
    }

    constructor({context}: { context: AudioContext }) {
        super({context})
    }

    addToneColor(toneColor: ToneColor) {
        this.toneColor = toneColor;
    }

    async _setSource(tone: string) {
        if (Object.keys(this.toneColor).length === 0) {
            console.error("音频文件不存在，请调用addToneColor方法添加音频")
            return
        }
        if (!this.toneColor[tone]) {
            console.error("note不存在于传入的音色中")
            return
        }
        this.source = this.context.createBufferSource();
        // 节点连接
        this.source.connect(this.gainNode).connect(this.context.destination);
        // 传入音频数据
        this.source.buffer = await this.context.decodeAudioData(base64ToArrayBuffer(this.toneColor[tone]));
    }

    async trigger(tone: string, loop: boolean = false) {

        await this._setSource(tone)
        if (!this.source) return

        if (this.context.state === 'suspended') {
            await this.context.resume(); // 有些浏览器首次需手动激活音频上下文
        }
        this.source.loop = loop
        this.source.onended = () => {
            //
        };
        // 播放
        this.source.start(0, this.pauseTime); // 从 pauseTime 的位置继续播放
        this.startTime = this.context.currentTime;
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
            await this.tap(item.tone, item.duration)
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

    release() {
        if (this.source) {
            this.source.stop();
            // disconnect让source更快的释放资源
            this.source.disconnect();
        }
        this.pauseTime = 0;
        this.startTime = 0
    }

    async tap(tone: string, duration: ToneDuration) {
        await this.trigger(tone, true)
        const timeStamp = toneDurationToTimestamp(duration, this.bpm)
        setTimeout(() => {
            this.release()
        }, timeStamp)
    }
}

export default TonePlayer;