class InstrumentPlayer {
    private audioContext: AudioContext;
    private node: AudioWorkletNode | null = null;

    constructor() {
        this.audioContext = new AudioContext();
        this.init();
    }

    private async init() {
        await this.audioContext.audioWorklet.addModule("./WhiteNoiseProcessor.js");
        this.node = new AudioWorkletNode(this.audioContext, "white-noise-processor");
        this.node.connect(this.audioContext.destination);
    }

    /**
     * 将 MIDI 转换为频率 (Hz)
     */
    private midiToHz(midi: number): number {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /**
     * 吹奏类乐器：持续发声
     */
    public noteOn(midi: number, volume: number) {
        if (!this.node) return;
        const frequency = this.midiToHz(midi);
        this.node.port.postMessage({type: "noteOn", frequency, volume});
    }

    public noteOff() {
        if (!this.node) return;
        this.node.port.postMessage({type: "noteOff"});
    }

    /**
     * 打击类乐器：触发发声（自动停止）
     */
    public playNote(midi: number, volume: number, duration: number) {
        if (!this.node) return;
        const frequency = this.midiToHz(midi);
        this.node.port.postMessage({type: "playNote", frequency, volume, duration});
    }
}

export default InstrumentPlayer;
