import { _audioContext } from './ContextManager';
import { toSeconds } from './sequenceUtils';
import { v4 as uuidv4 } from 'uuid';
class MPlayer {
    _gainNode;
    _state = 'stopped';
    _endNotePauseMark; // 最后一个音符暂停时的标记
    _endNoteRemainTime; // 最后一个音符暂停时的剩余播放时间
    _sequence = [];
    _bpm = 120;
    _beatUnit = 4;
    _sequenceGenOption = {
        // MPlayer独有的，baseSequence应该是原有的几倍
        copyCount: 1
    };
    _sourceMap = new Map();
    _timerMap = new Map();
    /** 以 256 分音符为粒度的曲谱位置 */
    _startPosition = 0;
    _pausePosition = 0;
    _currentPosition = 0;
    _anchorContextTime = 0;
    _sequenceCopyCount = 5;
    _baseSequence = [];
    _timeSignature = '4/4';
    _rate = 1;
    _checkTimer = null;
    _checkTime = 50;
    _checkDuration = 500;
    _onProgressStart = null; // 过程回调(开始播放)
    _onProgressEnd = null; // 过程回调(播放完成)
    _onEnd = null;
    _metronomeColorMap = new Map();
    _metronomeColor = '';
    _loop = true;
    _bufferCache = new Map();
    constructor(option) {
        this._endNotePauseMark = false;
        this._endNoteRemainTime = 0;
        this._checkTime = option.checkTime ?? 50;
        this._checkDuration = option.checkDuration ?? 500;
        if (option.sequenceGenOption?.copyCount != null) {
            this._sequenceGenOption.copyCount = Math.max(1, Math.floor(option.sequenceGenOption.copyCount));
        }
        this._gainNode = this._context.createGain();
        this._gainNode.connect(this._context.destination);
        this._generateSequence();
    }
    get sequenceGenOption() {
        return { ...this._sequenceGenOption };
    }
    set sequenceGenOption(opt) {
        if (opt.copyCount === undefined)
            return;
        const next = Math.max(1, Math.floor(opt.copyCount));
        if (next === this._sequenceGenOption.copyCount)
            return;
        this._sequenceGenOption.copyCount = next;
        this._generateSequence();
        if (this._state === 'playing') {
            this._clearFutureSourcesAndTimers();
            this._check();
        }
    }
    get state() {
        return this._state;
    }
    get _context() {
        if (!_audioContext) {
            throw new Error('先调用startJPlayer激活音频上下文');
        }
        return _audioContext;
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
    async addMetronomeColor(name, metronomeColor) {
        this._metronomeColorMap.set(name, metronomeColor);
        const ctx = this._context;
        for (const [intensity, dataUrl] of Object.entries(metronomeColor)) {
            if (!dataUrl)
                continue;
            const cacheKey = `${name}:${intensity}`;
            if (this._bufferCache.has(cacheKey))
                continue;
            try {
                const res = await fetch(dataUrl);
                const arrayBuffer = await res.arrayBuffer();
                const buffer = await ctx.decodeAudioData(arrayBuffer);
                this._bufferCache.set(cacheKey, buffer);
            }
            catch (err) {
                console.warn('MPlayer addMetronomeColor decodeAudioData failed', { name, intensity, err });
            }
        }
    }
    set volume(volume) {
        this._gainNode.gain.value = volume;
    }
    get volume() {
        return this._gainNode.gain.value;
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
    get bpm() {
        return this._bpm;
    }
    set beatUnit(value) {
        if (this._beatUnit === value)
            return;
        this._beatUnit = Math.max(1, value);
        this._generateSequence();
        if (this._state === 'playing') {
            this._clearFutureSourcesAndTimers();
            this._check();
        }
    }
    get beatUnit() {
        return this._beatUnit;
    }
    set rate(rate) {
        if (this._rate === rate)
            return;
        const oldRate = this._rate;
        this._rate = rate;
        this._clearFutureSourcesAndTimers();
        const deltaSec = this._context.currentTime - this._anchorContextTime;
        this._currentPosition += (deltaSec * this._bpm * 256 * oldRate) / (60 * this._beatUnit);
        this._anchorContextTime = this._context.currentTime;
        this._check();
    }
    get rate() {
        return this._rate;
    }
    set loop(loop) {
        this._loop = loop;
        if (!loop) {
            this._clearFutureSourcesAndTimers();
        }
    }
    get loop() {
        return this._loop;
    }
    set metronomeColor(name) {
        this._metronomeColor = name;
    }
    get metronomeColor() {
        return this._metronomeColor;
    }
    set onProgressStart(cb) {
        this._onProgressStart = cb;
    }
    set onProgressEnd(cb) {
        this._onProgressEnd = cb;
    }
    set onEnd(cb) {
        this._onEnd = cb;
    }
    set timeSignature(ts) {
        this._timeSignature = ts;
        this._generateSequence();
        if (this._state === 'playing') {
            this.stop();
            // 节拍器播放过程中改timeSignature有时候会出现停止的现象。节拍器理论上不应该播放过程中更改，要不然第几拍没法续上
            // this._clearFutureSourcesAndTimers();
            // this._check();
        }
    }
    get timeSignature() {
        return this._timeSignature;
    }
    /**
     * 按当前拍号生成一小节的节拍器序列。
     * 每拍时值 = 256 / 拍号分母，playTime 按拍递增。
     */
    _generateSequence() {
        const [numStr, denStr] = this._timeSignature.split('/');
        if (+numStr <= 0 || +numStr > 16 || ![1, 2, 4, 8, 16].includes(+denStr)) {
            throw new Error('拍号有误，不存在拍号：' + this._timeSignature);
        }
        const denominator = +denStr;
        const tickDur = 256 / denominator;
        const melodyMap = {
            '1': ['strong'],
            '2': ['strong', 'weak'],
            '3': ['strong', 'weak', 'weak'],
            '4': ['strong', 'weak', 'secondary', 'weak'],
            '5': ['strong', 'weak', 'secondary', 'weak', 'weak'],
            '6': ['strong', 'weak', 'weak', 'secondary', 'weak', 'weak'],
            '7': ['strong', 'weak', 'secondary', 'weak', 'secondary', 'weak', 'weak'],
            '8': ['strong', 'weak', 'secondary', 'weak', 'strong', 'weak', 'secondary', 'weak'],
            '9': ['strong', 'weak', 'weak', 'secondary', 'weak', 'weak', 'secondary', 'weak', 'weak'],
            '10': [
                'strong',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'secondary',
                'weak'
            ],
            '11': [
                'strong',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak'
            ],
            '12': [
                'strong',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak'
            ],
            '13': [
                'strong',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'secondary',
                'weak'
            ],
            '14': [
                'strong',
                'weak',
                'secondary',
                'weak',
                'secondary',
                'weak',
                'weak',
                'strong',
                'weak',
                'secondary',
                'weak',
                'secondary',
                'weak',
                'weak'
            ],
            '15': [
                'strong',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak',
                'secondary',
                'weak',
                'weak'
            ],
            '16': [
                'strong',
                'weak',
                'secondary',
                'weak',
                'strong',
                'weak',
                'secondary',
                'weak',
                'strong',
                'weak',
                'secondary',
                'weak',
                'strong',
                'weak',
                'secondary',
                'weak'
            ]
        };
        const oneBar = [];
        const intensities = melodyMap[numStr];
        for (let i = 0; i < intensities.length; i++) {
            const intensity = intensities[i];
            oneBar.push({
                id: uuidv4(),
                intensity,
                duration: tickDur,
                playTime: i * tickDur,
                data: { beatIndex: i },
                end: false
            });
        }
        const beatsPerBar = oneBar.length;
        const roundDur = oneBar[beatsPerBar - 1].playTime + oneBar[beatsPerBar - 1].duration;
        const copies = Math.max(1, Math.floor(this._sequenceGenOption.copyCount));
        const expanded = [];
        for (let c = 0; c < copies; c++) {
            for (let i = 0; i < beatsPerBar; i++) {
                const src = oneBar[i];
                expanded.push({
                    id: uuidv4(),
                    intensity: src.intensity,
                    duration: src.duration,
                    playTime: c * roundDur + src.playTime,
                    data: { beatIndex: i },
                    end: false
                });
            }
        }
        expanded[expanded.length - 1].end = true;
        this._baseSequence = expanded;
        this._sequence = [];
        this._fillSequence();
    }
    // 如果loop=false,需要删减多余的序列，虽然fireOnEnd会在最后一个音符处结束播放，但是下一个音符是有可能在onEnd之前触发的。
    _fillSequence() {
        if (this._baseSequence.length === 0)
            return;
        if (!this._loop) {
            // loop=false: 不按 copyCount 扩展，且只保留到第一个 end（包含）
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
            const seq = JSON.parse(JSON.stringify(this._baseSequence));
            const offset = this._sequence.length ? roundDur * i + nextStart : 0;
            seq.forEach((elem) => {
                elem.playTime += offset;
                elem.id = uuidv4();
            });
            this._sequence = this._sequence.concat(seq);
        }
    }
    async play() {
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
        }
        this._check();
    }
    _check() {
        if (this._checkTimer) {
            clearInterval(this._checkTimer);
            this._checkTimer = null;
        }
        this._addAndPlaySource();
        this._checkTimer = setInterval(() => {
            this._addAndPlaySource();
        }, this._checkTime);
    }
    _getMetronomeBuffer(intensity) {
        const name = this._metronomeColor;
        if (!name)
            return null;
        return this._bufferCache.get(`${name}:${intensity}`) ?? null;
    }
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
                entry.source.disconnect();
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
    _clearAllSourcesAndTimers() {
        this._timerMap.forEach((entry) => clearTimeout(entry.timerId));
        this._timerMap.clear();
        this._sourceMap.forEach((s) => {
            s.source.onended = null;
            s.source.stop();
            s.source.disconnect();
        });
        this._sourceMap.clear();
    }
    _fireOnEnd() {
        if (this._state === 'stopped')
            return;
        this.stop();
    }
    _addAndPlaySource() {
        const deltaSec = this._context.currentTime - this._anchorContextTime;
        this._currentPosition += this._secTo256(deltaSec);
        this._anchorContextTime = this._context.currentTime;
        this._sequence = this._sequence.filter((e) => e.playTime + e.duration > this._currentPosition);
        this._fillSequence();
        const checkWindow = this._secTo256(this._checkDuration / 1000);
        const filtered = this._sequence.filter((e) => {
            return (!this._sourceMap.has(e.id) &&
                e.playTime >= this._currentPosition &&
                e.playTime < this._currentPosition + checkWindow);
        });
        for (const e of filtered) {
            const buffer = this._getMetronomeBuffer(e.intensity);
            if (!buffer || this._state !== 'playing')
                continue;
            const offset256 = e.playTime - this._currentPosition;
            const offsetSec = this._256ToSecWithRate(offset256);
            const contextPlayTime = this._context.currentTime + offsetSec;
            const durationSec = this._256ToSec(e.duration);
            const source = this._context.createBufferSource();
            source.buffer = buffer;
            source.connect(this._gainNode);
            source.start(contextPlayTime);
            source.stop(contextPlayTime + durationSec);
            this._sourceMap.set(e.id, { source, playContextTime: contextPlayTime });
            const itemEnd = e.end;
            source.onended = () => {
                this._sourceMap.delete(e.id);
                if (itemEnd && !this._loop) {
                    this._fireOnEnd();
                }
                // 如果希望播放完再回调，可以把onProgress迁移到这里
                const progress = this._256ToSec(this._currentPosition +
                    this._secTo256(this._context.currentTime - this._anchorContextTime));
                this._onProgressEnd && this._onProgressEnd(progress, e.data);
            };
            if (!this._timerMap.has(e.id)) {
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
            const playContextTime = this._sourceMap.get(this._sequence[0].id)?.playContextTime;
            if (playContextTime) {
                this._endNoteRemainTime =
                    this._256ToSecWithRate(this._sequence[0].duration) -
                        (this._context.currentTime - playContextTime);
            }
        }
        this._clearAllSourcesAndTimers();
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
    dispose() {
        this.stop();
        this._bufferCache.clear();
        this._metronomeColorMap.clear();
    }
}
export default MPlayer;
