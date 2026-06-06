import { _audioContext } from './ContextManager';
class APlayer {
  private _gainNode: GainNode; // 增益节点
  private _source: AudioBufferSourceNode | null = null; // 音频源
  private _state: 'stopped' | 'playing' | 'paused' = 'stopped'; // 播放状态
  private _audioBuffer: AudioBuffer | null = null; // 音频数据
  private _pauseTime: number = 0; // 曲谱暂停时，曲谱已播放部分的时长
  private _startTime: number = 0; // 进入播放状态时，this._context.currentTime的值，用于计算pauseTime

  private _onProgress: ((current: number, duration: number) => void) | null = null;
  private _onEnd: (() => void) | null = null;
  private _progressRaf: number | null = null;
  private _current: number = 0; // 相对音频时长的当前播放时长

  private _rate: number = 1;
  private _loop: boolean = false;
  constructor() {
    this._gainNode = this._context.createGain();
  }
  private get _context(): AudioContext {
    if (!_audioContext) {
      throw new Error('先调用startJPlayer激活音频上下文');
    }
    return _audioContext;
  }

  // 音量调节
  set volume(volume: number) {
    this._gainNode.gain.value = volume;
  }

  get volume() {
    return this._gainNode.gain.value;
  }
  // 速度调节
  set rate(rate: number) {
    if (this._source) {
      this._source.playbackRate.value = rate;
    }
    this._rate = rate;
  }
  get rate() {
    return this._rate;
  }
  // 循环
  set loop(loop: boolean) {
    if (this._source) {
      this._source.loop = loop;
    }
    this._loop = loop;
  }

  get loop() {
    return this._loop;
  }

  // 播放过程进度回调 current 当前播放时长 duration 音频总时长
  set onProgress(cb: (current: number, duration: number) => void) {
    this._onProgress = cb;
  }

  // 播放到音频结尾触发。不包含手动stop
  set onEnd(cb: () => void) {
    this._onEnd = cb;
  }

  get current() {
    return this._current;
  }
  /*
   * 相当于在某一时刻暂停了，不会立即播放，但是play的时候会从value的位置play
   * */
  set current(value) {
    if (!this._audioBuffer) return;
    if (this._state === 'playing') {
      throw new Error('播放中更改进度执行seek()');
    }
    // 限制范围，不能小于0或大于总时长
    const duration = this._audioBuffer.duration;
    const newTime = Math.max(0, Math.min(value, duration));

    this._current = newTime;
    this._pauseTime = newTime; // 同步修改 pauseTime

    // 如果需要立即刷新进度 UI
    if (this._onProgress) {
      this._onProgress(this._current, duration);
    }
  }
  /*
   * 进度跳转
   * */
  async seek(value: number) {
    if (!this._audioBuffer) return;
    // 限制范围，不能小于0或大于总时长
    const duration = this._audioBuffer.duration;
    const newTime = Math.max(0, Math.min(value, duration));
    if (this._state === 'playing') {
      // 停止进度回调更新
      this.pause();
      this._pauseTime = newTime; // 同步修改 pauseTime
      await this.play();
    } else {
      this.current = value;
    }
  }
  // 音频时长
  get duration() {
    return this._audioBuffer?.duration || 0;
  }

  private _setSource() {
    if (!this._audioBuffer) {
      console.error('音频文件不存在，请调用setAudio方法添加音频');
      return;
    }
    this._source = this._context.createBufferSource();
    // 同步速度
    this._source.playbackRate.value = this._rate;
    // 同步循环
    this._source.loop = this._loop;
    // 节点连接
    this._source.connect(this._gainNode).connect(this._context.destination);
    // 传入音频数据
    this._source.buffer = this._audioBuffer;
  }

  async setAudio(input: string | AudioBuffer | ArrayBuffer) {
    if (typeof input === 'string') {
      // URL 或文件路径
      const response = await fetch(input);
      const arrayBuffer = await response.arrayBuffer();
      this._audioBuffer = await this._context.decodeAudioData(arrayBuffer);
    } else if (input instanceof ArrayBuffer) {
      // 直接是 ArrayBuffer
      this._audioBuffer = await this._context.decodeAudioData(input);
    } else if (input instanceof AudioBuffer) {
      // 已经是解码好的 AudioBuffer
      this._audioBuffer = input;
    } else {
      throw new Error('Unsupported audio input type');
    }
  }

  async play() {
    if (this._state === 'playing') return;
    this._setSource();
    if (!this._source) return;

    if (this._context.state === 'suspended') {
      await this._context.resume();
    }
    // 记录开始播放的 this._context 时间
    this._startTime = this._context.currentTime;
    // 从 pauseTime 的位置继续
    this._source.start(this._context.currentTime, this._pauseTime);

    this._state = 'playing';

    this._source.onended = () => {
      // 如果是自然播放结束
      if (this._state === 'playing') {
        this.stop();
        this._onEnd && this._onEnd();
      }
    };

    if (this._audioBuffer) {
      const tick = () => {
        if (this._state !== 'playing') return;
        this._current = this._context.currentTime - this._startTime + this._pauseTime;
        this._onProgress && this._onProgress!(this.current, this._audioBuffer!.duration);
        this._progressRaf = requestAnimationFrame(tick);
      };
      this._progressRaf = requestAnimationFrame(tick);
    }
  }

  pause() {
    if (this._state !== 'playing' || !this._source) return;
    // 停止进度回调更新
    if (this._progressRaf) {
      cancelAnimationFrame(this._progressRaf);
      this._progressRaf = null;
    }

    // 停止当前播放
    if (this._source) {
      this._source.onended = null; // 必须在stop之前置空，否则会被stop触发
      this._source.stop();
      this._source.disconnect();
      this._source = null;
    }

    // 计算已播放时长
    this._pauseTime += this._context.currentTime - this._startTime;
    this._state = 'paused';
  }

  stop() {
    if (this._source) {
      this._source.onended = null; // 必须在stop之前置空，否则会被stop触发
      this._source.stop();
      this._source.disconnect();
      this._source = null;
    }
    this._pauseTime = 0;
    // 防止pauseTime更新后，导致_onProgress传回current出错
    this._startTime = this._context.currentTime;
    this._current = 0;
    this._pauseTime = 0;
    this._state = 'stopped';
    // 停止进度回调监听
    if (this._progressRaf) {
      cancelAnimationFrame(this._progressRaf);
      this._progressRaf = null;
    }
  }

  /** 不再使用实例时调用：先 stop，再丢弃解码缓存与回调 */
  dispose() {
    this.stop();
    this._audioBuffer = null;
    this._onProgress = null;
    this._onEnd = null;
  }
}

export default APlayer;
