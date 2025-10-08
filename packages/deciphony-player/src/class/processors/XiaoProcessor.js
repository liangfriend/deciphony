class MyAudioProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 440, minValue: 20, maxValue: 20000, automationRate: 'a-rate', },
      { name: 'volume', defaultValue: 0.2, minValue: 0, maxValue: 1, },
    ];
  }

  constructor(options) {
    super();
    this.phase = 0;
    this.lastProcessTime = currentTime; // 使用 AudioWorklet 内置时间
  }

  process(inputs, outputs, parameters) {
    const now = currentTime; // AudioContext.currentTime
    const delta = now - this.lastProcessTime;
    this.lastProcessTime = now;

    // ⚠️ 注意这里不是 Date.now()
    // 因为 Worklet 的时间轴和主线程不完全一致
    console.log(`⏱️ process 间隔: ${currentTime} s`);

    const output = outputs[0];
    const freqValues = parameters.frequency;
    const volValues = parameters.volume;
    const sampleRate = globalThis.sampleRate;
    const twoPi = 2 * Math.PI;

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];

      for (let i = 0; i < outputChannel.length; ++i) {
        const f = freqValues[0];
        const v = volValues[0];
        const t = 1 / sampleRate;
        this.phase += twoPi * f * t;
        if (this.phase >= twoPi) {this.phase -= twoPi;}
        outputChannel[i] = Math.sin(this.phase) * v;
      }
    }

    return true;
  }
}

registerProcessor('xiao-processor', MyAudioProcessor);
