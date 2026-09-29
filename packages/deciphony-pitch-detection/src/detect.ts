import {DywaPitchTracker} from './dywaPitchTracker'
import {pitchDetectTuning} from './constants'
import type {DetectFrequencyOptions, PitchDetectResult} from './types'

function resolveBand(options?: DetectFrequencyOptions) {
  return {
    minFrequency: options?.minFrequency ?? pitchDetectTuning.minFrequency,
    maxFrequency: options?.maxFrequency ?? pitchDetectTuning.maxFrequency,
    silenceRmsThreshold:
      options?.silenceRmsThreshold ?? pitchDetectTuning.silenceRmsThreshold,
    dywaMaximaThresholdRatio:
      options?.dywaMaximaThresholdRatio ??
      pitchDetectTuning.dywaMaximaThresholdRatio,
  }
}

/**
 * 从时域采样估计基频（Hz）。
 * 失败（静音 / 无效）返回 `-1`。
 * 历史别名：原 tune-judge 中的 `autoCorrelate`。
 */
export function detectFrequency(
  samples: ArrayLike<number>,
  sampleRate: number,
  options?: DetectFrequencyOptions,
): number {
  const {
    silenceRmsThreshold,
    dywaMaximaThresholdRatio,
    minFrequency,
    maxFrequency,
  } = resolveBand(options)

  let rms = 0
  const n = samples.length
  for (let i = 0; i < n; i++) {
    const v = samples[i]!
    rms += v * v
  }
  rms = Math.sqrt(rms / n)
  if (rms < silenceRmsThreshold) return -1

  const tracker = options?.tracker ?? new DywaPitchTracker(-1, -1)
  tracker.SampleRateHz = sampleRate
  tracker.MaximaThresholdRatio = dywaMaximaThresholdRatio
  const hz = tracker.ComputePitch(samples, 0, n)
  if (hz <= 0 || hz < minFrequency || hz > maxFrequency) return -1
  return hz
}

/** @deprecated 使用 `detectFrequency`；保留兼容旧名 */
export const autoCorrelate = detectFrequency

export function frequencyToNote(frequency: number): string {
  const {minFrequency, maxFrequency} = pitchDetectTuning
  if (frequency < minFrequency || frequency > maxFrequency) return ''

  const A4 = 440
  const noteNames = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ]
  const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69
  const noteIndex = ((noteNumber % 12) + 12) % 12
  const octave = Math.floor(noteNumber / 12) - 1
  return `${noteNames[noteIndex]}${octave}`
}

export function frequencyToMidi(frequency: number): number {
  const {minFrequency, maxFrequency} = pitchDetectTuning
  if (frequency < minFrequency || frequency > maxFrequency) return -1
  const A4 = 440
  return Math.round(12 * Math.log2(frequency / A4)) + 69
}

/** Hz → 统一结果结构；无效频率时 frequency/midi 为 0、pitch 为空 */
export function toPitchDetectResult(frequency: number): PitchDetectResult {
  if (frequency <= 0) {
    return {pitch: '', frequency: 0, midi: 0}
  }
  const midi = frequencyToMidi(frequency)
  if (midi < 0) {
    return {pitch: '', frequency: 0, midi: 0}
  }
  return {
    pitch: frequencyToNote(frequency),
    frequency,
    midi,
  }
}
