class InstrumentPlayer {

    audioContext: AudioContext;
    audioWorklet: AudioWorkletNode | null

    constructor() {
        this.audioContext = new AudioContext();
        this.audioWorklet = null;
    }

    /**
     * 将 MIDI 转换为频率 (Hz)
     */
    private midiToHz(midi: number): number {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    async createAudioProcessor() {
        this.audioContext = new AudioContext();
        await this.audioContext.audioWorklet.addModule(
            new URL("./processors/WhiteNoiseProcessor.js", import.meta.url).href
        );
        this.audioWorklet = new AudioWorkletNode(this.audioContext, "my-audio-processor");
        this.audioWorklet.connect(this.audioContext!.destination);
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        const mic = this.audioContext.createMediaStreamSource(stream);
        mic.connect(this.audioWorklet);
    }

    play() {
        if (this.audioContext?.state === "suspended") {
            this.audioContext.resume();
        }
    }

    stop() {
        this.audioContext.suspend();
    }

    updateParameters(data: Record<string, any>) {
        this.audioWorklet?.port.postMessage(data);
    }
}

export default InstrumentPlayer;
