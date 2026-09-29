import type {PuffBandName, ResolvedPuffOptions} from './types'

export const DEFAULT_PUFF_OPTIONS: ResolvedPuffOptions = {
  fftSize: 1024,
  intervalMs: 16,
  mediaAudioConstraints: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  },
  autoCalibrateMs: 500,

  startSnrDb: 10,
  stopSnrDb: 5,
  startConfidence: 0.55,
  stopConfidence: 0.35,
  minOnMs: 30,
  minOffMs: 80,

  dynamicRangeDb: 36,
  autoRange: true,
  autoRangeDecayDbPerSec: 1,
  pressureCurve: 1,
  attackMs: 20,
  releaseMs: 90,

  articulationThreshold: 0.18,
  articulationDipRatio: 0.45,
  articulationWindowMs: 80,
  articulationMinGapMs: 90,

  steadinessWindowMs: 300,
  modulationWindowMs: 1200,

  includeSpectrum: false,
  includeWaveform: false,
}

/** 频带边界 Hz（超出奈奎斯特频率的部分自动截断） */
export const PUFF_BANDS: Record<PuffBandName, [number, number]> = {
  sub: [20, 200],
  low: [200, 800],
  mid: [800, 3000],
  high: [3000, 8000],
  air: [8000, 16000],
}

/** 频谱统计（质心 / 平坦度 / 滚降）使用的频率范围 */
export const ANALYSIS_MIN_HZ = 40
export const ANALYSIS_MAX_HZ = 16000

/** 周期性检测的基频范围 */
export const PITCH_MIN_HZ = 80
export const PITCH_MAX_HZ = 1600

/** 未校准时的初始底噪 */
export const INITIAL_NOISE_FLOOR_DB = -70
/** 底噪下限：麦克风刚打开或静音时会送来纯 0 数据，不能把它当底噪，否则任何声音都会被判为吹气 */
export const MIN_NOISE_FLOOR_DB = -90
