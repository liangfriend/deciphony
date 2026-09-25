import {
  analyseAudioBuffer,
  decodeAudioInput,
  estimateBpm,
} from './analyse'
import {buildStandardStaffScore} from './buildScore'
import type {
  AudioScoreInput,
  AudioToScoreOptions,
  AudioToScoreResult,
} from './types'

export type * from './types'
export {analyseAudioBuffer, decodeAudioInput, estimateBpm} from './analyse'
export {buildStandardStaffScore} from './buildScore'

/**
 * 清晰单声部音频 → SJ 五线谱。
 *
 * 当前是浏览器端 DSP 首版：适用于独奏、哼唱等单音输入，不支持和弦/完整混音的多声部拆分。
 */
export async function audioToScore(
  input: AudioScoreInput,
  options: AudioToScoreOptions = {},
): Promise<AudioToScoreResult> {
  options.signal?.throwIfAborted()
  options.onProgress?.({stage: 'decode', progress: 0})
  const buffer = await decodeAudioInput(input)
  options.onProgress?.({stage: 'decode', progress: 1})
  const analysis = await analyseAudioBuffer(buffer, options)
  const bpm = options.bpm === 'auto' || options.bpm == null
    ? estimateBpm(analysis.notes)
    : Math.max(20, Math.min(400, options.bpm))

  options.onProgress?.({stage: 'build', progress: 0})
  const built = buildStandardStaffScore(analysis.notes, bpm, options)
  options.onProgress?.({stage: 'build', progress: 1})

  const warnings = [...built.warnings]
  if (analysis.truncated) {
    warnings.push(`音频超过 ${options.maxDurationSeconds ?? 120} 秒，仅分析前段`)
  }
  if ((options.bpm === 'auto' || options.bpm == null) && analysis.notes.length < 2) {
    warnings.push('可用起音不足，自动 BPM 回退为 120')
  }
  return {
    ...built,
    bpm,
    duration: analysis.duration,
    warnings,
  }
}
