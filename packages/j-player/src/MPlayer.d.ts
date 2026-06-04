import { MetronomeColor, MetronomeSequenceGenOption, TimeSignature } from './types';
declare class MPlayer {
    private _gainNode;
    private _state;
    private _endNotePauseMark;
    private _endNoteRemainTime;
    private _sequence;
    private _bpm;
    private _beatUnit;
    private _sequenceGenOption;
    private _sourceMap;
    private _timerMap;
    /** 以 256 分音符为粒度的曲谱位置 */
    private _startPosition;
    private _pausePosition;
    private _currentPosition;
    private _anchorContextTime;
    private _sequenceCopyCount;
    private _baseSequence;
    private _timeSignature;
    private _rate;
    private _checkTimer;
    private _checkTime;
    private _checkDuration;
    private _onProgressStart;
    private _onProgressEnd;
    private _onEnd;
    private _metronomeColorMap;
    private _metronomeColor;
    private _loop;
    private _bufferCache;
    constructor(option: {
        checkTime: number;
        checkDuration: number;
        sequenceGenOption?: Partial<MetronomeSequenceGenOption>;
    });
    get sequenceGenOption(): Readonly<MetronomeSequenceGenOption>;
    set sequenceGenOption(opt: Partial<MetronomeSequenceGenOption>);
    get state(): "stopped" | "playing" | "paused";
    private get _context();
    /** 秒 → 256 时值单位 (考虑 rate) */
    private _secTo256;
    /** 256 时值单位 → 秒 (考虑 rate，用于调度偏移) */
    private _256ToSecWithRate;
    /** 256 时值单位 → 秒 (不含 rate，用于音符持续时长) */
    private _256ToSec;
    addMetronomeColor(name: string, metronomeColor: MetronomeColor): Promise<void>;
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
    set metronomeColor(name: string);
    get metronomeColor(): string;
    set onProgressStart(cb: (progress: number, data: any) => void);
    set onProgressEnd(cb: (progress: number, data: any) => void);
    set onEnd(cb: () => void);
    set timeSignature(ts: TimeSignature);
    get timeSignature(): TimeSignature;
    /**
     * 按当前拍号生成一小节的节拍器序列。
     * 每拍时值 = 256 / 拍号分母，playTime 按拍递增。
     */
    private _generateSequence;
    private _fillSequence;
    play(): Promise<void>;
    private _check;
    private _getMetronomeBuffer;
    private _clearFutureSourcesAndTimers;
    private _clearAllSourcesAndTimers;
    private _fireOnEnd;
    private _addAndPlaySource;
    pause(): void;
    stop(): void;
    dispose(): void;
}
export default MPlayer;
