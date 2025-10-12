class AudioPlayer {
    context: AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    source: AudioBufferSourceNode | null = null; // 音频源
    state: 'stopped' | 'playing' | 'paused' = 'stopped';
    audioBuffer: AudioBuffer | null = null;
    private _pauseTime: number = 0; // 相对音频时长的播放暂停时间
    private _startTime: number = 0; // 相对context.currentTime的播放开始时间，用于计算pauseTime


    private _onProgress: ((current: number, duration: number) => void) | null = null;
    private _onEnd: (() => void) | null = null;
    private _progressRaf: number | null = null;
    private _current: number = 0; // 相对音频时长的当前播放时长


    constructor() {
        this.context = new AudioContext()
        this.gainNode = this.context.createGain();
    }

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

    // 音量调节
    setVolume(volume: number = 1) {
        this.gainNode.gain.value = volume
    }

    // 播放过程进度回调 current 当前播放时长 duration 音频总时长
    set onProgress(cb: (current: number, duration: number) => void) {
        this._onProgress = cb;
    }

    // 播放结束回调
    set onEnd(cb: () => void) {
        this._onEnd = cb;
    }

    get current() {
        return this._current
    }

    set current(value: number) {
        if (!this.audioBuffer) return;

        // 限制范围，不能小于0或大于总时长
        const duration = this.audioBuffer.duration;
        const newTime = Math.max(0, Math.min(value, duration));

        this._current = newTime;
        this.startTime =
            this.pauseTime = newTime;   // 同步修改 pauseTime
        // 如果需要立即刷新进度 UI
        if (this._onProgress) {
            this._onProgress(this._current, duration);
        }
    }

    get duration() {
        return this.audioBuffer?.duration || 0
    }

    // 声道数
    get numberOfChannels() {
        return this.audioBuffer?.numberOfChannels || 0
    }

    // audioBuffer长度
    get bufferLength() {
        return this.audioBuffer?.length || 0
    }

    // 采样率
    get sampleRate() {
        return this.audioBuffer?.sampleRate || 0
    }


    // 获取音频通道数据
    getChannelData(channel: number = 0): Float32Array<ArrayBuffer> | undefined {
        return this.audioBuffer?.getChannelData(channel)
    }

    // 获取采样率
    getSampleRate() {
        return this.audioBuffer?.sampleRate || 0
    }

    // 音频总时长（秒）
    getDuration(): number {
        return this.audioBuffer?.duration || 0
    }

    // 获取指定时间点的采样索引
    getSampleIndexAtTime(time: number): number {
        if (!this.audioBuffer) return 0
        // time 秒 → 采样点索引
        return Math.floor(time * this.audioBuffer.sampleRate)
    }

    // 获取指定采样点对应的时间（秒）
    getTimeAtSampleIndex(index: number): number {
        if (!this.audioBuffer) return 0
        return index / this.audioBuffer.sampleRate
    }

    private _setSource() {
        if (!this.audioBuffer) {
            console.error("音频文件不存在，请调用addAudio方法添加音频")
            return
        }
        this.source = this.context.createBufferSource();
        // 节点连接
        this.source.connect(this.gainNode).connect(this.context.destination);
        // 传入音频数据
        this.source.buffer = this.audioBuffer;
    }


    async addAudio(input: string | AudioBuffer | ArrayBuffer) {
        if (typeof input === "string") {
            // URL 或文件路径
            const response = await fetch(input);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        } else if (input instanceof ArrayBuffer) {
            // 直接是 ArrayBuffer
            this.audioBuffer = await this.context.decodeAudioData(input);
        } else if (input instanceof AudioBuffer) {
            // 已经是解码好的 AudioBuffer
            this.audioBuffer = input;
        } else {
            throw new Error("Unsupported audio input type");
        }
    }


    async play() {
        if (this.state === 'playing') return;

        this._setSource();
        if (!this.source) return;

        if (this.context.state === 'suspended') {
            await this.context.resume();
        }

        // 记录开始播放的 context 时间
        this.startTime = this.context.currentTime;

        // 从 pauseTime 的位置继续
        this.source.start(this.context.currentTime, this.pauseTime);

        this.state = 'playing';

        this.source.onended = () => {

            // 如果是自然播放结束
            if (this.state === 'playing') {
                this.stop();
                this._onEnd && this._onEnd();
            }
        };

        if (this.audioBuffer) {
            const tick = () => {
                if (this.state !== 'playing') return;
                this._current = (this.context.currentTime - this.startTime + this.pauseTime);
                this._onProgress && this._onProgress!(this.current, this.audioBuffer!.duration);
                this._progressRaf = requestAnimationFrame(tick);
            };
            this._progressRaf = requestAnimationFrame(tick);
        }
    }

    pause() {
        if (this.state !== 'playing' || !this.source) return;
        if (this._progressRaf) {
            cancelAnimationFrame(this._progressRaf);
            this._progressRaf = null;
        }
        // 这里有可能要等一帧

        // 停止当前播放
        this.source.stop();
        this.source.disconnect();

        // 计算已播放时长
        this.pauseTime += this.context.currentTime - this.startTime;

        this.state = 'paused';


    }

    stop() {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }

        this.pauseTime = 0;
        // 防止pauseTime更新后，导致_onProgress传回current出错
        this.startTime = this.context.currentTime;
        this.current = 0;
        this.state = 'stopped';

        if (this._progressRaf) {
            cancelAnimationFrame(this._progressRaf);
            this._progressRaf = null;
        }
    }

}

export default AudioPlayer;