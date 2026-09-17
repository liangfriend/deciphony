/** 供 NPlayer 序列测试用的最小 Web Audio mock（不发声，只记录 start/stop 与 gain 自动化） */

export type AutomationEvent = {
  op: 'cancel' | 'set' | 'ramp';
  value?: number;
  time: number;
};

export class MockAudioParam {
  value = 1;
  events: AutomationEvent[] = [];

  cancelScheduledValues(time: number) {
    this.events.push({op: 'cancel', time});
  }

  setValueAtTime(value: number, time: number) {
    this.events.push({op: 'set', value, time});
    this.value = value;
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({op: 'ramp', value, time});
  }
}

export class MockGainNode {
  gain = new MockAudioParam();
  connectedTo: unknown[] = [];

  connect(dest: unknown) {
    this.connectedTo.push(dest);
    return dest;
  }

  disconnect() {
    /* noop */
  }
}

export class MockBufferSource {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  startTime: number | null = null;
  stopTime: number | null = null;
  stoppedImmediately = false;
  connectedTo: unknown[] = [];

  connect(dest: unknown) {
    this.connectedTo.push(dest);
    return dest;
  }

  disconnect() {
    /* noop */
  }

  start(when?: number) {
    this.startTime = when ?? 0;
  }

  stop(when?: number) {
    if (when == null) {
      this.stoppedImmediately = true;
      this.stopTime = 0;
      return;
    }
    this.stopTime = when;
  }

  fireEnded() {
    this.onended?.();
  }
}

export class MockAudioContext {
  currentTime = 0;
  destination = {id: 'destination'};
  sources: MockBufferSource[] = [];
  gains: MockGainNode[] = [];

  createGain(): GainNode {
    const g = new MockGainNode();
    this.gains.push(g);
    return g as unknown as GainNode;
  }

  createBufferSource(): AudioBufferSourceNode {
    const s = new MockBufferSource();
    this.sources.push(s);
    return s as unknown as AudioBufferSourceNode;
  }
}

export function masterGain(ctx: MockAudioContext): MockGainNode {
  return ctx.gains[0];
}

export function noteGains(ctx: MockAudioContext): MockGainNode[] {
  return ctx.gains.slice(1);
}
