import Player from "./Player";

class AudioPlayer extends Player {

    private _onProgress: ((current: number, duration: number) => void) | null = null;
    private _onEnd: (() => void) | null = null;
    private _progressRaf: number | null = null;
    constructor() {
        super()
    }
    set onProgress(cb: (current: number, duration: number) => void) {
        this._onProgress = cb;
    }
    set onEnd(cb: () => void) {
        this._onEnd = cb;
    }
    private _setSource() {
        if (!this.audioBuffer) {
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

    async addAudio(input: string | AudioBuffer) {
        if (typeof input === 'string') {
            const response = await fetch(input);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        } else {
            this.audioBuffer = input;
        }
    }

    async play() {
        if (this.state === 'playing') return;
        this._setSource();
        if (!this.source) return;

        if (this.context.state === 'suspended') {
            await this.context.resume(); // 有些浏览器首次需手动激活音频上下文
        }
        // 播放
        this.source.start(0, this.pauseTime); // 从 pauseTime 的位置继续播放
        this.startTime = this.context.currentTime;
        this.state = 'playing';
        this.source.onended = () => {
            this.stop();
            this._onEnd && this._onEnd();
        };
        if (this._onProgress && this.audioBuffer) {
            const tick = () => {
                if (this.state !== 'playing') return; // 停止/暂停时退出循环
                const current = this.pauseTime + (this.context.currentTime - this.startTime);
                this._onProgress!(current, this.audioBuffer!.duration);
                this._progressRaf = requestAnimationFrame(tick);
            };
            this._progressRaf = requestAnimationFrame(tick);
        }
    }

    pause() {
        if (['paused', 'stopped'].includes(this.state)) return;
        if (!this.source) {
            console.error('音频文件不存在，请调用addAudio方法添加音频');
            return;
        }
        // 暂停时钟计时
        this.context.suspend();
        this.pauseTime += this.context.currentTime - this.startTime;
        this.state = 'paused';
        if (this._progressRaf) {
            cancelAnimationFrame(this._progressRaf);
            this._progressRaf = null;
        }
    }

    stop() {
        if (this.source) {
            this.source.stop();
            // disconnect让source更快的释放资源
            this.source.disconnect();
        }
        this.pauseTime = 0;
        this.startTime = 0;
        this.state = 'stopped';
        // …你的原有 stop 逻辑…
        if (this._progressRaf) {
            cancelAnimationFrame(this._progressRaf);
            this._progressRaf = null;
        }
        // 保证下次 play 可以正常运行
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}

export default Player;