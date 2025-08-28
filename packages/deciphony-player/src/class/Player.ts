class Player {
    context: AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    source: AudioBufferSourceNode | null; // 音频源
    panner: StereoPannerNode;
    state: 'stopped' | 'playing' | 'paused';
    audioBuffer: AudioBuffer | null;
    pauseTime: number;
    startTime: number;

    constructor() {
        this.pauseTime = 0;
        this.startTime = 0;
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

    private _setSource() {
        this.source = this.context.createBufferSource();
        // 节点连接
        this.source.connect(this.gainNode).connect(this.panner).connect(this.context.destination);
        // 传入音频数据
        this.source.buffer = this.audioBuffer;
    }

    // 音量调节
    setVolume(volume: number = 1) {
        this.gainNode.value = volume
    }

    async addAudio(url: string) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);

    }

    play(onended: ((this: AudioScheduledSourceNode, ev: Event) => any) | null) {
        if (!this.source) {
            console.error("音频文件不存在，请调用addAudio方法添加音频")
            return
        }
        // source是一次性的，stop后就失效了，需要新创建
        this._setSource()
        this.source.onended = onended
        // 播放
        this.source.start(0, this.pauseTime); // 从 pauseTime 的位置继续播放
        this.startTime = this.pauseTime
        this.state = 'playing';

    }

    pause() {
        if (['paused', 'stopped'].includes(this.state)) return;
        if (!this.source) {
            console.error("音频文件不存在，请调用addAudio方法添加音频")
            return
        }
        this.source.stop();
        this.pauseTime = this.context.currentTime - this.startTime;
        this.state = 'paused';
    }

    stop() {
        if (this.source) {
            this.source.stop();
            // disconnect让source更快的释放资源
            this.source.disconnect();
        }
        this.pauseTime = 0;
        this.state = 'stopped';
    }
}

export default Player;