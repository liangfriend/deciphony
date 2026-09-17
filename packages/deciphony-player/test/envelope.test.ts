import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {
  fitAttackDecayToDuration,
  resolveNoteEnvelope,
  scheduleAdsrOnGain,
  scheduleSequenceNoteEnvelope,
} from '../src/envelope.ts';
import type {GainAutomation} from '../src/envelope.ts';

function approx(actual: number, expected: number, eps = 1e-9) {
  assert.ok(
      Math.abs(actual - expected) < eps,
      `expected ${expected}, got ${actual}`,
  );
}

class RecGain implements GainAutomation {
  events: {op: string; value?: number; time: number}[] = [];
  cancelScheduledValues(time: number) {
    this.events.push({op: 'cancel', time});
  }
  setValueAtTime(value: number, time: number) {
    this.events.push({op: 'set', value, time});
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({op: 'ramp', value, time});
  }
}

describe('resolveNoteEnvelope', () => {
  it('defaults match trigger (volume 1, peak 1.2, A/D/R 0)', () => {
    assert.deepEqual(resolveNoteEnvelope(), {
      volume: 1,
      peakVolume: 1.2,
      attack: 0,
      decay: 0,
      release: 0,
    });
  });

  it('treats 0 and negative peak/A/D/R as absent', () => {
    const env = resolveNoteEnvelope({
      volume: 0.5,
      peakVolume: 0,
      attack: 0,
      decay: -1,
      release: 0,
    });
    approx(env.volume, 0.5);
    approx(env.peakVolume, 1.2);
    approx(env.attack, 0);
    approx(env.decay, 0);
    approx(env.release, 0);
  });
});

describe('fitAttackDecayToDuration', () => {
  it('keeps A/D when they fit in duration', () => {
    assert.deepEqual(fitAttackDecayToDuration(0.05, 0.1, 0.5), {
      attack: 0.05,
      decay: 0.1,
    });
  });

  it('scales A/D proportionally when A+D exceeds duration', () => {
    const {attack, decay} = fitAttackDecayToDuration(0.08, 0.08, 0.1);
    approx(attack, 0.05);
    approx(decay, 0.05);
  });

  it('zeros A/D when duration is 0', () => {
    assert.deepEqual(fitAttackDecayToDuration(0.1, 0.1, 0), {attack: 0, decay: 0});
  });
});

describe('scheduleAdsrOnGain', () => {
  it('A+D: 0 → peak → normal', () => {
    const g = new RecGain();
    scheduleAdsrOnGain(g, 1, {attack: 0.1, decay: 0.2, peakGain: 1.2, normalGain: 1});
    assert.deepEqual(g.events, [
      {op: 'cancel', time: 1},
      {op: 'set', value: 0, time: 1},
      {op: 'ramp', value: 1.2, time: 1.1},
      {op: 'ramp', value: 1, time: 1.3},
    ]);
  });

  it('A only: ramp to peak then step to normal', () => {
    const g = new RecGain();
    scheduleAdsrOnGain(g, 0, {attack: 0.1, decay: 0, peakGain: 1.2, normalGain: 1});
    assert.equal(g.events.at(-1)?.op, 'set');
    assert.equal(g.events.at(-1)?.value, 1);
    assert.equal(g.events.at(-1)?.time, 0.1);
  });

  it('D only: start at peak then ramp to normal', () => {
    const g = new RecGain();
    scheduleAdsrOnGain(g, 0, {attack: 0, decay: 0.2, peakGain: 1.2, normalGain: 1});
    assert.equal(g.events[1]?.op, 'set');
    assert.equal(g.events[1]?.value, 1.2);
    assert.equal(g.events[2]?.op, 'ramp');
    assert.equal(g.events[2]?.value, 1);
    assert.equal(g.events[2]?.time, 0.2);
  });
});

describe('scheduleSequenceNoteEnvelope', () => {
  it('puts A/D inside duration and R after; stopAt = t0+duration+R', () => {
    const g = new RecGain();
    const r = scheduleSequenceNoteEnvelope(
        g,
        0,
        0.5,
        1,
        {volume: 1, peakVolume: 1.2, attack: 0.05, decay: 0.1, release: 0.2},
    );
    approx(r.stopAt, 0.7);
    approx(r.normalGain, 1);
    approx(r.peakGain, 1.2);
    const last = g.events[g.events.length - 1];
    assert.equal(last?.op, 'ramp');
    approx(last!.value!, 0.0001);
    approx(last!.time, 0.7);
    const sustainSet = g.events.find((e) => e.op === 'set' && e.time === 0.5);
    assert.ok(sustainSet);
    approx(sustainSet!.value!, 1);
  });

  it('does not let A/D spill past duration', () => {
    const g = new RecGain();
    const r = scheduleSequenceNoteEnvelope(
        g,
        0,
        0.1,
        1,
        {volume: 1, peakVolume: 1.2, attack: 0.08, decay: 0.08, release: 0.05},
    );
    approx(r.attack, 0.05);
    approx(r.decay, 0.05);
    approx(r.stopAt, 0.15);
    const decayEnd = g.events.find((e) => e.op === 'ramp' && e.value === 1);
    assert.ok(decayEnd);
    approx(decayEnd!.time, 0.1);
  });

  it('multiplies velocity by envelope volume (no extra ×3)', () => {
    const g = new RecGain();
    const r = scheduleSequenceNoteEnvelope(
        g,
        0,
        0.5,
        0.5,
        {volume: 2, peakVolume: 1.2, attack: 0, decay: 0, release: 0},
    );
    approx(r.normalGain, 1);
    approx(r.peakGain, 1.2);
    approx(r.stopAt, 0.5);
  });
});
