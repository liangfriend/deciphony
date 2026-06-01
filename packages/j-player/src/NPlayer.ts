import { _audioContext, getGlobalToneBuffer } from './ContextManager';
import { PlaySequence, PlaySequenceItem, Sequence, ToneColor, Unit256 } from './types';
import { sequenceToPlaySequence, toSeconds } from './sequenceUtils';
import { v4 as uuidv4 } from 'uuid';

class NPlayer {
  private _gainNode: GainNode;
  private _state: 'stopped' | 'playing' | 'paused' = 'stopped'; // 播放状态
  private _endNotePauseMark: boolean; // 最后一个音符暂停时的标记
  private _endNoteRemainTime: number; // 最后一个音符暂停时的剩余播放时间
  private _sequence: PlaySequence = []; // 将要播发的序列，由外部传入sequence转换+复制而来
  private _bpm = 120; // bpm
  private _beatUnit = 4; // 节拍单位，这个用于bpm的计算。默认为4。
  private _sourceMap: Map<
    string,
    { source: AudioBufferSourceNode; noteGain: GainNode; playContextTime: number }
  > = new Map(); // 每音符 source → 粒度 gain → 主音量 gain
  private _timerMap: Map<
    string,
    { timerId: ReturnType<typeof setTimeout>; playContextTime: number }
  > = new Map(); // 存储timerMap
  private _triggerSourceMap: Map<
    string,
    { source: AudioBufferSourceNode; gainNode: GainNode; playContextTime: number }
  > = new Map(); // 存储单音符播放时的sourceMap
  /** 以 256 分音符为粒度的曲谱位置 */
  private _startPosition: Unit256 = 0; // 播放状态变为playing时的时间
  private _pausePosition: Unit256 = 0; // 播放状态变为paused时的时间
  private _currentPosition: Unit256 = 0; // 实时变化的当前播放时间（其实是获取的时候会变化，正常不操作情况是根据checkTimer变化）
  private _anchorContextTime = 0; // _currentPosition变化时，conextTime的值
  private _sequenceCopyCount = 3; // 序列复制数量，这个一般情况下，不用变
  private _baseSequence: PlaySequence = []; // 未复制的playSequence

  private _rate = 1; // 播放速率
  private _checkTimer: NodeJS.Timeout | null = null; // 检查定时器timer
  private _checkTime = 50; // 检查间隔时长
  private _checkDuration = 500; // 检查区间

  private _onProgressStart: ((progress: number, data: any) => void) | null = null; // 过程回调(开始播放)
  private _onProgressEnd: ((progress: number, data: any) => void) | null = null; // 过程回调(播放完成)
  private _onEnd: (() => void) | null = null; // 结束回调
  private _loop: boolean = false; // 是否循环播放
  private _bufferCache = new Map<string, AudioBuffer>(); // 音色处理后的二进制缓存
  /** 按 gainNodeKey 分组：总 gain → keyGain → 各音符 noteGain；创建后常驻直至 releaseKeyGain / clearAllKeyGains / dispose */
  private _keyGainMap = new Map<string, GainNode>();
  constructor(option: { checkTime: number; checkDuration: number }) {
    this._endNotePauseMark = false;
    this._endNoteRemainTime = 0;
    this._checkTime = option.checkTime ?? 50;
    this._checkDuration = option.checkDuration ?? 500;
    this._gainNode = this._context.createGain();
    this._gainNode.connect(this._context.destination);
  }
  private get _context(): AudioContext {
    if (!_audioContext) {
      throw new Error('先调用startJPlayer激活音频上下文');
    }
    return _audioContext;
  }

  /** 秒 → 256 时值单位 (考虑 rate) */
  private _secTo256(sec: number): number {
    return (sec * this._bpm * 256 * this._rate) / (60 * this._beatUnit);
  }

  /** 256 时值单位 → 秒 (考虑 rate，用于调度偏移) */
  private _256ToSecWithRate(dur: number): number {
    return (dur * this._beatUnit * 60) / (256 * this._bpm * this._rate);
  }

  /** 256 时值单位 → 秒 (不含 rate，用于音符持续时长) */
  private _256ToSec(dur: number): number {
    return toSeconds(dur, this._bpm, this._beatUnit);
  }

  private _getOrCreateKeyGain(key: string): GainNode {
    let node = this._keyGainMap.get(key);
    if (node) return node;
    node = this._context.createGain();
    node.gain.value = 1;
    node.connect(this._gainNode);
    this._keyGainMap.set(key, node);
    return node;
  }

  /** 设置某分组 key 的线性增益（与总 volume、音符 velocity 相乘）；若节点尚未存在会先创建并接到总线 */
  setKeyGain(key: string, linearGain: number): void {
    const k = key.trim();
    if (!k) return;
    const g = this._getOrCreateKeyGain(k);
    g.gain.value = linearGain;
  }

  /** 移除分组 gain 节点并从总线上断开（无该 key 时忽略） */
  releaseKeyGain(key: string): void {
    const k = key.trim();
    if (!k) return;
    const node = this._keyGainMap.get(k);
    if (!node) return;
    try {
      node.disconnect();
    } catch {
      /* noop */
    }
    this._keyGainMap.delete(k);
  }

  /** 移除所有分组 gain 节点 */
  clearAllKeyGains(): void {
    for (const k of [...this._keyGainMap.keys()]) {
      this.releaseKeyGain(k);
    }
  }

  // 添加音色 传入midi:url格式
  async addToneColor(name: string, toneColor: ToneColor): Promise<void> {
    const ctx = this._context;
    for (const [midiStr, dataUrl] of Object.entries(toneColor)) {
      const midi = Number(midiStr);
      if (Number.isNaN(midi) || !dataUrl) continue;
      const cacheKey = `${name}:${midi}`;
      try {
        const res = await fetch(dataUrl);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        this._bufferCache.set(cacheKey, buffer);
      } catch (err) {
        console.warn('NPlayer音色添加失败', { name, midi, err });
      }
    }
  }

  set volume(volume: number) {
    this._gainNode.gain.value = volume;
  }
  get volume() {
    return this._gainNode.gain.value;
  }

  set bpm(value: number) {
    if (this._bpm === value) return;
    this._bpm = Math.max(1, value);
    if (this._state === 'playing') {
      this._clearFutureSourcesAndTimers();
      this._check();
    }
  }
  get bpm() {
    return this._bpm;
  }
  // 设置bpm依据的拍子
  set beatUnit(value: number) {
    if (this._beatUnit === value) return;
    this._beatUnit = Math.max(1, value);
    if (this._state === 'playing') {
      this._clearFutureSourcesAndTimers();
      this._check();
    }
  }
  get beatUnit() {
    return this._beatUnit;
  }

  set rate(rate: number) {
    if (this._rate === rate) return;
    const oldRate = this._rate;
    this._rate = rate;
    if (this._state === 'playing') {
      this._clearFutureSourcesAndTimers();
      const deltaSec = this._context.currentTime - this._anchorContextTime;
      this._currentPosition += (deltaSec * this._bpm * 256 * oldRate) / (60 * this._beatUnit);
      this._anchorContextTime = this._context.currentTime;
      this._check();
    }
  }
  get rate() {
    return this._rate;
  }

  set loop(loop: boolean) {
    this._loop = loop;
    if (!loop) {
      this._clearFutureSourcesAndTimers();
    }
  }
  get loop() {
    return this._loop;
  }

  set onProgressStart(cb: (progress: number, data: any) => void) {
    this._onProgressStart = cb;
  }
  set onProgressEnd(cb: (progress: number, data: any) => void) {
    this._onProgressEnd = cb;
  }
  set onEnd(cb: () => void) {
    this._onEnd = cb;
  }
  // 设置播放序列
  setSequence(sequence: Sequence) {
    this._baseSequence = sequenceToPlaySequence(sequence);
    this._sequence = [];
    this._fillSequence();
  }
  // 设置播放序列：直接传入playSequence的形式
  setPlaySequence(sequence: PlaySequence) {
    this._baseSequence = sequence;
    this._sequence = [];
    this._fillSequence();
  }
  // 通过baseSequence和copyCount填充sequence,
  // 如果loop=false,需要删减多余的序列，虽然fireOnEnd会在最后一个音符处结束播放，但是下一个音符是有可能在onEnd之前触发的。
  private _fillSequence() {
    if (this._baseSequence.length === 0) return;
    if (!this._loop) {
      // loop=false：不再按 copyCount 扩展，仅保留到第一个 end（包含）
      /*
       * 这个firstEndInCurrent splice的逻辑用于中途切换loop为false
       * */
      const firstEndInCurrent = this._sequence.findIndex((item) => item.end);
      if (firstEndInCurrent !== -1) {
        if (firstEndInCurrent < this._sequence.length - 1) {
          this._sequence.splice(firstEndInCurrent + 1);
        }
        return;
      }
      if (this._sequence.length > 0) {
        return;
      }

      const firstEndInBase = this._baseSequence.findIndex((item) => item.end);
      const boundedBase =
        firstEndInBase === -1
          ? this._baseSequence
          : this._baseSequence.slice(0, firstEndInBase + 1);
      this._sequence = boundedBase.map((elem: PlaySequenceItem) => ({
        ...elem,
        id: uuidv4()
      })) as PlaySequence;
      return;
    }

    const currentRounds = this._sequence.length / this._baseSequence.length;
    const needRounds = Math.max(0, this._sequenceCopyCount - currentRounds);
    const fillCount = Math.ceil(needRounds);
    const roundDur =
      this._baseSequence[this._baseSequence.length - 1].playTime +
      this._baseSequence[this._baseSequence.length - 1].duration;
    let nextStart = 0;
    if (this._sequence.length) {
      nextStart =
        this._sequence[this._sequence.length - 1].playTime +
        this._sequence[this._sequence.length - 1].duration;
    }
    for (let i = 0; i < fillCount; i++) {
      const offset = this._sequence.length ? roundDur * i + nextStart : 0;
      // 浅拷贝，保证用户传入的data引用不变
      const seq = this._baseSequence.map((elem: PlaySequenceItem) => ({
        ...elem,
        playTime: elem.playTime + offset,
        id: uuidv4()
      })) as PlaySequence;
      this._sequence = this._sequence.concat(seq);
    }
  }

  async play() {
    if (this._state === 'playing') return;
    this._state = 'playing';
    this._startPosition = this._pausePosition;
    this._currentPosition = this._startPosition;
    this._anchorContextTime = this._context.currentTime;
    if (this._endNotePauseMark) {
      await new Promise((resolve) => {
        setTimeout(() => {
          this.stop();
          resolve({});
        }, this._endNoteRemainTime * 1000);
      });
    }
    this._check();
  }

  private _check() {
    if (this._checkTimer) {
      clearInterval(this._checkTimer);
      this._checkTimer = null;
    }
    // 这里耗时2成
    this._addAndPlaySource();
    this._checkTimer = setInterval(() => {
      this._addAndPlaySource();
    }, this._checkTime);
  }
  // 拿到音色buffer
  private _getBuffer(toneColorName: string, midi: number): AudioBuffer | null {
    const key = `${toneColorName}:${midi}`;
    return this._bufferCache.get(key) ?? getGlobalToneBuffer(key) ?? null;
  }
  // 清除未来(还未播放)的source和timer
  private _clearFutureSourcesAndTimers() {
    const now = this._context.currentTime;
    const keepSources = new Map<
      string,
      { source: AudioBufferSourceNode; noteGain: GainNode; playContextTime: number }
    >();
    this._sourceMap.forEach((entry, id) => {
      if (entry.playContextTime < now) {
        keepSources.set(id, entry);
      } else {
        entry.source.onended = null;
        entry.source.stop();
        try {
          entry.source.disconnect();
        } catch {
          /* noop */
        }
        try {
          entry.noteGain.disconnect();
        } catch {
          /* noop */
        }
      }
    });
    this._sourceMap = keepSources;

    const keepTimers = new Map<
      string,
      { timerId: ReturnType<typeof setTimeout>; playContextTime: number }
    >();
    this._timerMap.forEach((entry, id) => {
      if (entry.playContextTime < now) {
        keepTimers.set(id, entry);
      } else {
        clearTimeout(entry.timerId);
      }
    });
    this._timerMap = keepTimers;
  }
  // 清除所有的source和timer
  private _clearAllSourcesAndTimers() {
    this._timerMap.forEach((entry) => clearTimeout(entry.timerId));
    this._timerMap.clear();
    this._sourceMap.forEach((s) => {
      s.source.onended = null;
      s.source.stop();
      try {
        s.source.disconnect();
      } catch {
        /* noop */
      }
      try {
        s.noteGain.disconnect();
      } catch {
        /* noop */
      }
    });
    this._sourceMap.clear();
  }
  // 找出_sequence中结束时间，用于抛出onEnd回调
  private _getMaxEnd(): Unit256 {
    if (!this._sequence.length) return 0;
    let max = 0;
    for (const e of this._sequence) {
      const end = e.playTime + e.duration;
      if (end > max) max = end;
      if (e.end) break;
    }
    return max;
  }
  // 触发结束回调
  private _fireOnEnd() {
    if (this._state === 'stopped') return;
    this.stop();
  }
  /*
   * 核心函数， 检查器每次检查时触发
   *
   * */
  private _addAndPlaySource() {
    // 更新&记录当前进度
    const deltaSec = this._context.currentTime - this._anchorContextTime;
    this._currentPosition += this._secTo256(deltaSec);
    this._anchorContextTime = this._context.currentTime;
    // 过滤掉已经播放完成的音符
    this._sequence = this._sequence.filter((e) => e.playTime + e.duration > this._currentPosition);
    // 填充序列
    this._fillSequence();
    const checkWindow = this._secTo256(this._checkDuration / 1000);
    // 过滤出准备放入sourceMap的音符
    const filtered = this._sequence.filter((e) => {
      return (
        !this._sourceMap.has(e.id) &&
        e.playTime >= this._currentPosition &&
        e.playTime < this._currentPosition + checkWindow
      );
    });
    for (const e of filtered) {
      const buffer = this._getBuffer(e.toneColor, e.midi);
      // midi = 0认为是休止符，该有的回调都要有
      if ((!buffer || this._state !== 'playing') && e.midi !== 0) continue;

      const offset256 = e.playTime - this._currentPosition;
      const offsetSec = this._256ToSecWithRate(offset256);
      const contextPlayTime = this._context.currentTime + offsetSec;
      const durationSec = this._256ToSec(e.duration);

      const source = this._context.createBufferSource();
      // midi = 0 的情况下，这里buffer是null, 但是没关系，不会报错
      source.buffer = buffer;
      const noteGain = this._context.createGain();
      noteGain.gain.value = e.velocity ?? 1;
      source.connect(noteGain);
      const keyTrimmed = e.gainNodeKey?.trim();
      if (keyTrimmed) {
        noteGain.connect(this._getOrCreateKeyGain(keyTrimmed));
      } else {
        noteGain.connect(this._gainNode);
      }
      source.start(contextPlayTime);
      source.stop(contextPlayTime + durationSec);
      this._sourceMap.set(e.id, { source, noteGain, playContextTime: contextPlayTime });

      const itemEnd = e.end;
      source.onended = () => {
        this._sourceMap.delete(e.id);
        try {
          source.disconnect();
        } catch {
          /* noop */
        }
        try {
          noteGain.disconnect();
        } catch {
          /* noop */
        }
        if (itemEnd && !this._loop) {
          this._fireOnEnd();
        }
        // 如果希望播放完再回调，可以把onProgress迁移到这里
        const progress = this._256ToSec(
          this._currentPosition +
            this._secTo256(this._context.currentTime - this._anchorContextTime)
        );
        this._onProgressEnd && this._onProgressEnd(progress, e.data);
      };
      if (!this._timerMap.has(e.id)) {
        // 这里函数执行时，表示某个音符开始播放时
        const timerId = setTimeout(() => {
          this._timerMap.delete(e.id);
          // 如果希望播放前再回调，可以把onProgress迁移到这里
          const progress = this._256ToSec(
            this._currentPosition +
              this._secTo256(this._context.currentTime - this._anchorContextTime)
          );
          this._onProgressStart && this._onProgressStart(progress, e.data);
        }, offsetSec * 1000); // setTimout和source.onended不一定哪个会先执行，所以这里可能有不一致的行为，+100确保onEnd先执行,+100我去掉了，使用者自己去处理
        this._timerMap.set(e.id, { timerId, playContextTime: contextPlayTime });
      }
    }
  }

  pause() {
    if (this._state !== 'playing') return;
    this._state = 'paused';
    if (this._checkTimer) {
      clearInterval(this._checkTimer);
      this._checkTimer = null;
    }
    const deltaSec = this._context.currentTime - this._anchorContextTime;
    this._pausePosition = this._currentPosition + this._secTo256(deltaSec);
    /* 如果loop=false且sequence.length为0,说明到了最后一个了，因为无法触发onEnd，所以要加一个标记*/
    if (this._sequence.length === 1 && !this._loop) {
      this._endNotePauseMark = true;
      const playContextTime = this._sourceMap.get(this._sequence[0].id)?.playContextTime;
      if (playContextTime) {
        this._endNoteRemainTime =
          this._256ToSecWithRate(this._sequence[0].duration) -
          (this._context.currentTime - playContextTime);
      }
    }
    this._clearFutureSourcesAndTimers();
  }

  stop() {
    if (this._state === 'stopped') return;
    this._state = 'stopped';
    this._endNotePauseMark = false;
    this._endNoteRemainTime = 0;
    this._onEnd?.();
    this._sequence = [];
    if (this._checkTimer) {
      clearInterval(this._checkTimer);
      this._checkTimer = null;
    }
    this._pausePosition = 0;
    this._clearAllSourcesAndTimers();
  }

  // ===========================================单音符播放======================================================
  trigger(param: {
    id?: string;
    midi: number;
    toneColor: string;
    volume?: number;
    offset?: number;
    duration?: number;
    onEnd?: () => void;
  }): string {
    const id = param.id?.trim() ? param.id : uuidv4();
    const buffer = this._getBuffer(param.toneColor, param.midi);
    if (!buffer) {
      throw new Error(
        `NPlayer.trigger: 无 buffer，请先 addToneColor('${param.toneColor}', …) 且包含 midi ${param.midi}`
      );
    }
    this.release({ id });
    const source = this._context.createBufferSource();
    source.buffer = buffer;
    const gainNode = this._context.createGain();
    gainNode.gain.value = param.volume != null ? param.volume : 1;
    source.connect(gainNode);
    gainNode.connect(this._context.destination);
    const delay = Math.max(0, param.offset ?? 0);
    const playContextTime = this._context.currentTime + delay;
    const playSec = param.duration != null && param.duration > 0 ? param.duration : buffer.duration;
    source.start(playContextTime);
    source.stop(playContextTime + playSec);
    source.onended = () => {
      source.onended = null;
      try {
        source.disconnect();
      } catch {
        /* noop */
      }
      try {
        gainNode.disconnect();
      } catch {
        /* noop */
      }
      param.onEnd?.();
      this._triggerSourceMap.delete(id);
    };
    this._triggerSourceMap.set(id, { source, gainNode, playContextTime });
    return id;
  }

  release(param: { id: string }) {
    const entry = this._triggerSourceMap.get(param.id);
    if (!entry) return;
    entry.source.onended = null;
    try {
      entry.source.stop();
    } catch {
      /* noop */
    }
    try {
      entry.source.disconnect();
    } catch {
      /* noop */
    }
    try {
      entry.gainNode.disconnect();
    } catch {
      /* noop */
    }
    this._triggerSourceMap.delete(param.id);
  }

  releaseAll() {
    for (const id of [...this._triggerSourceMap.keys()]) {
      this.release({ id });
    }
  }

  dispose() {
    this.releaseAll();
    this.stop();
    this._bufferCache.clear();
    this.clearAllKeyGains();
  }
}

export default NPlayer;
