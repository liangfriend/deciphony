// 吹奏乐器播放器
import InstrumentPlayer from "./InstrumentPlayer";
import {WindInstrumentEnum} from "../types/enum";

class WindInstrumentPlayer extends InstrumentPlayer {
    audioWorklet: AudioWorkletNode | null = null
    micContext: AudioContext = new AudioContext() // 麦克风上下文
    analyserNode: AnalyserNode | null = null
    microphoneSource: MediaStreamAudioSourceNode | null = null
    // 播放参数
    _airPressure: number = 0 // 播放气压
    embouchure?: number = 0// 吹嘴形态，这个还没想好

    constructor() {
        super()
    }

    async createAudioProcessor(instrument: WindInstrumentEnum) {
        this.context = new AudioContext();
        const instrumentInfo = this.getInstrumentInfo(instrument)
        console.log(instrumentInfo.path, new URL(instrumentInfo.path, import.meta.url));
        await this.context.audioWorklet.addModule(
            new URL(instrumentInfo.path, import.meta.url).href
        );

        this.audioWorklet = new AudioWorkletNode(this.context, instrumentInfo.registerName, {});
        this.audioWorklet.connect(this.context!.destination);
        await this.createMicAnalyzer()
    }

    private async createMicAnalyzer() {
        // 获取麦克风输入流
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        this.microphoneSource = this.micContext.createMediaStreamSource(stream);

        // 创建一个 AnalyserNode 来分析麦克风的音频数据
        this.analyserNode = this.micContext.createAnalyser();
        this.analyserNode.fftSize = 256; // 设置 FFT 大小
        this.analyserNode.smoothingTimeConstant = 0.9; // 平滑时间常量
        this.microphoneSource.connect(this.analyserNode);
        // this.analyserNode.connect(this.micContext.destination);

        // 开始分析麦克风数据并实时更新音量参数
        this.analyzeMicData();
    }

    private analyzeMicData() {
        const bufferLength = this.analyserNode!.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
            // 获取频域数据
            this.analyserNode!.getByteFrequencyData(dataArray);

            // 计算音量（取频率数据的平均值）
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }

            // 计算平均音量，作为 volume 的新值（0 到 1 的范围）
            const averageVolume = sum / bufferLength;
            const normalizedVolume = averageVolume / 256; // normalize to 0-1 range
            // 更新气压
            this.updateAirPressure(normalizedVolume);
            // 每 50ms 更新一次音量
            requestAnimationFrame(updateVolume);
        };

        // 开始音量分析
        updateVolume();
    }

    private updateFrequency(frequency: number) {
        if (this.audioWorklet) {
            this.audioWorklet.parameters.get('frequency')!.setValueAtTime(frequency, this.micContext.currentTime);
        }
    }

    private updateAirPressure(airPressure: number) {
        if (this.audioWorklet) {
            this.audioWorklet.parameters.get('airPressure')!.setValueAtTime(airPressure, this.micContext.currentTime);
        }
    }

    start() {
        if (this.context?.state === "suspended") {
            this.context.resume();
        }
        if (this.micContext?.state === "suspended") {
            this.micContext.resume();
        }
    }

    stop() {
        this.context.suspend();
        this.micContext.suspend();
    }

    // 更新频率
    setFrequency(value: number) {
        this.frequency = value;
        this.updateFrequency(value);
    }

    // 更新气压
    // set airPressure(value: number) {
    //     this._airPressure = value;
    //     this.updateAirPressure(value);
    // }


}

export default WindInstrumentPlayer;
