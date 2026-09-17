import {afterEach, describe, it} from 'node:test';
import assert from 'node:assert/strict';
import NPlayer from '../src/NPlayer.ts';
import {closeJPlayer, startJPlayer} from '../src/ContextManager.ts';
import type {PlaySequenceItem} from '../src/types.ts';
import {masterGain, MockAudioContext, noteGains} from './mockAudioContext.ts';

function approx(actual: number, expected: number, eps = 1e-9) {
  assert.ok(
      Math.abs(actual - expected) < eps,
      `expected ${expected}, got ${actual}`,
  );
}

function note(
    partial: Pick<PlaySequenceItem, 'id' | 'playTime' | 'duration' | 'end'> &
        Partial<PlaySequenceItem>,
): PlaySequenceItem {
  return {
    velocity: 1,
    toneColor: 'piano',
    midi: 0,
    data: null,
    ...partial,
  };
}

/** 四分音符 @ bpm 120 beatUnit 4 → 0.5s */
const Q = 64;

let ctx: MockAudioContext;
let player: NPlayer;

function setup() {
  closeJPlayer();
  ctx = new MockAudioContext();
  startJPlayer(ctx as unknown as AudioContext);
  player = new NPlayer({checkTime: 50, checkDuration: 5000});
  player.bpm = 120;
  player.beatUnit = 4;
  player.rate = 1;
  return {ctx, player};
}

afterEach(() => {
  try {
    player?.dispose();
  } catch {
    /* noop */
  }
  closeJPlayer();
});

describe('NPlayer.play envelope', () => {
  it('without envelope, stop is exactly duration (old behavior)', async () => {
    setup();
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play();
    assert.equal(ctx.sources.length, 1);
    approx(ctx.sources[0].startTime ?? -1, 0);
    approx(ctx.sources[0].stopTime ?? -1, 0.5);
  });

  it('R is extra after duration; onEnd waits for last source onended', async () => {
    setup();
    let ended = 0;
    player.onEnd = () => {
      ended += 1;
    };
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play({
      attack: 0.05,
      decay: 0.1,
      peakVolume: 1.2,
      release: 0.2,
    });
    approx(ctx.sources[0].stopTime ?? -1, 0.7);
    assert.equal(ended, 0);
    ctx.sources[0].fireEnded();
    assert.equal(ended, 1);
  });

  it('applies the same envelope to every note', async () => {
    setup();
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: false}),
      note({id: 'b', playTime: Q, duration: Q, end: true}),
    ]);
    await player.play({attack: 0.05, decay: 0.1, release: 0.2, peakVolume: 1.2});
    assert.equal(ctx.sources.length, 2);
    approx(ctx.sources[0].startTime ?? -1, 0);
    approx(ctx.sources[0].stopTime ?? -1, 0.7);
    approx(ctx.sources[1].startTime ?? -1, 0.5);
    approx(ctx.sources[1].stopTime ?? -1, 1.2);
    const gains = noteGains(ctx);
    assert.equal(gains.length, 2);
    for (const g of gains) {
      const peak = g.gain.events.find((e) => e.op === 'ramp' && e.value === 1.2);
      assert.ok(peak, 'each note should ramp to peak');
      const rel = g.gain.events.find((e) => e.op === 'ramp' && e.value === 0.0001);
      assert.ok(rel, 'each note should have R');
    }
  });

  it('live volume only moves the master bus, not per-note envelope events', async () => {
    setup();
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play({attack: 0.05, decay: 0.1, release: 0.2});
    const before = JSON.stringify(noteGains(ctx)[0].gain.events);
    player.volume = 0.4;
    approx(masterGain(ctx).gain.value, 1.2);
    assert.equal(JSON.stringify(noteGains(ctx)[0].gain.events), before);
  });

  it('bpm change keeps already-started notes and reschedules future ones with new duration+R', async () => {
    setup();
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: false}),
      note({id: 'b', playTime: Q, duration: Q, end: true}),
    ]);
    await player.play({release: 0.1, attack: 0.02, decay: 0.02});
    const firstStop = ctx.sources[0].stopTime;
    approx(firstStop ?? -1, 0.6);
    ctx.currentTime = 0.05;
    player.bpm = 240;
    assert.equal(ctx.sources[0].stoppedImmediately, false);
    approx(ctx.sources[0].stopTime ?? -1, 0.6);
    const keptFuture = ctx.sources.find((s) => s.stoppedImmediately);
    assert.ok(keptFuture, 'the not-yet-started note should be stopped');
    const rescheduled = ctx.sources.find(
        (s) => !s.stoppedImmediately && s !== ctx.sources[0] && s.startTime != null,
    );
    assert.ok(rescheduled);
    const durAt240 = 0.25;
    approx(rescheduled!.stopTime! - rescheduled!.startTime!, durAt240 + 0.1);
  });

  it('rate change keeps already-started notes and reschedules future start offsets', async () => {
    setup();
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: false}),
      note({id: 'b', playTime: Q, duration: Q, end: true}),
    ]);
    await player.play({release: 0.1});
    ctx.currentTime = 0.05;
    player.rate = 2;
    assert.equal(ctx.sources[0].stoppedImmediately, false);
    const rescheduled = ctx.sources.find(
        (s) => !s.stoppedImmediately && s !== ctx.sources[0] && s.startTime != null,
    );
    assert.ok(rescheduled);
    // duration 仍按 _256ToSec（不含 rate），R 仍是墙钟秒
    approx(rescheduled!.stopTime! - rescheduled!.startTime!, 0.5 + 0.1);
  });

  it('loop=true does not fire onEnd when the end-marked note finishes including R', async () => {
    setup();
    let ended = 0;
    player.onEnd = () => {
      ended += 1;
    };
    player.loop = true;
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play({release: 0.1});
    ctx.sources[0].fireEnded();
    assert.equal(ended, 0);
  });

  it('play() without args keeps the previous envelope', async () => {
    setup();
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play({release: 0.2});
    player.stop();
    ctx.sources.length = 0;
    ctx.gains.splice(1);
    await player.play();
    approx(ctx.sources[0].stopTime ?? -1, 0.7);
  });

  it('pause on the last note includes remaining R in the resume wait, then onEnd', async () => {
    setup();
    let ended = 0;
    player.onEnd = () => {
      ended += 1;
    };
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play({release: 0.05});
    ctx.currentTime = 0.45;
    player.pause();
    assert.equal(ended, 0);
    const t0 = Date.now();
    await player.play();
    const waited = Date.now() - t0;
    assert.equal(ended, 1);
    // remain = 0.5 + 0.05 - 0.45 = 0.10s
    assert.ok(waited >= 80, `expected ~100ms wait, got ${waited}ms`);
    assert.ok(waited < 400, `wait too long: ${waited}ms`);
  });

  it('velocity * play.volume is sustain; A/D stay inside duration', async () => {
    setup();
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true, velocity: 0.5}),
    ]);
    await player.play({
      volume: 2,
      peakVolume: 1.5,
      attack: 0.05,
      decay: 0.1,
      release: 0.1,
    });
    const events = noteGains(ctx)[0].gain.events;
    const peak = events.find((e) => e.op === 'ramp' && e.value === 1.5);
    assert.ok(peak);
    approx(peak!.time, 0.05);
    const decayEnd = events.find((e) => e.op === 'ramp' && e.value === 1);
    assert.ok(decayEnd);
    approx(decayEnd!.time, 0.15);
    const rel = events.find((e) => e.op === 'ramp' && e.value === 0.0001);
    assert.ok(rel);
    approx(rel!.time, 0.6);
    approx(ctx.sources[0].stopTime ?? -1, 0.6);
  });

  it('during last-note R, later checks do not fire onEnd or start a new source', async () => {
    setup();
    let ended = 0;
    player.onEnd = () => {
      ended += 1;
    };
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play({release: 0.2});
    const sourceCount = ctx.sources.length;
    ctx.currentTime = 0.55;
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(ended, 0);
    assert.equal(ctx.sources.length, sourceCount);
    ctx.sources[0].fireEnded();
    assert.equal(ended, 1);
  });

  it('clamps A+D into a short note duration', async () => {
    setup();
    // 16 分音符 @ 120 = 0.125s
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: 16, end: true}),
    ]);
    await player.play({attack: 0.1, decay: 0.1, release: 0.05, peakVolume: 1.2});
    const events = noteGains(ctx)[0].gain.events;
    const decayEnd = events.find((e) => e.op === 'ramp' && e.value === 1);
    assert.ok(decayEnd);
    approx(decayEnd!.time, 0.125);
    approx(ctx.sources[0].stopTime ?? -1, 0.175);
  });

  it('chord: overlapping notes both get envelope; onEnd only from the end-marked source', async () => {
    setup();
    let ended = 0;
    player.onEnd = () => {
      ended += 1;
    };
    player.setPlaySequence([
      note({id: 'a', playTime: 0, duration: Q, end: false}),
      note({id: 'b', playTime: 0, duration: Q, end: true}),
    ]);
    await player.play({release: 0.1, attack: 0.02});
    assert.equal(ctx.sources.length, 2);
    approx(ctx.sources[0].stopTime ?? -1, 0.6);
    approx(ctx.sources[1].stopTime ?? -1, 0.6);
    ctx.sources[0].fireEnded();
    assert.equal(ended, 0);
    ctx.sources[1].fireEnded();
    assert.equal(ended, 1);
  });
});
