// pitch-detect.ts — Web Audio 管线不变，音高估计委托 DyWA
//
// 与「伴奏 BufferSource 同 AudioContext」并存时：渲染线程里各节点按 quantum 并行处理，
// Source 不会在 API 语义上阻塞 Analyser。若出现长时间无音高，更常见是 (1) 麦克风支路
// 未接到 destination 时个别实现对子图调度偏弱 → 下面用 gain=0 静音 tap；(2) detectPitch
// 走 rAF，主线程被解码/UI 占满时读点稀疏；(3) getUserMedia 的 AEC/NS/AGC 仍可能压低人声 RMS。

import { DywaPitchTracker } from './dywa-pitch-tracker.js';
import { _audioContext } from './ContextManager';
import { DetectCallback, DetectRes } from './types';

/**
 * 运行时可调参数。杂音/假音高常见处理：
 * - 提高 silenceRmsThreshold：环境吵时减少“无中生有”的音高
 * - 提高 dywaMaximaThresholdRatio：更依赖明显周期，弱噪声不易触发
 * - mediaAudioConstraints：回声大试 echoCancellation；底噪试 noiseSuppression；忽大忽小试 autoGainControl: false
 */
export const pitchDetectTuning = {
  // 环境吵、一检测就乱飘音高：先把门限抬高
  /*
   * 这个理论上越大越好，我试了下越大越稳定，但是越大，你声音小的时候就容易识别不到，0.001的时候，我就必须提高嗓门了
   * */
  silenceRmsThreshold: 0.0002,
  // DyWA 更“挑剔”，弱噪声不容易当成基频（默认 0.78，原版 0.75）
  /*
   * 我使用自然的低吼
   * 0.1的时候，在84附近晃，0.9的时候，在44，32，25，21四个梯度上都有，一层层的。所以0.75应该是最佳的附近，这里使用0.7
   * */
  dywaMaximaThresholdRatio: 0.7,
  // 浏览器采集行为（按现象试）
  /*
   * echoCancellation和autoGainControl全都设置成false, 这两个为true, 一开始几秒频率不到，rms很小，尤其当同时播放音频时
   * autoGainControl 会自动调节麦克风输入音量。本来是0.00几，几秒的调节之后会变成0.几
   * */
  mediaAudioConstraints: {
    echoCancellation: false, // 有伴奏外放、啸叫时优先
    noiseSuppression: true, // 底噪大时 true；若声音发“糊”可改 false 对比 这个就true就好了
    autoGainControl: false // 音量泵感、忽大忽小时可改为 false 试试
  } as MediaTrackConstraints
};

let curFrequent = 0;

let audioContext: AudioContext;
let analyser: AnalyserNode;
let dataArray: Float32Array;
let source: MediaStreamAudioSourceNode | undefined;
/** 增益 0：把 analyser 挂到 destination，保证麦克风采样子图与播放图一起被稳定调度（听不到声音） */
let micSilentTap: GainNode | undefined;
let micStream: MediaStream | null = null;
/** 外部传入的麦克风流不在 dispose 时 stop，由业务方释放 */
let ownsMicStream = true;
let animationFrameId: number;
let detectCallback: DetectCallback;

let dywaTracker: DywaPitchTracker | null = null;

function getDywaTracker(): DywaPitchTracker {
  if (!dywaTracker) dywaTracker = new DywaPitchTracker(-1, -1);
  return dywaTracker;
}

/** 与原先 autoCorrelate 相同签名：Float32 时域缓冲 + 采样率 → Hz，失败为 -1 */
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < pitchDetectTuning.silenceRmsThreshold) return -1;

  const tracker = getDywaTracker();
  tracker.SampleRateHz = sampleRate;
  tracker.MaximaThresholdRatio = pitchDetectTuning.dywaMaximaThresholdRatio;
  const hz = tracker.ComputePitch(buffer, 0, buffer.length);
  if (hz <= 0 || hz < 20 || hz > 5000) return -1;
  return hz;
}

function frequencyToNote(frequency: number): string {
  if (frequency < 20 || frequency > 5000) return '';

  const A4 = 440;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
  const noteIndex = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12) - 1;
  return `${noteNames[noteIndex]}${octave}`;
}

function frequencyToMIDI(frequency: number): number {
  if (frequency < 20 || frequency > 5000) return -1;
  const A4 = 440;
  return Math.round(12 * Math.log2(frequency / A4)) + 69;
}

function detectPitch() {
  analyser.getFloatTimeDomainData(dataArray);
  const frequency = autoCorrelate(dataArray, audioContext.sampleRate);
  let result: DetectRes;

  if (frequency === -1) {
    curFrequent = 0;
    dywaTracker?.ClearPitchHistory();
    result = { pitch: '', frequency: 0, midi: 0 };
  } else {
    curFrequent = frequency;
    result = {
      pitch: frequencyToNote(curFrequent),
      frequency: curFrequent,
      midi: frequencyToMIDI(curFrequent)
    };
  }
  detectCallback?.(result, audioContext.currentTime);
  animationFrameId = requestAnimationFrame(detectPitch);
}

function connectMicStream(stream: MediaStream, cb: DetectCallback) {
  detectCallback = cb;
  micStream = stream;
  audioContext = _audioContext!;
  analyser = audioContext.createAnalyser();

  const need = getDywaTracker().NeededSampleCount(80);
  analyser.fftSize = Math.min(32768, Math.max(2048, need));

  const bufferLength = analyser.fftSize;
  dataArray = new Float32Array(bufferLength);

  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  micSilentTap = audioContext.createGain();
  micSilentTap.gain.value = 0;
  analyser.connect(micSilentTap);
  micSilentTap.connect(audioContext.destination);
  detectPitch();
}

function stopMicAndDisconnect() {
  cancelAnimationFrame(animationFrameId);
  if (micStream && ownsMicStream) {
    for (const t of micStream.getTracks()) {
      t.stop();
    }
  }
  micStream = null;
  ownsMicStream = true;
  try {
    source?.disconnect();
  } catch {
    /* already disconnected */
  }
  source = undefined;
  try {
    analyser?.disconnect();
  } catch {
    /* noop */
  }
  try {
    micSilentTap?.disconnect();
  } catch {
    /* noop */
  }
  micSilentTap = undefined;
}

export async function startDetectWithStream(stream: MediaStream, cb: DetectCallback) {
  if (!_audioContext) {
    throw new Error('请先调用startTuneJudge');
  }
  stopMicAndDisconnect();

  ownsMicStream = false;
  dywaTracker = new DywaPitchTracker(-1, -1);
  dywaTracker.MaximaThresholdRatio = pitchDetectTuning.dywaMaximaThresholdRatio;
  curFrequent = 0;

  try {
    connectMicStream(stream, cb);
  } catch (e) {
    console.error('连接麦克风失败:', e);
  }
}

export async function startDetect(cb: DetectCallback) {
  if (!_audioContext) {
    throw new Error('请先调用startTuneJudge');
  }
  stopMicAndDisconnect();

  dywaTracker = new DywaPitchTracker(-1, -1);
  dywaTracker.MaximaThresholdRatio = pitchDetectTuning.dywaMaximaThresholdRatio;
  curFrequent = 0;

  try {
    ownsMicStream = true;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: pitchDetectTuning.mediaAudioConstraints
    });
    connectMicStream(stream, cb);
  } catch (e) {
    console.error('获取麦克风失败:', e);
  }
}

function dispose() {
  stopMicAndDisconnect();
}

const pitchDetect = {
  startDetect,
  startDetectWithStream,
  dispose,
  frequencyToNote,
  autoCorrelate,
  tuning: pitchDetectTuning
};

export default pitchDetect;
