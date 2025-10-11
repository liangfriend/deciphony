class Player {
    context: AudioContext; // 音频上下文
    gainNode: GainNode; // 增益节点
    source: AudioBufferSourceNode | null = null; // 音频源
    state: 'stopped' | 'playing' | 'paused' = 'stopped';
    audioBuffer: AudioBuffer | null = null;
    private _pauseTime: number = 0; // 相对音频时长的播放暂停时间
    private _startTime: number = 0; // 相对context.currentTime的播放开始时间，用于计算pauseTime
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
        this.context = new AudioContext()
        this.gainNode = this.context.createGain();
    }

    // 音量调节
    setVolume(volume: number = 1) {
        this.gainNode.gain.value = volume
    }


}

export default Player;