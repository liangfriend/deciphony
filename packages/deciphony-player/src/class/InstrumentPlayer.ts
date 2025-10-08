import Player from "./Player";

class InstrumentPlayer extends Player {

    audioWorklet: AudioWorkletNode | null = null

    constructor({context}: { context: AudioContext }) {
        super({context})
    }

    /**
     * 将 MIDI 转换为频率 (Hz)
     */
    private midiToHz(midi: number): number {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    async createAudioProcessor() {
        this.context = new AudioContext();
        await this.context.audioWorklet.addModule(
            new URL("./processors/XiaoProcessor.js", import.meta.url).href
        );
        this.audioWorklet = new AudioWorkletNode(this.context, "xiao-processor", {
            parameterData: {
                frequency:440
            },
            processorOptions: { // 这里可以随便写点变量

            },
    });
        // 平滑调频
        // this.audioWorklet.parameters.get('frequency').linearRampToValueAtTime(880, this.context.currentTime + 2);
        this.audioWorklet.connect(this.context!.destination);
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        const mic = this.context.createMediaStreamSource(stream);
        mic.connect(this.audioWorklet);
    }

    play() {
        if (this.context?.state === "suspended") {
            this.context.resume();
        }
    }

    stop() {
        this.context.suspend();
    }

    updateParameters(data: Record<string, any>) {
        this.audioWorklet?.port.postMessage(data);
    }
}

export default InstrumentPlayer;
