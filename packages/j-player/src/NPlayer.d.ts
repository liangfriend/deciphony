import { PlaySequence, Sequence, ToneColor } from './types';
declare class NPlayer {
    private _gainNode;
    private _state;
    private _endNotePauseMark;
    private _endNoteRemainTime;
    private _sequence;
    private _bpm;
    private _beatUnit;
    private _sourceMap;
    private _timerMap;
    private _triggerSourceMap;
    /** 以 256 分音符为粒度的曲谱位置 */
    private _startPosition;
    private _pausePosition;
    private _currentPosition;
    private _anchorContextTime;
    private _sequenceCopyCount;
    private _baseSequence;
    private _rate;
    private _checkTimer;
    private _checkTime;
    private _checkDuration;
    private _onProgressStart;
    private _onProgressEnd;
    private _onEnd;
    private _loop;
    private _bufferCache;
    /** 按 gainNodeKey 分组：总 gain → keyGain → 各音符 noteGain；创建后常驻直至 releaseKeyGain / clearAllKeyGains / dispose */
    private _keyGainMap;
    constructor(option: {
        checkTime: number;
        checkDuration: number;
    });
    private get _context();
    /** 秒 → 256 时值单位 (考虑 rate) */
    private _secTo256;
    /** 256 时值单位 → 秒 (考虑 rate，用于调度偏移) */
    private _256ToSecWithRate;
    /** 256 时值单位 → 秒 (不含 rate，用于音符持续时长) */
    private _256ToSec;
    private _getOrCreateKeyGain;
    /** 设置某分组 key 的线性增益（与总 volume、音符 velocity 相乘）；若节点尚未存在会先创建并接到总线 */
    setKeyGain(key: string, linearGain: number): void;
    /** 移除分组 gain 节点并从总线上断开（无该 key 时忽略） */
    releaseKeyGain(key: string): void;
    /** 移除所有分组 gain 节点 */
    clearAllKeyGains(): void;
    addToneColor(name: string, toneColor: ToneColor): Promise<void>;
    set volume(volume: number);
    get volume(): number;
    set bpm(value: number);
    get bpm(): number;
    set beatUnit(value: number);
    get beatUnit(): number;
    set rate(rate: number);
    get rate(): number;
    set loop(loop: boolean);
    get loop(): boolean;
    set onProgressStart(cb: (progress: number, data: any) => void);
    set onProgressEnd(cb: (progress: number, data: any) => void);
    set onEnd(cb: () => void);
    setSequence(sequence: Sequence): void;
    setPlaySequence(sequence: PlaySequence): void;
    private _fillSequence;
    play(): Promise<void>;
    private _check;
    private _getBuffer;
    private _clearFutureSourcesAndTimers;
    private _clearAllSourcesAndTimers;
    private _getMaxEnd;
    private _fireOnEnd;
    private _addAndPlaySource;
    pause(): void;
    stop(): void;
    trigger(param: {
        id?: string;
        midi: number;
        toneColor: string;
        volume?: number;
        offset?: number;
        duration?: number;
        onEnd?: () => void;
    }): string;
    release(param: {
        id: string;
    }): void;
    releaseAll(): void;
    dispose(): void;
}
export default NPlayer;
