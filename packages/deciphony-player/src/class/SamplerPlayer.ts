import Player from "./Player";
import {SamplerData} from "../types/type";
import {Midi, NoteString} from "deciphony-core/types";
import {base64ToArrayBuffer} from "../utils/baseUtil";
import midiToNoteName from "deciphony-core/utils/core/midiToNoteName";
import {noteNameToNoteString} from "deciphony-core/utils/musicScoreDataUtil";

class SamplerPlayer extends Player {
    sampler: SamplerData;

    constructor() {
        super();
        this.sampler = {};
    }

    addSampler(sampler: SamplerData) {
        this.sampler = sampler;
    }

    private async _setSource(note: NoteString) {
        if (!this.sampler) {
            console.error("音频文件不存在，请调用addSampler方法添加音频")
            return
        }
        if (!this.sampler[note]) {
            console.error("note不存在于传入的音色中")
            return
        }
        this.source = this.context.createBufferSource();
        // 节点连接
        this.source.connect(this.gainNode).connect(this.panner).connect(this.context.destination);
        // 传入音频数据
        this.source.buffer = await this.context.decodeAudioData(base64ToArrayBuffer(this.sampler[note]));
    }

    // 重写play
    async playMIDI(midi: NoteString | Midi) {

        const noteName = ((typeof midi === 'number') ? midiToNoteName(midi) : midi)

        const note = noteNameToNoteString(noteName)
        await this._setSource(note)
        if (!this.source) return
        this.source.onended = () => {
            this.playMIDI(midi)
        }
        if (this.context.state === 'suspended') {
            await this.context.resume(); // 有些浏览器首次需手动激活音频上下文
        }
        // 播放
        this.source.start(0, this.pauseTime); // 从 pauseTime 的位置继续播放
        this.startTime = this.context.currentTime;

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

export default SamplerPlayer;