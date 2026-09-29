import type {DywaPitchTracker} from './dywaPitchTracker'

/** 单次检测结果 */
export interface PitchDetectResult {
  /** 如 `A4`；未检出为空串 */
  pitch: string
  /** Hz；未检出为 0 */
  frequency: number
  /** 静音或未检测到音高时为 0；有效音符为 MIDI 号 */
  midi: number
}

export type PitchDetectCallback = (
  res: PitchDetectResult,
  currentTime: number,
) => void

/**
 * 运行时可调参数。杂音/假音高常见处理：
 * - 提高 silenceRmsThreshold：环境吵时减少“无中生有”的音高
 * - 提高 dywaMaximaThresholdRatio：更依赖明显周期，弱噪声不易触发
 * - mediaAudioConstraints：回声大试 echoCancellation；底噪试 noiseSuppression；忽大忽小试 autoGainControl: false
 */
export type PitchDetectTuning = {
  silenceRmsThreshold: number
  dywaMaximaThresholdRatio: number
  mediaAudioConstraints: MediaTrackConstraints
  /** 有效频率下限（Hz），默认 20 */
  minFrequency: number
  /** 有效频率上限（Hz），默认 5000 */
  maxFrequency: number
}

export type DetectFrequencyOptions = {
  /** 复用 tracker 可保留 DyWA 时序后处理状态；不传则每次新建（无状态） */
  tracker?: DywaPitchTracker
  silenceRmsThreshold?: number
  dywaMaximaThresholdRatio?: number
  minFrequency?: number
  maxFrequency?: number
}

export type PitchDetectorOptions = Partial<PitchDetectTuning> & {
  /** 不传则 start 时自动 `new AudioContext()` */
  audioContext?: AudioContext
  /**
   * 为 true（默认）且未传单项调参时，直接使用模块级 `pitchDetectTuning`（原地改参立即生效）。
   * 传入任一调参字段时会拷贝一份独立 tuning。
   */
  shareTuning?: boolean
}
