import { MetronomeColor, MetronomeSequenceGenOption, TimeSignature } from './types';
declare class MPlayer {
    private _gainNode;
    private _endNotePauseMark;
    private _endNoteRemainTime;
    private _sequence;
    private _sourceMap;
    private _timerMap;
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
    private _metronomeColorMap;
    private _bufferCache;
    constructor(option: {
        checkTime: number;
        checkDuration: number;
        sequenceGenOption?: Partial<MetronomeSequenceGenOption>;
    });
    private _state;
    get state(): "paused" | "playing" | "stopped";
    private _bpm;
    get bpm(): number;
    set bpm(value: number);
    private _beatUnit;
    get beatUnit(): number;
    set beatUnit(value: number);
    private _sequenceGenOption;
    get sequenceGenOption(): Readonly<MetronomeSequenceGenOption>;
    set sequenceGenOption(opt: Partial<MetronomeSequenceGenOption>);
    private _timeSignature;
    get timeSignature(): TimeSignature;
    set timeSignature(ts: TimeSignature);
    private _rate;
    get rate(): number;
    set rate(rate: number);
    private _onProgressStart;
    set onProgressStart(cb: (progress: number, data: any) => void);
    private _onProgressEnd;
    set onProgressEnd(cb: (progress: number, data: any) => void);
    private _onEnd;
    set onEnd(cb: () => void);
    private _metronomeColor;
    get metronomeColor(): string;
    set metronomeColor(name: string);
    private _loop;
    get loop(): boolean;
    set loop(loop: boolean);
    get volume(): number;
    set volume(volume: number);
    private get _context();
    addMetronomeColor(name: string, metronomeColor: MetronomeColor): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    dispose(): void;
    /** 秒 → 256 时值单位 (考虑 rate) */
    private _secTo256;
    /** 256 时值单位 → 秒 (考虑 rate，用于调度偏移) */
    private _256ToSecWithRate;
    /** 256 时值单位 → 秒 (不含 rate，用于音符持续时长) */
    private _256ToSec;
    /**
     * 按当前拍号生成一小节的节拍器序列。
     * 每拍时值 = 256 / 拍号分母，playTime 按拍递增。
     */
    private _generateSequence;
    private _fillSequence;
    private _check;
    private _getMetronomeBuffer;
    private _clearFutureSourcesAndTimers;
    private _clearAllSourcesAndTimers;
    private _fireOnEnd;
    private _addAndPlaySource;
}
export default MPlayer;
