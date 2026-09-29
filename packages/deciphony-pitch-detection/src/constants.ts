import type {PitchDetectTuning} from './types'

export const DEFAULT_PITCH_DETECT_TUNING: PitchDetectTuning = {
  // 环境吵、一检测就乱飘音高：先把门限抬高
  /*
   * 越大越稳定，但声音小时越容易识别不到
   */
  silenceRmsThreshold: 0.02,
  // DyWA 更“挑剔”，弱噪声不容易当成基频（原版 0.75）
  dywaMaximaThresholdRatio: 0.75,
  /*
   * echoCancellation / autoGainControl 为 true 时，伴奏外放下前几秒 RMS 往往偏小
   */
  mediaAudioConstraints: {
    echoCancellation: false,
    noiseSuppression: true,
    autoGainControl: false,
  },
  minFrequency: 20,
  maxFrequency: 5000,
}

/** 可变默认调参对象（与旧 tune-judge `pitchDetectTuning` 行为一致，可原地改） */
export const pitchDetectTuning: PitchDetectTuning = {
  ...DEFAULT_PITCH_DETECT_TUNING,
  mediaAudioConstraints: {...DEFAULT_PITCH_DETECT_TUNING.mediaAudioConstraints},
}
