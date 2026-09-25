declare class APlayer {
    private _gainNode;
    private _source;
    private _state;
    private _audioBuffer;
    private _pauseTime;
    private _startTime;
    private _onProgress;
    private _onEnd;
    private _progressRaf;
    private _current;
    private _rate;
    private _loop;
    constructor();
    private get _context();
    set volume(volume: number);
    get volume(): number;
    set rate(rate: number);
    get rate(): number;
    set loop(loop: boolean);
    get loop(): boolean;
    set onProgress(cb: (current: number, duration: number) => void);
    set onEnd(cb: () => void);
    get current(): number;
    set current(value: number);
    seek(value: number): Promise<void>;
    get duration(): number;
    private _setSource;
    setAudio(input: string | AudioBuffer | ArrayBuffer): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    /** 不再使用实例时调用：先 stop，再丢弃解码缓存与回调 */
    dispose(): void;
}
export default APlayer;
