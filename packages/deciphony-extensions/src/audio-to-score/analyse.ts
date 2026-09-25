import type {
  AudioPitchNote,
  AudioScoreInput,
  AudioToScoreOptions,
} from './types'

type PitchFrame = {
  time: number
  midi: number
  frequency: number
  confidence: number
}

function abortIfNeeded(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('音频转谱已取消', 'AbortError')
}

function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export async function decodeAudioInput(input: AudioScoreInput): Promise<AudioBuffer> {
  if (typeof AudioBuffer !== 'undefined' && input instanceof AudioBuffer) return input
  const bytes = input instanceof Blob
    ? await input.arrayBuffer()
    : input as ArrayBuffer
  const context = new AudioContext()
  try {
    return await context.decodeAudioData(bytes.slice(0))
  } finally {
    await context.close()
  }
}

function mixAndResample(
  buffer: AudioBuffer,
  targetRate: number,
  maxDurationSeconds: number,
): Float32Array {
  const sourceLength = Math.min(
    buffer.length,
    Math.floor(maxDurationSeconds * buffer.sampleRate),
  )
  const targetLength = Math.max(
    1,
    Math.floor(sourceLength * targetRate / buffer.sampleRate),
  )
  const output = new Float32Array(targetLength)
  const channels = Array.from(
    {length: buffer.numberOfChannels},
    (_, index) => buffer.getChannelData(index),
  )

  for (let i = 0; i < targetLength; i++) {
    const sourcePosition = i * buffer.sampleRate / targetRate
    const left = Math.min(sourceLength - 1, Math.floor(sourcePosition))
    const right = Math.min(sourceLength - 1, left + 1)
    const mix = sourcePosition - left
    let sample = 0
    for (const channel of channels) {
      sample += channel[left]! * (1 - mix) + channel[right]! * mix
    }
    output[i] = sample / Math.max(1, channels.length)
  }
  return output
}

function frameRms(samples: Float32Array, start: number, size: number): number {
  let sum = 0
  for (let i = 0; i < size; i++) {
    const value = samples[start + i] ?? 0
    sum += value * value
  }
  return Math.sqrt(sum / size)
}

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0
}

/**
 * 归一化自相关基频估计。它面向清晰单声部；和弦及强噪声不属于该扩展的目标输入。
 */
function detectPitch(
  samples: Float32Array,
  start: number,
  frameSize: number,
  sampleRate: number,
  minFrequency: number,
  maxFrequency: number,
): {frequency: number; confidence: number} | null {
  let mean = 0
  for (let i = 0; i < frameSize; i++) mean += samples[start + i] ?? 0
  mean /= frameSize

  const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency))
  const maxLag = Math.min(
    frameSize - 4,
    Math.ceil(sampleRate / minFrequency),
  )
  let bestLag = 0
  let bestCorrelation = -1
  const correlations = new Float32Array(maxLag + 1)

  for (let lag = minLag; lag <= maxLag; lag++) {
    let dot = 0
    let energyA = 0
    let energyB = 0
    // 每隔一个采样点计算一次，显著减少长音频的分析开销。
    for (let i = 0; i < frameSize - lag; i += 2) {
      const a = (samples[start + i] ?? 0) - mean
      const b = (samples[start + i + lag] ?? 0) - mean
      dot += a * b
      energyA += a * a
      energyB += b * b
    }
    const denominator = Math.sqrt(energyA * energyB)
    const correlation = denominator > 1e-12 ? dot / denominator : 0
    correlations[lag] = correlation
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestLag = lag
    }
  }

  if (bestLag === 0 || bestCorrelation < 0.62) return null

  // 自相关在基频周期的 2x/3x 处也会出现高峰。选取与最强峰足够接近的
  // 第一个局部峰，避免把基频误判成低一个或多个八度。
  // 固定阈值比“接近最强峰”更适合有限帧长：非整数基频周期下，
  // 2x/3x 周期可能恰好落在整数 lag，相关度反而略高于真正基频。
  const strongPeak = 0.75
  for (let lag = minLag + 1; lag < bestLag; lag++) {
    if (
      correlations[lag]! >= strongPeak
      && correlations[lag]! >= correlations[lag - 1]!
      && correlations[lag]! >= correlations[lag + 1]!
    ) {
      bestLag = lag
      bestCorrelation = correlations[lag]!
      break
    }
  }

  // 抛物线插值减少整数 lag 带来的音高抖动。
  const before = correlations[bestLag - 1] ?? bestCorrelation
  const after = correlations[bestLag + 1] ?? bestCorrelation
  const denominator = 2 * (2 * bestCorrelation - before - after)
  const offset = Math.abs(denominator) > 1e-9
    ? (after - before) / denominator
    : 0
  const lag = bestLag + Math.max(-0.5, Math.min(0.5, offset))
  return {
    frequency: sampleRate / lag,
    confidence: Math.max(0, Math.min(1, bestCorrelation)),
  }
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function segmentFrames(
  frames: (PitchFrame | null)[],
  hopSeconds: number,
  minDurationSeconds: number,
): AudioPitchNote[] {
  const smoothed = frames.map((frame, index) => {
    if (!frame) return null
    const nearby = frames
      .slice(Math.max(0, index - 2), index + 3)
      .filter((item): item is PitchFrame => item != null)
    return {
      ...frame,
      midi: Math.round(median(nearby.map((item) => item.midi))),
    }
  })

  const notes: AudioPitchNote[] = []
  let run: PitchFrame[] = []
  let silentFrames = 0

  const flush = () => {
    if (!run.length) return
    const startTime = Math.max(0, run[0]!.time - hopSeconds / 2)
    const endTime = run[run.length - 1]!.time + hopSeconds / 2
    if (endTime - startTime >= minDurationSeconds) {
      const midi = Math.round(median(run.map((frame) => frame.midi)))
      const inPitch = run.filter((frame) => Math.abs(frame.midi - midi) <= 1)
      notes.push({
        startTime,
        endTime,
        duration: endTime - startTime,
        frequency: median(inPitch.map((frame) => frame.frequency)),
        midi,
        confidence: inPitch.reduce((sum, frame) => sum + frame.confidence, 0)
          / Math.max(1, inPitch.length),
      })
    }
    run = []
    silentFrames = 0
  }

  for (const frame of smoothed) {
    if (!frame) {
      if (run.length && ++silentFrames > 2) flush()
      continue
    }
    if (!run.length) {
      run = [frame]
      silentFrames = 0
      continue
    }
    const currentMidi = Math.round(median(run.map((item) => item.midi)))
    if (Math.abs(frame.midi - currentMidi) <= 1) {
      run.push(frame)
      silentFrames = 0
    } else {
      flush()
      run = [frame]
    }
  }
  flush()

  // 合并极短断音造成的同音重复。
  const merged: AudioPitchNote[] = []
  for (const note of notes) {
    const previous = merged[merged.length - 1]
    if (
      previous
      && previous.midi === note.midi
      && note.startTime - previous.endTime <= 0.08
    ) {
      const previousWeight = previous.duration
      const noteWeight = note.duration
      previous.endTime = note.endTime
      previous.duration = previous.endTime - previous.startTime
      previous.confidence = (
        previous.confidence * previousWeight + note.confidence * noteWeight
      ) / (previousWeight + noteWeight)
      previous.frequency = (
        previous.frequency * previousWeight + note.frequency * noteWeight
      ) / (previousWeight + noteWeight)
    } else {
      merged.push({...note})
    }
  }
  return merged
}

export async function analyseAudioBuffer(
  buffer: AudioBuffer,
  options: AudioToScoreOptions = {},
): Promise<{notes: AudioPitchNote[]; duration: number; truncated: boolean}> {
  const sampleRate = 12_000
  const frameSize = 1024
  const hopSize = 256
  const maxDuration = options.maxDurationSeconds ?? 120
  const duration = Math.min(buffer.duration, maxDuration)
  const truncated = buffer.duration > maxDuration
  const samples = mixAndResample(buffer, sampleRate, maxDuration)
  const frameCount = Math.max(
    0,
    Math.floor((samples.length - frameSize) / hopSize) + 1,
  )
  if (!frameCount) return {notes: [], duration, truncated}

  const rmsValues = Array.from({length: frameCount}, (_, index) =>
    frameRms(samples, index * hopSize, frameSize),
  )
  const peakRms = Math.max(...rmsValues)
  const floor = percentile(rmsValues, 0.2)
  const dynamicFloor = floor < peakRms * 0.25 ? floor * 2.5 : peakRms * 0.03
  const silenceThreshold = options.silenceThreshold
    ?? Math.max(0.003, peakRms * 0.025, dynamicFloor)
  const minFrequency = options.minFrequency ?? 70
  const maxFrequency = options.maxFrequency ?? 1200
  const minMidi = options.minMidi ?? 36
  const maxMidi = options.maxMidi ?? 96
  const pitchFrames: (PitchFrame | null)[] = new Array(frameCount).fill(null)

  for (let index = 0; index < frameCount; index++) {
    abortIfNeeded(options.signal)
    if ((rmsValues[index] ?? 0) >= silenceThreshold) {
      const pitch = detectPitch(
        samples,
        index * hopSize,
        frameSize,
        sampleRate,
        minFrequency,
        maxFrequency,
      )
      if (pitch) {
        const rawMidi = 69 + 12 * Math.log2(pitch.frequency / 440)
        const midi = Math.round(rawMidi)
        if (midi >= minMidi && midi <= maxMidi && Math.abs(rawMidi - midi) <= 0.42) {
          pitchFrames[index] = {
            time: (index * hopSize + frameSize / 2) / sampleRate,
            midi,
            frequency: pitch.frequency,
            confidence: pitch.confidence,
          }
        }
      }
    }

    if (index % 80 === 0) {
      options.onProgress?.({
        stage: 'analyse',
        progress: index / frameCount,
      })
      await nextTask()
    }
  }
  options.onProgress?.({stage: 'analyse', progress: 1})

  return {
    notes: segmentFrames(
      pitchFrames,
      hopSize / sampleRate,
      (options.minNoteDurationMs ?? 90) / 1000,
    ),
    duration,
    truncated,
  }
}

export function estimateBpm(notes: AudioPitchNote[]): number {
  if (notes.length < 2) return 120
  const intervals: number[] = []
  for (let i = 1; i < notes.length; i++) {
    const interval = notes[i]!.startTime - notes[i - 1]!.startTime
    if (interval >= 0.12 && interval <= 4) intervals.push(interval)
  }
  if (!intervals.length) return 120
  let beatSeconds = median(intervals)
  while (beatSeconds > 1) beatSeconds /= 2
  while (beatSeconds < 1 / 3) beatSeconds *= 2
  const raw = Math.max(60, Math.min(180, 60 / beatSeconds))
  const common = [60, 72, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180]
  const nearest = common.reduce((best, value) =>
    Math.abs(value - raw) < Math.abs(best - raw) ? value : best,
  )
  return Math.abs(nearest - raw) / raw <= 0.06 ? nearest : Math.round(raw)
}
