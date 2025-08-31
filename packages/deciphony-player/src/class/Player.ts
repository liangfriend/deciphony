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
        if(!this.audioBuffer) {
            console.error("音频文件不存在，请调用addAudio方法添加音频")
            return
        }
        this.source = this.context.createBufferSource();
        // 节点连接
        this.source.connect(this.gainNode).connect(this.panner).connect(this.context.destination);
        // 传入音频数据
        this.source.buffer = this.audioBuffer;
    }

    // 音量调节
    setVolume(volume: number = 1) {
        this.gainNode.gain.value = volume
    }

    async addAudio(url: string) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);

    }

    async play(onended: (() => any) | null) {
        if(this.state === 'playing') return
        this._setSource()
        if (!this.source) return
        this.source.onended = ()=>{
            this.stop()
            if(onended)onended()
        }
        if (this.context.state === 'suspended') {
            await this.context.resume(); // 有些浏览器首次需手动激活音频上下文
        }
        // 播放
        this.source.start(0, this.pauseTime); // 从 pauseTime 的位置继续播放
        this.startTime = this.context.currentTime;
        this.state = 'playing';

    }

    pause() {
        if (['paused', 'stopped'].includes(this.state)) return;
        if (!this.source) {
            console.error("音频文件不存在，请调用addAudio方法添加音频")
            return
        }
        // 暂停时钟计时
        this.context.suspend()
        this.pauseTime += this.context.currentTime - this.startTime;
        console.log(this.pauseTime)
        this.state = 'paused';
    }

    stop() {
        if (this.source) {
            this.source.stop();
            // disconnect让source更快的释放资源
            this.source.disconnect();
        }
        this.pauseTime = 0;
        this.startTime = 0
        this.state = 'stopped';
    }
}

export default Player;