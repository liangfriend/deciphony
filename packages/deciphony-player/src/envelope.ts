import type {NoteEnvelopeParams} from './types';

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
export function resolveNoteEnvelope(param?: NoteEnvelopeParams | null): ResolvedNoteEnvelope {
  return {
    volume: param?.volume != null ? param.volume : 1,
    peakVolume: param?.peakVolume != null && param.peakVolume > 0 ? param.peakVolume : 1.2,
    attack: param?.attack != null && param.attack > 0 ? param.attack : 0,
    decay: param?.decay != null && param.decay > 0 ? param.decay : 0,
    release: param?.release != null && param.release > 0 ? param.release : 0,
  };
}

/** A+D 压进 duration：超长则按比例缩短；duration≤0 则 A=D=0 */
export function fitAttackDecayToDuration(
    attack: number,
    decay: number,
    duration: number,
): {attack: number; decay: number} {
  if (!(duration > 0)) return {attack: 0, decay: 0};
  const a = Math.max(0, attack);
  const d = Math.max(0, decay);
  const ad = a + d;
  if (ad <= duration) return {attack: a, decay: d};
  const s = duration / ad;
  return {attack: a * s, decay: d * s};
}

/** Attack / Decay 调度：0 表示该段不存在（与 trigger 相同） */
export function scheduleAdsrOnGain(
    gain: GainAutomation,
    t0: number,
    opts: {attack: number; decay: number; peakGain: number; normalGain: number},
): void {
  const {attack, decay, peakGain, normalGain} = opts;
  gain.cancelScheduledValues(t0);

  if (attack > 0 && decay > 0) {
    gain.setValueAtTime(0, t0);
    gain.linearRampToValueAtTime(peakGain, t0 + attack);
    gain.linearRampToValueAtTime(normalGain, t0 + attack + decay);
    return;
  }
  if (attack > 0) {
    gain.setValueAtTime(0, t0);
    gain.linearRampToValueAtTime(peakGain, t0 + attack);
    gain.setValueAtTime(normalGain, t0 + attack);
    return;
  }
  if (decay > 0) {
    gain.setValueAtTime(peakGain, t0);
    gain.linearRampToValueAtTime(normalGain, t0 + decay);
    return;
  }
  gain.setValueAtTime(normalGain, t0);
}

export function scheduleReleaseOnGain(
    gain: GainAutomation,
    sustainEnd: number,
    release: number,
    normalGain: number,
): void {
  if (!(release > 0)) return;
  gain.setValueAtTime(normalGain, sustainEnd);
  gain.linearRampToValueAtTime(0.0001, sustainEnd + release);
}

/**
 * 序列音符包络：A/D 落在 duration 内，R 在 duration 之后。
 * 返回 source.stop 时刻（含 R）。
 */
export function scheduleSequenceNoteEnvelope(
    gain: GainAutomation,
    t0: number,
    durationSec: number,
    velocity: number,
    env: ResolvedNoteEnvelope,
): {stopAt: number; attack: number; decay: number; peakGain: number; normalGain: number} {
  const dur = Math.max(0, durationSec);
  const normalGain = velocity * env.volume;
  const peakGain = normalGain * env.peakVolume;
  const {attack, decay} = fitAttackDecayToDuration(env.attack, env.decay, dur);
  scheduleAdsrOnGain(gain, t0, {attack, decay, peakGain, normalGain});
  const release = env.release > 0 ? env.release : 0;
  if (release > 0) {
    scheduleReleaseOnGain(gain, t0 + dur, release, normalGain);
  }
  return {stopAt: t0 + dur + release, attack, decay, peakGain, normalGain};
}
