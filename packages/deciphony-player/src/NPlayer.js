import { _audioContext, getGlobalToneBuffer } from './ContextManager';
import { sequenceToPlaySequence, toSeconds } from './sequenceUtils';
import { resolveNoteEnvelope, scheduleAdsrOnGain, scheduleSequenceNoteEnvelope } from './envelope';
import { v4 as uuidv4 } from 'uuid';
class NPlayer {
    _gainNode;
    _state = 'stopped'; // 播放状态
    _endNotePauseMark; // 最后一个音符暂停时的标记
    _endNoteRemainTime; // 最后一个音符暂停时的剩余播放时间
    _sequence = []; // 将要播发的序列，由外部传入sequence转换+复制而来
    _sourceMap = new Map(); // 每音符 source → 粒度 gain → 主音量 gain
    _timerMap = new Map(); // 存储timerMap
    _triggerSourceMap = new Map(); // 存储单音符播放时的sourceMap
    /** 以 256 分音符为粒度的曲谱位置 */
    _startPosition = 0; // 播放状态变为playing时的时间
    _pausePosition = 0; // 播放状态变为paused时的时间
    _currentPosition = 0; // 实时变化的当前播放时间（其实是获取的时候会变化，正常不操作情况是根据checkTimer变化）
    _anchorContextTime = 0; // _currentPosition变化时，conextTime的值
    _sequenceCopyCount = 3; // 序列复制数量，这个一般情况下，不用变
    _baseSequence = []; // 未复制的playSequence
    _checkTimer = null; // 检查定时器timer
    _checkTime = 50; // 检查间隔时长
    _checkDuration = 500; // 检查区间
    _bufferCache = new Map(); // 音色处理后的二进制缓存
    /** 按 gainNodeKey 分组：总 gain → keyGain → 各音符 noteGain；创建后常驻直至 releaseKeyGain / clearAllKeyGains / dispose */
    _keyGainMap = new Map();
    /** 序列 play 的包络；null = 旧行为（无 A/D/R）。play() 无参时沿用上次。 */
    _playEnvelope = null;
    constructor(option) {
        this._endNotePauseMark = false;
        this._endNoteRemainTime = 0;
        this._checkTime = option.checkTime ?? 50;
        this._checkDuration = option.checkDuration ?? 500;
        this._gainNode = this._context.createGain();
        this._gainNode.connect(this._context.destination);
    }
    _bpm = 120; // bpm
    get bpm() {
        return this._bpm;
    }
    set bpm(value) {
        if (this._bpm === value)
            return;
        this._bpm = Math.max(1, value);
        if (this._state === 'playing') {
            this._clearFutureSourcesAndTimers();
            this._check();
        }
    }
    _beatUnit = 4; // 节拍单位，这个用于bpm的计算。默认为4。
    get beatUnit() {
        return this._beatUnit;
    }
    // 设置bpm依据的拍子
    set beatUnit(value) {
        if (this._beatUnit === value)
            return;
        this._beatUnit = Math.max(1, value);
        if (this._state === 'playing') {
            this._clearFutureSourcesAndTimers();
            this._check();
        }
    }
    _rate = 1; // 播放速率
    get rate() {
        return this._rate;
    }
    set rate(rate) {
        if (this._rate === rate)
            return;
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
    _onProgressStart = null; // 过程回调(开始播放)
    set onProgressStart(cb) {
        this._onProgressStart = cb;
    }
    _onProgressEnd = null; // 过程回调(播放完成)
    set onProgressEnd(cb) {
        this._onProgressEnd = cb;
    }
    _onEnd = null; // 结束回调
    set onEnd(cb) {
        this._onEnd = cb;
    }
    _loop = false; // 是否循环播放
    get loop() {
        return this._loop;
    }
    set loop(loop) {
        this._loop = loop;
        if (!loop) {
            this._clearFutureSourcesAndTimers();
        }
    }
    get volume() {
        return this._gainNode.gain.value;
    }
    set volume(volume) {
        this._gainNode.gain.value = volume * 3;
    }
    get _context() {
        if (!_audioContext) {
            throw new Error('先调用startJPlayer激活音频上下文');
        }
        return _audioContext;
    }
    /** 设置某分组 key 的线性增益（与总 volume、音符 velocity 相乘）；若节点尚未存在会先创建并接到总线 */
    setKeyGain(key, linearGain) {
        const k = key.trim();
        if (!k)
            return;
        const g = this._getOrCreateKeyGain(k);
        g.gain.value = linearGain;
    }
    /** 移除分组 gain 节点并从总线上断开（无该 key 时忽略） */
    releaseKeyGain(key) {
        const k = key.trim();
        if (!k)
            return;
        const node = this._keyGainMap.get(k);
        if (!node)
            return;
        try {
            node.disconnect();
        }
        catch {
            /* noop */
        }
        this._keyGainMap.delete(k);
    }
    /** 移除所有分组 gain 节点 */
    clearAllKeyGains() {
        for (const k of [...this._keyGainMap.keys()]) {
            this.releaseKeyGain(k);
        }
    }
    // 添加音色 传入midi:url格式
    async addToneColor(name, toneColor) {
        const ctx = this._context;
        for (const [midiStr, dataUrl] of Object.entries(toneColor)) {
            const midi = Number(midiStr);
            if (Number.isNaN(midi) || !dataUrl)
                continue;
            const cacheKey = `${name}:${midi}`;
            try {
                const res = await fetch(dataUrl);
                const arrayBuffer = await res.arrayBuffer();
                const buffer = await ctx.decodeAudioData(arrayBuffer);
                this._bufferCache.set(cacheKey, buffer);
            }
            catch (err) {
                console.warn('NPlayer音色添加失败', { name, midi, err });
            }
        }
    }
    // 设置播放序列
    setSequence(sequence) {
        this._baseSequence = sequenceToPlaySequence(sequence);
        this._sequence = [];
        this._fillSequence();
    }
    // 设置播放序列：直接传入playSequence的形式
    setPlaySequence(sequence) {
        this._baseSequence = sequence;
        this._sequence = [];
        this._fillSequence();
    }
    /**
     * 开始/恢复序列播放。
     * `param` 与 trigger 相同：attack / decay / peakVolume / release / volume。
     * 传入后整首每个音符都套该包络：A/D 在音符 duration 内（过长按比例压缩），R 在 duration 之后。
     * 最后一音的 R 结束后才 onEnd。无参 play() 沿用上次包络；从未传入则为旧行为（无包络）。
     * 总线 `volume` / `bpm` / `rate` 仍可播放中实时改：包络打在每音 noteGain 上，不挡总线音量。
     */
    async play(param) {
        if (param !== undefined) {
            this._playEnvelope = resolveNoteEnvelope(param);
        }
        if (this._state === 'playing')
            return;
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
            return;
        }
        this._check();
    }
    pause() {
        if (this._state !== 'playing')
            return;
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
            const entry = this._sourceMap.get(this._sequence[0].id);
            if (entry) {
                const durationSec = this._256ToSec(this._sequence[0].duration);
                const release = this._playEnvelope?.release ?? 0;
                this._endNoteRemainTime = Math.max(0, durationSec + release - (this._context.currentTime - entry.playContextTime));
            }
        }
        this._clearFutureSourcesAndTimers();
    }
    stop() {
        if (this._state === 'stopped')
            return;
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
    /**
     * 立即播放单个采样音符。
     * 包络规则见 `doc/单音符包络.md`：A/D + 峰值倍率在 trigger；R 在有 duration 时用 trigger.release，否则用 release().release。
     */
    trigger(param) {
        const id = param.id?.trim() ? param.id : uuidv4();
        const buffer = this._getBuffer(param.toneColor, param.midi);
        if (!buffer) {
            throw new Error(`NPlayer.trigger: 无 buffer，请先 addToneColor('${param.toneColor}', …) 且包含 midi ${param.midi}`);
        }
        // 同 id 重触发：立刻掐断旧音，不做软释放
        this.release({ id, immediate: true });
        const volume = param.volume != null ? param.volume : 1;
        const peakMul = param.peakVolume != null && param.peakVolume > 0 ? param.peakVolume : 1.2;
        const normalGain = volume * 3;
        const peakGain = normalGain * peakMul;
        const attack = param.attack != null && param.attack > 0 ? param.attack : 0;
        const decay = param.decay != null && param.decay > 0 ? param.decay : 0;
        const triggerRelease = param.release != null && param.release > 0 ? param.release : 0;
        const hasDuration = param.duration != null && param.duration > 0;
        const durationSec = hasDuration ? param.duration : 0;
        const source = this._context.createBufferSource();
        source.buffer = buffer;
        const gainNode = this._context.createGain();
        source.connect(gainNode);
        gainNode.connect(this._context.destination);
        const delay = Math.max(0, param.offset ?? 0);
        const t0 = this._context.currentTime + delay;
        this._scheduleTriggerEnvelope(gainNode.gain, t0, {
            attack,
            decay,
            peakGain,
            normalGain,
        });
        const entry = {
            source,
            gainNode,
            playContextTime: t0,
            hasDuration,
            normalGain,
            stopCalled: false,
        };
        if (param.onEnd)
            entry.onEnd = param.onEnd;
        const cleanup = () => {
            // 已被同 id 新音顶替：只拆本节点，勿动 map
            if (this._triggerSourceMap.get(id) !== entry) {
                this._disconnectTriggerNodes(entry);
                return;
            }
            this._finalizeTriggerEntry(id, entry, true);
        };
        source.onended = cleanup;
        source.start(t0);
        if (hasDuration) {
            const sustainEnd = t0 + durationSec;
            if (triggerRelease > 0) {
                gainNode.gain.setValueAtTime(normalGain, sustainEnd);
                gainNode.gain.linearRampToValueAtTime(0.0001, sustainEnd + triggerRelease);
                this._stopTriggerSource(entry, sustainEnd + triggerRelease);
            }
            else {
                this._stopTriggerSource(entry, sustainEnd);
            }
        }
        // 无 duration：不预 stop，留给 release() 首次 stop，或播完 buffer 自然 onended
        this._triggerSourceMap.set(id, entry);
        return id;
    }
    /**
     * 停止单音符。
     * - trigger 带了 duration：忽略 release，立刻停止（定时包络已由 trigger.R 负责）。
     * - 否则：用本参数 `release`（秒）软淡出；0 / 不传 / immediate → 立刻停。
     */
    release(param) {
        const entry = this._triggerSourceMap.get(param.id);
        if (!entry)
            return;
        if (entry.cleanupTimer != null) {
            clearTimeout(entry.cleanupTimer);
            delete entry.cleanupTimer;
        }
        const softRelease = !param.immediate &&
            !entry.hasDuration &&
            param.release != null &&
            param.release > 0;
        if (!softRelease) {
            entry.source.onended = null;
            this._silenceTriggerEntry(entry);
            this._stopTriggerSource(entry);
            this._finalizeTriggerEntry(param.id, entry, false);
            return;
        }
        const now = this._context.currentTime;
        const r = param.release;
        const g = entry.gainNode.gain;
        try {
            g.cancelScheduledValues(now);
            g.setValueAtTime(Math.max(g.value, 0.0001), now);
            g.linearRampToValueAtTime(0.0001, now + r);
        }
        catch {
            /* noop */
        }
        this._stopTriggerSource(entry, now + r);
        let done = false;
        const finish = () => {
            if (done)
                return;
            done = true;
            if (entry.cleanupTimer != null) {
                clearTimeout(entry.cleanupTimer);
                delete entry.cleanupTimer;
            }
            // 同 id 已被新 trigger 替换：只拆旧节点
            if (this._triggerSourceMap.get(param.id) !== entry) {
                this._disconnectTriggerNodes(entry);
                return;
            }
            this._finalizeTriggerEntry(param.id, entry, true);
        };
        entry.source.onended = finish;
        entry.cleanupTimer = setTimeout(finish, Math.ceil(r * 1000) + 50);
    }
    /** BufferSource.stop 只能成功一次 */
    _stopTriggerSource(entry, when) {
        if (entry.stopCalled)
            return;
        try {
            if (when != null)
                entry.source.stop(when);
            else
                entry.source.stop();
            entry.stopCalled = true;
        }
        catch {
            entry.stopCalled = true;
        }
    }
    _silenceTriggerEntry(entry) {
        const now = this._context.currentTime;
        try {
            const g = entry.gainNode.gain;
            g.cancelScheduledValues(now);
            g.setValueAtTime(0, now);
        }
        catch {
            /* noop */
        }
    }
    _disconnectTriggerNodes(entry) {
        try {
            entry.source.disconnect();
        }
        catch {
            /* noop */
        }
        try {
            entry.gainNode.disconnect();
        }
        catch {
            /* noop */
        }
    }
    _finalizeTriggerEntry(id, entry, callOnEnd) {
        entry.source.onended = null;
        if (entry.cleanupTimer != null) {
            clearTimeout(entry.cleanupTimer);
            delete entry.cleanupTimer;
        }
        this._disconnectTriggerNodes(entry);
        if (this._triggerSourceMap.get(id) === entry) {
            this._triggerSourceMap.delete(id);
        }
        if (callOnEnd)
            entry.onEnd?.();
    }
    /** Attack / Decay 调度：0 表示该段不存在 */
    _scheduleTriggerEnvelope(gain, t0, opts) {
        scheduleAdsrOnGain(gain, t0, opts);
    }
    // 通过baseSequence和copyCount填充sequence,
    releaseAll() {
        for (const id of [...this._triggerSourceMap.keys()]) {
            this.release({ id, immediate: true });
        }
    }
    dispose() {
        this.releaseAll();
        this.stop();
        this._bufferCache.clear();
        this.clearAllKeyGains();
    }
    /** 秒 → 256 时值单位 (考虑 rate) */
    _secTo256(sec) {
        return (sec * this._bpm * 256 * this._rate) / (60 * this._beatUnit);
    }
    /** 256 时值单位 → 秒 (考虑 rate，用于调度偏移) */
    _256ToSecWithRate(dur) {
        return (dur * this._beatUnit * 60) / (256 * this._bpm * this._rate);
    }
    /** 256 时值单位 → 秒 (不含 rate，用于音符持续时长) */
    _256ToSec(dur) {
        return toSeconds(dur, this._bpm, this._beatUnit);
    }
    _getOrCreateKeyGain(key) {
        let node = this._keyGainMap.get(key);
        if (node)
            return node;
        node = this._context.createGain();
        node.gain.value = 1;
        node.connect(this._gainNode);
        this._keyGainMap.set(key, node);
        return node;
    }
    // 如果loop=false,需要删减多余的序列，虽然fireOnEnd会在最后一个音符处结束播放，但是下一个音符是有可能在onEnd之前触发的。
    _fillSequence() {
        if (this._baseSequence.length === 0)
            return;
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
            const boundedBase = firstEndInBase === -1
                ? this._baseSequence
                : this._baseSequence.slice(0, firstEndInBase + 1);
            this._sequence = boundedBase.map((elem) => ({
                ...elem,
                id: uuidv4()
            }));
            return;
        }
        const currentRounds = this._sequence.length / this._baseSequence.length;
        const needRounds = Math.max(0, this._sequenceCopyCount - currentRounds);
        const fillCount = Math.ceil(needRounds);
        const roundDur = this._baseSequence[this._baseSequence.length - 1].playTime +
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
            const seq = this._baseSequence.map((elem) => ({
                ...elem,
                playTime: elem.playTime + offset,
                id: uuidv4()
            }));
            this._sequence = this._sequence.concat(seq);
        }
    }
    _check() {
        if (this._state !== 'playing')
            return;
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
    _getBuffer(toneColorName, midi) {
        const key = `${toneColorName}:${midi}`;
        return this._bufferCache.get(key) ?? getGlobalToneBuffer(key) ?? null;
    }
    // 清除未来(还未播放)的source和timer
    _clearFutureSourcesAndTimers() {
        const now = this._context.currentTime;
        const keepSources = new Map();
        this._sourceMap.forEach((entry, id) => {
            if (entry.playContextTime < now) {
                keepSources.set(id, entry);
            }
            else {
                entry.source.onended = null;
                entry.source.stop();
                try {
                    entry.source.disconnect();
                }
                catch {
                    /* noop */
                }
                try {
                    entry.noteGain.disconnect();
                }
                catch {
                    /* noop */
                }
            }
        });
        this._sourceMap = keepSources;
        const keepTimers = new Map();
        this._timerMap.forEach((entry, id) => {
            if (entry.playContextTime < now) {
                keepTimers.set(id, entry);
            }
            else {
                clearTimeout(entry.timerId);
            }
        });
        this._timerMap = keepTimers;
    }
    // 清除所有的source和timer
    _clearAllSourcesAndTimers() {
        this._timerMap.forEach((entry) => clearTimeout(entry.timerId));
        this._timerMap.clear();
        this._sourceMap.forEach((s) => {
            s.source.onended = null;
            s.source.stop();
            try {
                s.source.disconnect();
            }
            catch {
                /* noop */
            }
            try {
                s.noteGain.disconnect();
            }
            catch {
                /* noop */
            }
        });
        this._sourceMap.clear();
    }
    // 找出_sequence中结束时间，用于抛出onEnd回调
    _getMaxEnd() {
        if (!this._sequence.length)
            return 0;
        let max = 0;
        for (const e of this._sequence) {
            const end = e.playTime + e.duration;
            if (end > max)
                max = end;
            if (e.end)
                break;
        }
        return max;
    }
    // 触发结束回调
    _fireOnEnd() {
        if (this._state === 'stopped')
            return;
        this.stop();
    }
    /*
     * 核心函数， 检查器每次检查时触发
     *
     * */
    _addAndPlaySource() {
        if (this._state !== 'playing')
            return;
        // 更新&记录当前进度
        const deltaSec = this._context.currentTime - this._anchorContextTime;
        this._currentPosition += this._secTo256(deltaSec);
        this._anchorContextTime = this._context.currentTime;
        // 过滤掉已经播放完成的音符（含 R：R 在 duration 之后，这段时间内音符仍占序列，避免 refill / 暂停丢 onEnd）
        const release256 = this._secTo256(this._playEnvelope?.release ?? 0);
        this._sequence = this._sequence.filter((e) => e.playTime + e.duration + release256 > this._currentPosition);
        // 填充序列
        this._fillSequence();
        const checkWindow = this._secTo256(this._checkDuration / 1000);
        // 过滤出准备放入sourceMap的音符
        const filtered = this._sequence.filter((e) => {
            return (!this._sourceMap.has(e.id) &&
                e.playTime >= this._currentPosition &&
                e.playTime < this._currentPosition + checkWindow);
        });
        for (const e of filtered) {
            const buffer = this._getBuffer(e.toneColor, e.midi);
            // midi = 0认为是休止符，该有的回调都要有
            if ((!buffer || this._state !== 'playing') && e.midi !== 0)
                continue;
            const offset256 = e.playTime - this._currentPosition;
            const offsetSec = this._256ToSecWithRate(offset256);
            const contextPlayTime = this._context.currentTime + offsetSec;
            const durationSec = this._256ToSec(e.duration);
            const source = this._context.createBufferSource();
            // midi = 0 的情况下，这里buffer是null, 但是没关系，不会报错
            source.buffer = buffer;
            const noteGain = this._context.createGain();
            const velocity = e.velocity ?? 1;
            noteGain.gain.value = velocity;
            source.connect(noteGain);
            const keyTrimmed = e.gainNodeKey?.trim();
            if (keyTrimmed) {
                noteGain.connect(this._getOrCreateKeyGain(keyTrimmed));
            }
            else {
                noteGain.connect(this._gainNode);
            }
            source.start(contextPlayTime);
            const env = this._playEnvelope;
            const stopAt = env
                ? scheduleSequenceNoteEnvelope(noteGain.gain, contextPlayTime, durationSec, velocity, env).stopAt
                : contextPlayTime + durationSec;
            source.stop(stopAt);
            this._sourceMap.set(e.id, { source, noteGain, playContextTime: contextPlayTime });
            const itemEnd = e.end;
            source.onended = () => {
                this._sourceMap.delete(e.id);
                try {
                    source.disconnect();
                }
                catch {
                    /* noop */
                }
                try {
                    noteGain.disconnect();
                }
                catch {
                    /* noop */
                }
                if (itemEnd && !this._loop) {
                    this._fireOnEnd();
                }
                // 如果希望播放完再回调，可以把onProgress迁移到这里
                const progress = this._256ToSec(this._currentPosition +
                    this._secTo256(this._context.currentTime - this._anchorContextTime));
                this._onProgressEnd && this._onProgressEnd(progress, e.data);
            };
            if (!this._timerMap.has(e.id)) {
                // 这里函数执行时，表示某个音符开始播放时
                const timerId = setTimeout(() => {
                    this._timerMap.delete(e.id);
                    // 如果希望播放前再回调，可以把onProgress迁移到这里
                    const progress = this._256ToSec(this._currentPosition +
                        this._secTo256(this._context.currentTime - this._anchorContextTime));
                    this._onProgressStart && this._onProgressStart(progress, e.data);
                }, offsetSec * 1000); // setTimout和source.onended不一定哪个会先执行，所以这里可能有不一致的行为，+100确保onEnd先执行,+100我去掉了，使用者自己去处理
                this._timerMap.set(e.id, { timerId, playContextTime: contextPlayTime });
            }
        }
    }
}
export default NPlayer;
