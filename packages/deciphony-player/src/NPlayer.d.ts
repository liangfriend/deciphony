import { NoteEnvelopeParams, PlaySequence, Sequence, ToneColor } from './types';
declare class NPlayer {
    private _gainNode;
    private _state;
    private _endNotePauseMark;
    private _endNoteRemainTime;
    private _sequence;
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
    private _checkTimer;
    private _checkTime;
    private _checkDuration;
    private _bufferCache;
    /** 按 gainNodeKey 分组：总 gain → keyGain → 各音符 noteGain；创建后常驻直至 releaseKeyGain / clearAllKeyGains / dispose */
    private _keyGainMap;
    /** 序列 play 的包络；null = 旧行为（无 A/D/R）。play() 无参时沿用上次。 */
    private _playEnvelope;
    constructor(option: {
        checkTime: number;
        checkDuration: number;
    });
    private _bpm;
    get bpm(): number;
    set bpm(value: number);
    private _beatUnit;
    get beatUnit(): number;
    set beatUnit(value: number);
    private _rate;
    get rate(): number;
    set rate(rate: number);
    private _onProgressStart;
    set onProgressStart(cb: (progress: number, data: any) => void);
    private _onProgressEnd;
    set onProgressEnd(cb: (progress: number, data: any) => void);
    private _onEnd;
    set onEnd(cb: () => void);
    private _loop;
    get loop(): boolean;
    set loop(loop: boolean);
    get volume(): number;
    set volume(volume: number);
    private get _context();
    /** 设置某分组 key 的线性增益（与总 volume、音符 velocity 相乘）；若节点尚未存在会先创建并接到总线 */
    setKeyGain(key: string, linearGain: number): void;
    /** 移除分组 gain 节点并从总线上断开（无该 key 时忽略） */
    releaseKeyGain(key: string): void;
    /** 移除所有分组 gain 节点 */
    clearAllKeyGains(): void;
    addToneColor(name: string, toneColor: ToneColor): Promise<void>;
    /** 已缓存（至少成功解码一个音）的音色名 */
    getToneColorNames(): string[];
    hasToneColor(name: string): boolean;
    /** 移除某音色的全部缓存；之后用到该音色的音符按静音占位 */
    removeToneColor(name: string): void;
    clearToneColors(): void;
    setSequence(sequence: Sequence): void;
    setPlaySequence(sequence: PlaySequence): void;
    /**
     * 开始/恢复序列播放。
     * `param` 与 trigger 相同：attack / decay / peakVolume / release / volume。
     * 传入后整首每个音符都套该包络：A/D 在音符 duration 内（过长按比例压缩），R 在 duration 之后。
     * 最后一音的 R 结束后才 onEnd。无参 play() 沿用上次包络；从未传入则为旧行为（无包络）。
     * 总线 `volume` / `bpm` / `rate` 仍可播放中实时改：包络打在每音 noteGain 上，不挡总线音量。
     */
    play(param?: NoteEnvelopeParams): Promise<void>;
    pause(): void;
    stop(): void;
    /**
     * 立即播放单个采样音符。
     * 包络规则见 `doc/单音符包络.md`：A/D + 峰值倍率在 trigger；R 在有 duration 时用 trigger.release，否则用 release().release。
     */
    trigger(param: {
        id?: string;
        midi: number;
        toneColor: string;
        /** 维持段音量（线性），默认 1；实际 gain = volume * 3 */
        volume?: number;
        /** 峰值 = volume * peakVolume，默认 1.2；0 视为未设置 → 1.2 */
        peakVolume?: number;
        /** Attack 秒：0→峰值；0 / 不传 = 无 */
        attack?: number;
        /** Decay 秒：峰值→volume；0 / 不传 = 无 */
        decay?: number;
        /**
         * Release 秒：仅当设置了有效 duration 时生效（duration 结束后淡出）。
         * 0 / 不传 = 无淡出，到点即停。
         */
        release?: number;
        offset?: number;
        duration?: number;
        onEnd?: () => void;
    }): string;
    /**
     * 停止单音符。
     * - trigger 带了 duration：忽略 release，立刻停止（定时包络已由 trigger.R 负责）。
     * - 否则：用本参数 `release`（秒）软淡出；0 / 不传 / immediate → 立刻停。
     */
    release(param: {
        id: string;
        release?: number;
        immediate?: boolean;
    }): void;
    /** BufferSource.stop 只能成功一次 */
    private _stopTriggerSource;
    private _silenceTriggerEntry;
    private _disconnectTriggerNodes;
    private _finalizeTriggerEntry;
    /** Attack / Decay 调度：0 表示该段不存在 */
    private _scheduleTriggerEnvelope;
    releaseAll(): void;
    dispose(): void;
    /** 秒 → 256 时值单位 (考虑 rate) */
    private _secTo256;
    /** 256 时值单位 → 秒 (考虑 rate，用于调度偏移) */
    private _256ToSecWithRate;
    /** 256 时值单位 → 秒 (不含 rate，用于音符持续时长) */
    private _256ToSec;
    private _getOrCreateKeyGain;
    private _fillSequence;
    private _check;
    private _getBuffer;
    private _clearFutureSourcesAndTimers;
    private _clearAllSourcesAndTimers;
    private _getMaxEnd;
    private _fireOnEnd;
    private _addAndPlaySource;
}
export default NPlayer;
