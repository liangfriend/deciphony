class Player {
    context:AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    source: AudioBufferSourceNode; // 音频源
    constructor() {

        this.context = new AudioContext({
            latencyHint: 'interactive', // 或 'playback', 'balanced'
            sampleRate: 44100           // 也可以指定采样率（默认一般是 44100Hz）
        });
        this.gainNode = this.context.createGain();
        this.source = this.context.createBufferSource();
        // 节点连接
        this.source.connect(this.gainNode).connect(this.context.destination);
    }

}