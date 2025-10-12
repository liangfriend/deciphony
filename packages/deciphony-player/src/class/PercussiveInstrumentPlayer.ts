// // 打击乐器播放器
// import InstrumentPlayer from "./InstrumentPlayer";
// import {WindInstrumentEnum} from "../types/enum";
//
// class WindInstrumentPlayer extends InstrumentPlayer {
//     audioWorklet: AudioWorkletNode | null = null
//     micContext: AudioContext = new AudioContext() // 麦克风上下文
//     analyserNode: AnalyserNode | null = null
//     microphoneSource: MediaStreamAudioSourceNode | null = null
//
//
//     constructor({context}: { context: AudioContext }) {
//         super({context})
//     }
//
//     /**
//      * 将 MIDI 转换为频率 (Hz)
//      */
//     private midiToHz(midi: number): number {
//         return 440 * Math.pow(2, (midi - 69) / 12);
//     }
//
//     async createAudioProcessor(instrument: WindInstrumentEnum) {
//         this.context = new AudioContext();
//         const instrumentInfo = this.getInstrumentInfo(instrument)
//         await this.context.audioWorklet.addModule(
//             new URL(instrumentInfo.path, import.meta.url).href
//         );
//
//         this.audioWorklet = new AudioWorkletNode(this.context, instrumentInfo.registerName, {});
//         // 平滑调频
//         // this.audioWorklet.parameters.get('frequency').linearRampToValueAtTime(880, this.context.currentTime + 2);
//         this.audioWorklet.connect(this.context!.destination);
//         await this.createMicAnalyzer()
//     }
//
//     private async createMicAnalyzer() {
//         // 获取麦克风输入流
//         const stream = await navigator.mediaDevices.getUserMedia({audio: true});
//         this.microphoneSource = this.micContext.createMediaStreamSource(stream);
//
//         // 创建一个 AnalyserNode 来分析麦克风的音频数据
//         this.analyserNode = this.micContext.createAnalyser();
//         this.analyserNode.fftSize = 256; // 设置 FFT 大小
//         this.analyserNode.smoothingTimeConstant = 0.9; // 平滑时间常量
//         this.microphoneSource.connect(this.analyserNode);
//         // this.analyserNode.connect(this.micContext.destination);
//
//         // 开始分析麦克风数据并实时更新音量参数
//         this.analyzeMicData();
//     }
//
//     private analyzeMicData() {
//         const bufferLength = this.analyserNode!.frequencyBinCount;
//         const dataArray = new Uint8Array(bufferLength);
//
//         const updateVolume = () => {
//             // 获取频域数据
//             this.analyserNode!.getByteFrequencyData(dataArray);
//
//             // 计算音量（取频率数据的平均值）
//             let sum = 0;
//             for (let i = 0; i < bufferLength; i++) {
//                 sum += dataArray[i];
//             }
//
//             // 计算平均音量，作为 volume 的新值（0 到 1 的范围）
//             const averageVolume = sum / bufferLength;
//             const normalizedVolume = averageVolume / 256; // normalize to 0-1 range
//
//             // 通过 AudioWorkletNode 更新音量参数
//             if (this.audioWorklet) {
//                 this.audioWorklet.parameters.get('volume')!.setValueAtTime(normalizedVolume, this.micContext.currentTime);
//             }
//
//             // 每 50ms 更新一次音量
//             requestAnimationFrame(updateVolume);
//         };
//
//         // 开始音量分析
//         updateVolume();
//     }
//
//     play() {
//         if (this.context?.state === "suspended") {
//             this.context.resume();
//         }
//         if (this.micContext?.state === "suspended") {
//             this.micContext.resume();
//         }
//     }
//
//     stop() {
//         this.context.suspend();
//         this.micContext.suspend();
//     }
//
//     updateParameters(data: Record<string, any>) {
//         this.audioWorklet?.port.postMessage(data);
//     }
// }
//
// export default InstrumentPlayer;
