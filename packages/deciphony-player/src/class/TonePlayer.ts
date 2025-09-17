import Player from "./Player";
import {ToneColor, ToneDuration} from "../types/type";
import {Midi, NoteName, NoteString} from "deciphony-core/types";
import {base64ToArrayBuffer, toneDurationToTimestamp} from "../utils/baseUtil";
import midiToNoteName from "deciphony-core/utils/core/midiToNoteName";
import {noteNameToNoteString} from "deciphony-core/utils/musicScoreDataUtil";
import noteNameToMidi from "deciphony-core/utils/core/noteNameToMidi";

class TonePlayer extends Player {
    toneColor: ToneColor = {};
    bpm: number = 120;

    constructor({context}: { context: AudioContext }) {
        super({context})
    }

    addToneColor(toneColor: ToneColor) {
        this.toneColor = toneColor;
    }

    async _setSource(midi: Midi) {
        if (Object.keys(this.toneColor).length === 0) {
            console.error("音频文件不存在，请调用addToneColor方法添加音频")
            return
        }
        if (!this.toneColor[midi]) {
            console.error("note不存在于传入的音色中")
            return
        }
        this.source = this.context.createBufferSource();
        // 节点连接
        this.source.connect(this.gainNode).connect(this.context.destination);
        // 传入音频数据
        this.source.buffer = await this.context.decodeAudioData(base64ToArrayBuffer(this.toneColor[midi]));
    }

    // 重写play
    async playMIDI(midi: NoteString | Midi, loop: boolean = false) {

        const noteName = ((typeof midi === 'number') ? midiToNoteName(midi) : midi) as NoteName

        const m: Midi = noteNameToMidi(noteName)
        await this._setSource(m)
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

    stopMIDI() {
        if (this.source) {
            this.source.stop();
            // disconnect让source更快的释放资源
            this.source.disconnect();
        }
        this.pauseTime = 0;
        this.startTime = 0
    }

    async tapMiDI(midi: NoteString | Midi, duration: ToneDuration) {
        await this.playMIDI(midi, true)
        const timeStamp = toneDurationToTimestamp(duration, this.bpm)
        setTimeout(() => {
            this.stopMIDI()
        }, timeStamp)
    }
}

export default TonePlayer;