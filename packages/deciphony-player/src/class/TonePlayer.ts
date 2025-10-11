import {ToneColor, ToneDuration, ToneSequence} from "../types/types";
import {ChronaxieEnum, TimeSignature} from "deciphony-core";
import {base64ToArrayBuffer, toneDurationToTimestamp} from "../utils/baseUtil";

/*
* 传入音色（一系列不同音高的音频文件）播放
* */
class TonePlayer {
    context: AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    source: AudioBufferSourceNode | null = null; // 音频源
    state: 'stopped' | 'playing' | 'paused' = 'stopped';
    audioBuffer: AudioBuffer | null = null;
    pauseIndex: number = 0;
    toneColor: ToneColor = {};
    bpm: number = 120;
    timeSignature: TimeSignature = {
        beat: 4,
        chronaxie: ChronaxieEnum.quarter
    }

    constructor() {
        this.context = new AudioContext()
        this.gainNode = this.context.createGain();
    }

    addToneColor(toneColor: ToneColor) {
        this.toneColor = toneColor;
    }

    async _setSource(tone: string | number) {
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

    async trigger(tone: string | number, loop: boolean = false) {

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
        this.source.start(0); // 从 pauseTime 的位置继续播放
    }

    async playSequence(sequence: ToneSequence[]) {
        this.state = 'playing'
        const index = this.pauseIndex
        if (this.pauseIndex !== 0) {
            this.pauseIndex = 0
        }
        const item = sequence[index]
        if (item && item.type === 'note') {
            await this.step(sequence, index)
        } else if (item.type === 'rest') {
            await this.step(sequence, index)
        }

    }

    async pauseSequence(sequence: ToneSequence[]) {
        this.state = 'paused';
    }

    async stopSequence(sequence: ToneSequence[]) {
        this.state = 'stopped';
    }

    async step(sequence: ToneSequence[], index: number) {
        if (this.state === 'stopped') {
            this.pauseIndex = 0
            this.release()
            return
        }
        if (this.state === 'paused') {
            this.pauseIndex = index
            return
        }
        if (index === sequence.length) {
            this.state = 'stopped';
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
    }

    async tap(tone: string | number, duration: ToneDuration) {
        await this.trigger(tone, true)
        const timeStamp = toneDurationToTimestamp(duration, this.bpm)
        setTimeout(() => {
            this.release()
        }, timeStamp)
    }
}

export default TonePlayer;