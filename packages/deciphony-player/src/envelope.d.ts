import type { NoteEnvelopeParams } from './types';
export type ResolvedNoteEnvelope = {
    volume: number;
    peakVolume: number;
    attack: number;
    decay: number;
    release: number;
};
export type GainAutomation = {
    cancelScheduledValues(time: number): void;
    setValueAtTime(value: number, time: number): void;
    linearRampToValueAtTime(value: number, time: number): void;
};
/** 0 / 不传 / ≤0 视为该段不存在；peakVolume ≤0 回落到 1.2 */
export declare function resolveNoteEnvelope(param?: NoteEnvelopeParams | null): ResolvedNoteEnvelope;
/** A+D 压进 duration：超长则按比例缩短；duration≤0 则 A=D=0 */
export declare function fitAttackDecayToDuration(attack: number, decay: number, duration: number): {
    attack: number;
    decay: number;
};
/** Attack / Decay 调度：0 表示该段不存在（与 trigger 相同） */
export declare function scheduleAdsrOnGain(gain: GainAutomation, t0: number, opts: {
    attack: number;
    decay: number;
    peakGain: number;
    normalGain: number;
}): void;
export declare function scheduleReleaseOnGain(gain: GainAutomation, sustainEnd: number, release: number, normalGain: number): void;
/**
 * 序列音符包络：A/D 落在 duration 内，R 在 duration 之后。
 * 返回 source.stop 时刻（含 R）。
 */
export declare function scheduleSequenceNoteEnvelope(gain: GainAutomation, t0: number, durationSec: number, velocity: number, env: ResolvedNoteEnvelope): {
    stopAt: number;
    attack: number;
    decay: number;
    peakGain: number;
    normalGain: number;
};
