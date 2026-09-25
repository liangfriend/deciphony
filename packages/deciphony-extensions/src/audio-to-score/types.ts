import type {
  AccidentalTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScore,
  TimeSignatureTypeEnum,
} from '@deciphony/renderer'

export type AudioScoreInput = Blob | ArrayBuffer | AudioBuffer

export type AudioPitchNote = {
  startTime: number
  endTime: number
  duration: number
  frequency: number
  midi: number
  confidence: number
}

export type QuantizedAudioNote = AudioPitchNote & {
  startChronaxie: number
  durationChronaxie: number
  region: number
  accidental: AccidentalTypeEnum | null
}

export type AudioToScoreProgress = {
  stage: 'decode' | 'analyse' | 'build'
  progress: number
}

export type AudioToScoreOptions = {
  /** 固定 BPM；auto 根据音符起点间隔粗略估计。 */
  bpm?: number | 'auto'
  timeSignature?: TimeSignatureTypeEnum
  keySignature?: KeySignatureTypeEnum
  clef?: ClefTypeEnum
  /** 最小量化单位，默认十六分音符。 */
  quantize?: 8 | 16 | 32
  title?: string
  width?: number
  height?: number
  minFrequency?: number
  maxFrequency?: number
  minMidi?: number
  maxMidi?: number
  minNoteDurationMs?: number
  /** 绝对静音阈值；不传则按音频动态估计。 */
  silenceThreshold?: number
  /** 最多分析多少秒，默认 120。 */
  maxDurationSeconds?: number
  signal?: AbortSignal
  onProgress?: (state: AudioToScoreProgress) => void
}

export type AudioToScoreResult = {
  musicScore: MusicScore
  notes: QuantizedAudioNote[]
  bpm: number
  duration: number
  warnings: string[]
}
