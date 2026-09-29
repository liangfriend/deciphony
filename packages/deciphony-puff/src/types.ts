export type PuffState = 'calibrating' | 'idle' | 'blowing'

export type PuffBandName = 'sub' | 'low' | 'mid' | 'high' | 'air'

export type PuffBand = {
  /** 频带能量（dBFS 功率和） */
  db: number
  /** 占全频段能量比例 0..1 */
  ratio: number
}

/** 判定「是不是吹气」的分项得分，均为 0..1 */
export type PuffScores = {
  /** 响度：信噪比映射 */
  loudness: number
  /** 噪声感：局部平坦度映射（吹气 ≈ 噪声，人声 / 口哨 ≈ 谐波） */
  noisiness: number
  /** 非周期性：1 - periodicity（说话 / 哼唱 / 口哨是周期信号） */
  aperiodicity: number
  /** 湍流：低频（< 800 Hz）占比，气流直冲麦克风时很高 */
  turbulence: number
}

export type PuffSpectralFeatures = {
  /** 频谱质心 Hz（越高越「亮」「嘶」） */
  spectralCentroid: number
  /** 频谱平坦度 0..1（1 = 白噪声，0 = 纯音），统计 40 Hz–16 kHz 全段 */
  spectralFlatness: number
  /**
   * 有效频段平坦度 0..1：只统计有能量的频段（activeBandLow–activeBandHigh）。
   * 气流声集中在低频时全段平坦度会很低，这个值更能区分「噪声」与「谐波」
   */
  activeFlatness: number
  /**
   * 局部平坦度 0..1：有效频段按 8 个 bin 分块求平坦度，再按能量加权平均。
   * 不受频谱整体倾斜影响（真实气流低频强高频弱），噪声 ≈ 0.5+，谐波 / 纯音 ≈ 0.1 以下
   */
  localFlatness: number
  activeBandLow: number
  activeBandHigh: number
  /** 85% 能量滚降频率 Hz */
  spectralRolloff: number
  /** 频谱通量：相邻帧频谱正向变化量（dB 均值），瞬态 / 吐音时变大 */
  spectralFlux: number
  bands: Record<PuffBandName, PuffBand>
}

export type PuffLevelFeatures = {
  rms: number
  peak: number
  /** 20·log10(rms)，dBFS */
  db: number
  zeroCrossingRate: number
  clipping: boolean
}

export type PuffPeriodicity = {
  /** 归一化自相关峰值 0..1；> 0.8 基本是人声 / 口哨等有音高的声音 */
  periodicity: number
  /** 周期信号的基频 Hz，非周期时为 null */
  pitch: number | null
}

/** 每帧输出 */
export type PuffFrame = PuffLevelFeatures & PuffSpectralFeatures & PuffPeriodicity & {
  /** 自 start 起的毫秒数 */
  time: number
  /** AudioContext.currentTime（秒），可直接用于 AudioParam 调度 */
  audioTime: number
  /** 距上一帧毫秒数 */
  dt: number

  state: PuffState
  isBlowing: boolean
  /** 本帧开始吹气 */
  blowStart: boolean
  /** 本帧结束吹气 */
  blowEnd: boolean
  /** 本帧检测到吐音（吹气中气压快速回落再冲起，或吹气开始） */
  articulation: boolean

  /** 气压 0..1：起音 / 释音包络平滑后的控制量，未吹气时衰减到 0。驱动乐器音量首选 */
  pressure: number
  /** 气压变化速度（每秒） */
  pressureVelocity: number
  /** 原始响度 0..1：仅由信噪比映射，不经吹气判定与平滑 */
  level: number
  /** 当前（或刚结束的）这口气的气压峰值 */
  peakPressure: number

  /** 吹气置信度 0..1 */
  confidence: number
  scores: PuffScores

  /** 当前底噪 dBFS（校准 + 空闲时自适应） */
  noiseFloorDb: number
  /** db - noiseFloorDb */
  snrDb: number
  /** 满气压（level / pressure = 1）对应的信噪比 dB；autoRange 时随吹过的最大力度上调 */
  fullScaleSnrDb: number

  /** 当前这口气持续毫秒（未吹气为 0） */
  blowDuration: number
  /** 距上次吹气结束的毫秒数（吹气中为 0） */
  silenceDuration: number
  /** 本次 start 以来吹气次数 */
  blowCount: number

  /** 平稳度 0..1：最近 steadinessWindowMs 内气压越稳越接近 1（长音） */
  steadiness: number
  /** 气息周期性波动频率 Hz（气颤音，一般 4–7 Hz，检测范围 2–12 Hz），无明显波动为 0 */
  modulationRate: number
  /** 周期性波动幅度（≈ 正弦振幅，与 level / pressure 同单位），无明显波动为 0 */
  modulationDepth: number
  /** 波动周期性 0..1（原始响度去趋势后的自相关峰），≥ 0.5 且幅度 ≥ 0.015 才报 modulationRate；可用来淡入颤音效果 */
  modulationClarity: number

  /** includeSpectrum 时提供：各 bin 的 dB（长度 fftSize / 2） */
  spectrum?: Float32Array
  /** includeWaveform 时提供：时域采样 */
  waveform?: Float32Array
  /** 频率分辨率 Hz / bin */
  binHz: number
  sampleRate: number
}

export type PuffBlowSummary = {
  startTime: number
  endTime: number
  duration: number
  peakPressure: number
  averagePressure: number
  /** 吐音次数（含吹气开始那一次） */
  articulationCount: number
}

export type PuffCalibration = {
  noiseFloorDb: number
  /** 校准期间 dB 的标准差，环境越嘈杂越大 */
  noiseStdDb: number
  frames: number
}

export type PuffEventMap = {
  frame: PuffFrame
  blowStart: PuffFrame
  blowEnd: PuffBlowSummary & {frame: PuffFrame}
  articulation: PuffFrame
  calibrated: PuffCalibration
}

export type PuffEventName = keyof PuffEventMap

export type PuffDetectorOptions = {
  /** 复用已有 AudioContext（不传则内部创建，dispose 时关闭） */
  audioContext?: AudioContext
  /** 分析窗口，默认 1024（48 kHz 约 21 ms） */
  fftSize?: 512 | 1024 | 2048 | 4096
  /** 分析间隔毫秒，默认 16 */
  intervalMs?: number
  /** getUserMedia 音频约束；默认关闭回声消除 / 降噪 / 自动增益（它们会吃掉气流声） */
  mediaAudioConstraints?: MediaTrackConstraints
  /** 开麦后自动校准底噪的毫秒数，默认 500；0 表示不自动校准 */
  autoCalibrateMs?: number

  /** 开始吹气需要的最小信噪比 dB，默认 10 */
  startSnrDb?: number
  /** 保持吹气的最小信噪比 dB，默认 5 */
  stopSnrDb?: number
  /** 开始吹气需要的置信度，默认 0.55 */
  startConfidence?: number
  /** 保持吹气的置信度，默认 0.35 */
  stopConfidence?: number
  /** 条件持续满足多久才算开始，默认 30 ms */
  minOnMs?: number
  /** 条件持续不满足多久才算结束，默认 80 ms */
  minOffMs?: number

  /** 信噪比从 stopSnrDb 起多少 dB 映射到满气压 1，默认 36；开 autoRange 时是最小量程 */
  dynamicRangeDb?: number
  /** 自动量程：吹得比当前满量程更用力时，满量程跟着上调，pressure 不会一吹就顶满。默认 true */
  autoRange?: boolean
  /** 自动量程在不吹气时每秒回落多少 dB（回落到 dynamicRangeDb 为止），默认 1 */
  autoRangeDecayDbPerSec?: number
  /** 气压曲线指数，<1 更灵敏，>1 更需用力，默认 1 */
  pressureCurve?: number
  /** 起音时间常数 ms，默认 20 */
  attackMs?: number
  /** 释音时间常数 ms，默认 90 */
  releaseMs?: number

  /** 吐音：气压在 articulationWindowMs 内回升超过该值判为吐音，默认 0.18 */
  articulationThreshold?: number
  /** 吐音：回落谷底需低于回落前峰值的该比例（区分舌头断气与气颤音起伏），默认 0.45 */
  articulationDipRatio?: number
  /** 吐音回升的判定窗口，默认 80 ms */
  articulationWindowMs?: number
  /** 两次吐音最小间隔，默认 90 ms */
  articulationMinGapMs?: number

  /** 平稳度统计窗口，默认 300 ms */
  steadinessWindowMs?: number
  /** 颤音分析窗口，默认 1200 ms（只取最近一次吐音 / 吹气开始之后的部分） */
  modulationWindowMs?: number

  /** 帧里附带完整频谱（Float32Array，按帧复制，默认 false） */
  includeSpectrum?: boolean
  /** 帧里附带时域波形（默认 false） */
  includeWaveform?: boolean
}

export type ResolvedPuffOptions = Required<Omit<PuffDetectorOptions, 'audioContext'>>
