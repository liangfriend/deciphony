import {ToneColor, ToneDuration, ToneSequence} from "../types/types";
import {ChronaxieEnum, TimeSignature} from "deciphony-core";
import {base64ToArrayBuffer, toneDurationToTimestamp} from "../utils/baseUtil";

/*
* 传入音色（一系列不同音高的音频文件）播放
* */
class TonePlayer {
    context: AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    private _state: 'stopped' | 'playing' | 'paused' = 'stopped';
    private _curPlayingSource: AudioBufferSourceNode | undefined // 当前正在播放序列的的音频源，只用于序列播放
    pauseIndex: number = 0;
    private _toneColor: ToneColor = {};
    bpm: number = 120;
    private timer: number | NodeJS.Timeout = 0;
    timeSignature: TimeSignature = {
        beat: 4,
        chronaxie: ChronaxieEnum.quarter
    }

    constructor() {
        this.context = new AudioContext()
        this.gainNode = this.context.createGain();
    }

    addToneColor(toneColor: ToneColor) {
        this._toneColor = toneColor;
    }

    async _setSource(tone: string | number) {
        if (Object.keys(this._toneColor).length === 0) {
            console.error("音频文件不存在，请调用addToneColor方法添加音频")
            return
        }
        if (!this._toneColor[tone]) {
            console.error("note不存在于传入的音色中")
            return
        }
        // 单音符播放时，需要保证多音符同时播放，所以这里不能release
        // if (this.source) {
        //     this.release()
        // }
        const source = this.context.createBufferSource();
        // 节点连接
        source.connect(this.gainNode).connect(this.context.destination);
        // 传入音频数据
        source.buffer = await this.context.decodeAudioData(base64ToArrayBuffer(this._toneColor[tone]));
        return source
    }

    async trigger(tone: string | number, loop: boolean = false): Promise<AudioBufferSourceNode | undefined> {

        const source = await this._setSource(tone)
        this._curPlayingSource = source
        if (!source) {
            return
        }
        if (this.context.state === 'suspended') {
            await this.context.resume(); // 有些浏览器首次需手动激活音频上下文
        }
        source.loop = loop
        source.onended = () => {
            //
        };
        // 播放
        source.start(0); // 从 pauseTime 的位置继续播放
        return source
    }

    async playSequence(sequence: ToneSequence[]) {
        if (this._state === 'playing') {
            return
        }
        this._state = 'playing'
        const index = this.pauseIndex

        const item = sequence[index]
        if (item && item.type === 'note') {
            await this.step(sequence, index)
        } else if (item && item.type === 'rest') {
            await this.step(sequence, index)
        }

    }

    pauseSequence(sequence: ToneSequence[]) {
        this._state = 'paused';
        clearTimeout(this.timer);
        // 不可以直接release,要等当前声音播放完成
    }

    stopSequence(options?: {
        immediate?: boolean,// 是否立即停止
    }) {
        this._state = 'stopped';
        this.pauseIndex = 0
        if (options?.immediate) {
            this._curPlayingSource && this.release(this._curPlayingSource)
        }
        clearTimeout(this.timer);
    }

    async step(sequence: ToneSequence[], index: number) {
        // 自然播放结束时，索引超出，停止。
        if (index === sequence.length) {
            this._state = 'stopped';
            this.pauseIndex = 0
            return
        }
        // 手动暂停，如果索引为最后一个音符，就要设置pauseIndex=0
        if (index === sequence.length - 1) {
            this.pauseIndex = 0
        } else {
            this.pauseIndex = index + 1
        }

        if (this._state === 'stopped') {
            this._curPlayingSource && this.release(this._curPlayingSource)
            return
        }
        if (this._state === 'paused') {
            return
        }

        const item = sequence[index]
        const time = toneDurationToTimestamp(item.duration, this.bpm)
        if (item.type === 'note') {
            this._curPlayingSource = await this.tap(item.tone, item.duration)
            this.timer = setTimeout(() => {
                // 结束事件
                this.step(sequence, index + 1);
            }, time)
        } else if (item.type === 'rest') {
            this.timer = setTimeout(() => {
                this.step(sequence, index + 1);
            }, time)
        }
    }

    release(source: AudioBufferSourceNode) {
        if (source) {
            source.stop();
            // disconnect让source更快的释放资源
            source.disconnect();
        }
    }

    async tap(tone: string | number, duration: ToneDuration) {
        const source = await this.trigger(tone, true)
        if (!source) {
            console.error("source不存在，tap失败，请检查是否正确传入toneColor")
            return
        }
        const timeStamp = toneDurationToTimestamp(duration, this.bpm)
        setTimeout(() => {
            this.release(source)
        }, timeStamp)
        return source
    }
}

export default TonePlayer;