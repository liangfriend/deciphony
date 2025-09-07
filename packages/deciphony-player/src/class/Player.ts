class Player {
    context: AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    source: AudioBufferSourceNode | null; // 音频源
    panner: StereoPannerNode;
    state: 'stopped' | 'playing' | 'paused';
    audioBuffer: AudioBuffer | null;
    private _pauseTime: number;
    private _startTime: number;
    get startTime() {
        return this._startTime
    }

    set startTime(time: number) {
        this._startTime = time;
    }

    get pauseTime() {
        return this._pauseTime
    }

    set pauseTime(time: number) {
        this._pauseTime = time;
    }

    get currentTime() {
        return this.context.currentTime
    }


    constructor() {
        this._pauseTime = 0;
        this._startTime = 0;
        this.state = 'stopped';
        this.source = null
        this.audioBuffer = null;
        this.context = new AudioContext({
            latencyHint: 'interactive', // 或 'playback', 'balanced'
            sampleRate: 44100           // 也可以指定采样率（默认一般是 44100Hz）
        });
        this.gainNode = this.context.createGain();
        const pannerOptions = {pan: 0};
        this.panner = new StereoPannerNode(this.context, pannerOptions);
    }

    // 音量调节
    setVolume(volume: number = 1) {
        this.gainNode.gain.value = volume
    }


}

export default Player;