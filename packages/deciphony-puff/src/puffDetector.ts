import {DEFAULT_PUFF_OPTIONS, INITIAL_NOISE_FLOOR_DB, MIN_NOISE_FLOOR_DB} from './constants'
import {clamp01, computeLevelFeatures, computePeriodicity, computeSpectralFeatures} from './features'
import type {
  PuffCalibration,
  PuffDetectorOptions,
  PuffEventMap,
  PuffEventName,
  PuffFrame,
  PuffScores,
  PuffState,
  ResolvedPuffOptions,
} from './types'

type Listener<K extends PuffEventName> = (payload: PuffEventMap[K]) => void

type HistoryPoint = {t: number; level: number; pressure: number}

/** 自动量程上调的时间常数：持续用力约 0.3 s 跟上，几十毫秒的噗声只撑大一点 */
const AUTO_RANGE_ATTACK_MS = 150

/** 颤音分析跳过吐音 / 吹气开始后的这段时间，避免把起音斜坡和吐音回落当成波动 */
const MODULATION_SKIP_AFTER_ARTICULATION_MS = 120
/** 颤音分析至少需要的时长（约两个 4–5 Hz 周期） */
const MODULATION_MIN_SPAN_MS = 450
/** 颤音分析重采样步长：帧间隔受 setInterval 抖动影响，先插值到均匀网格再做自相关 */
const MODULATION_STEP_MS = 10
const MODULATION_MIN_HZ = 2
const MODULATION_MAX_HZ = 12
/** 自相关峰低于该值视为随机起伏，不报颤音 */
const MODULATION_MIN_CLARITY = 0.5
/** 波动幅度（level 单位）低于该值不报颤音；气流噪声本身的 RMS 起伏约 0.01 */
const MODULATION_MIN_DEPTH = 0.015
/** 取第一个不低于最高峰该比例的自相关峰，避免选到倍周期 */
const KEY_MAXIMA_RATIO = 0.9

function resampleLevel(points: HistoryPoint[], stepMs: number): number[] {
  const out: number[] = []
  const end = points[points.length - 1]!.t
  let j = 0
  for (let t = points[0]!.t; t <= end; t += stepMs) {
    while (j < points.length - 2 && points[j + 1]!.t < t) j++
    const a = points[j]!
    const b = points[j + 1] ?? a
    const f = b.t > a.t ? clamp01((t - a.t) / (b.t - a.t)) : 0
    out.push(a.level + (b.level - a.level) * f)
  }
  return out
}

function detrend(values: number[]): number[] {
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = values.reduce((s, v) => s + v, 0) / n
  let sxy = 0
  let sxx = 0
  values.forEach((v, i) => {
    sxy += (i - xMean) * (v - yMean)
    sxx += (i - xMean) ** 2
  })
  const slope = sxx > 0 ? sxy / sxx : 0
  return values.map((v, i) => v - yMean - slope * (i - xMean))
}

type CalibrationRun = {
  until: number
  dbs: number[]
  resolve?: (result: PuffCalibration) => void
}

function smoothingCoef(dt: number, tauMs: number): number {
  return tauMs <= 0 ? 1 : 1 - Math.exp(-dt / tauMs)
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/**
 * 麦克风吹气检测。
 *
 * - 分类：信噪比 × (非周期性 + 噪声感/低频湍流)，区分吹气与说话、哼唱、口哨
 * - 门限：开始 / 保持两套阈值（迟滞）+ 最短持续时间，避免临界抖动
 * - 输出：pressure（起音/释音包络，驱动乐器音量）、吐音、颤音、平稳度及全部原始特征
 */
export class PuffDetector {
  private opts: ResolvedPuffOptions
  private audioContext: AudioContext | null
  private ownsAudioContext = false
  private micStream: MediaStream | null = null
  private ownsMicStream = true
  private source: MediaStreamAudioSourceNode | undefined
  private analyser: AnalyserNode | undefined
  private silentTap: GainNode | undefined
  private timer: ReturnType<typeof setInterval> | undefined
  private timeData: Float32Array<ArrayBuffer> = new Float32Array(0)
  private freqData: Float32Array<ArrayBuffer> = new Float32Array(0)
  private prevFreqData: Float32Array<ArrayBuffer> | null = null
  private readonly listeners = new Map<PuffEventName, Set<Listener<PuffEventName>>>()

  private startedAt = 0
  private lastTickAt = 0
  private state: PuffState = 'idle'
  private calibration: CalibrationRun | null = null
  private noiseFloorDb = INITIAL_NOISE_FLOOR_DB
  private fullScaleSnrDb = DEFAULT_PUFF_OPTIONS.stopSnrDb + DEFAULT_PUFF_OPTIONS.dynamicRangeDb
  private confidence = 0
  private pressure = 0
  private onTimer = 0
  private offTimer = 0
  private history: HistoryPoint[] = []
  private lastArticulationAt = -Infinity
  private blowStartedAt = 0
  private lastBlowEndedAt = -1
  private blowCount = 0
  private blowPeak = 0
  private blowPressureSum = 0
  private blowArticulations = 0
  private last: PuffFrame | null = null

  constructor(options: PuffDetectorOptions = {}) {
    const {audioContext, ...rest} = options
    this.audioContext = audioContext ?? null
    this.opts = this.resolve(rest)
  }

  get context(): AudioContext | null {
    return this.audioContext
  }

  get running(): boolean {
    return this.timer != null
  }

  get lastFrame(): PuffFrame | null {
    return this.last
  }

  get options(): Readonly<ResolvedPuffOptions> {
    return this.opts
  }

  get currentNoiseFloorDb(): number {
    return this.noiseFloorDb
  }

  /** 当前满气压（pressure = 1）对应的信噪比 dB */
  get currentFullScaleSnrDb(): number {
    return this.fullScaleSnrDb
  }

  /** 自动量程回到最小（stopSnrDb + dynamicRangeDb），比如换人吹、换麦克风时调用 */
  resetRange(): void {
    this.fullScaleSnrDb = this.opts.stopSnrDb + this.opts.dynamicRangeDb
  }

  /** 运行中可调；fftSize 变化会立即重建分析缓冲 */
  setOptions(options: Omit<PuffDetectorOptions, 'audioContext'>): void {
    const prevFft = this.opts.fftSize
    const prevInterval = this.opts.intervalMs
    this.opts = this.resolve({...this.opts, ...options})
    if (this.analyser && prevFft !== this.opts.fftSize) this.allocateBuffers()
    if (this.timer != null && prevInterval !== this.opts.intervalMs) {
      clearInterval(this.timer)
      this.timer = setInterval(this.tick, this.opts.intervalMs)
    }
  }

  on<K extends PuffEventName>(name: K, listener: Listener<K>): () => void {
    let set = this.listeners.get(name)
    if (!set) {
      set = new Set()
      this.listeners.set(name, set)
    }
    set.add(listener as Listener<PuffEventName>)
    return () => this.off(name, listener)
  }

  off<K extends PuffEventName>(name: K, listener: Listener<K>): void {
    this.listeners.get(name)?.delete(listener as Listener<PuffEventName>)
  }

  /** 申请麦克风并开始检测（需在用户手势中调用，以便恢复 AudioContext） */
  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({audio: this.opts.mediaAudioConstraints})
    await this.connect(stream, true)
  }

  /** 使用已有 MediaStream（stop 时不会关闭 tracks） */
  async startWithStream(stream: MediaStream): Promise<void> {
    await this.connect(stream, false)
  }

  /**
   * 重新测量环境底噪（期间请保持安静，不判定吹气）。
   * 返回 Promise，完成时也会触发 calibrated 事件。
   */
  calibrate(durationMs = 1000): Promise<PuffCalibration> {
    return new Promise((resolve) => {
      this.beginCalibration(durationMs, resolve)
    })
  }

  stop(): void {
    if (this.timer != null) clearInterval(this.timer)
    this.timer = undefined
    if (this.micStream && this.ownsMicStream) {
      for (const track of this.micStream.getTracks()) track.stop()
    }
    this.micStream = null
    for (const node of [this.source, this.analyser, this.silentTap]) {
      try {
        node?.disconnect()
      } catch {
        /* already disconnected */
      }
    }
    this.source = undefined
    this.analyser = undefined
    this.silentTap = undefined
    if (this.state === 'blowing' && this.last) this.finishBlow(this.last)
    this.state = 'idle'
    this.calibration = null
  }

  /** 停止并释放；若 AudioContext 由本实例创建则关闭 */
  dispose(): void {
    this.stop()
    this.listeners.clear()
    if (this.ownsAudioContext && this.audioContext) void this.audioContext.close()
    this.audioContext = null
    this.ownsAudioContext = false
  }

  private resolve(options: Omit<PuffDetectorOptions, 'audioContext'>): ResolvedPuffOptions {
    const merged = {...DEFAULT_PUFF_OPTIONS} as ResolvedPuffOptions
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) (merged as Record<string, unknown>)[key] = value
    }
    merged.mediaAudioConstraints = {
      ...DEFAULT_PUFF_OPTIONS.mediaAudioConstraints,
      ...(options.mediaAudioConstraints ?? {}),
    }
    return merged
  }

  private async connect(stream: MediaStream, owns: boolean): Promise<void> {
    this.stop()
    this.resetRunState()
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
      this.ownsAudioContext = true
    }
    const ctx = this.audioContext
    if (ctx.state === 'suspended') await ctx.resume()

    this.micStream = stream
    this.ownsMicStream = owns
    this.source = ctx.createMediaStreamSource(stream)
    this.analyser = ctx.createAnalyser()
    this.analyser.smoothingTimeConstant = 0
    this.allocateBuffers()
    this.source.connect(this.analyser)
    this.silentTap = ctx.createGain()
    this.silentTap.gain.value = 0
    this.analyser.connect(this.silentTap)
    this.silentTap.connect(ctx.destination)

    this.startedAt = performance.now()
    this.lastTickAt = this.startedAt
    if (this.opts.autoCalibrateMs > 0) this.beginCalibration(this.opts.autoCalibrateMs)
    this.timer = setInterval(this.tick, this.opts.intervalMs)
  }

  private allocateBuffers(): void {
    if (!this.analyser) return
    this.analyser.fftSize = this.opts.fftSize
    this.timeData = new Float32Array(this.analyser.fftSize)
    this.freqData = new Float32Array(this.analyser.frequencyBinCount)
    this.prevFreqData = null
  }

  private resetRunState(): void {
    this.state = 'idle'
    this.confidence = 0
    this.pressure = 0
    this.onTimer = 0
    this.offTimer = 0
    this.history = []
    this.lastArticulationAt = -Infinity
    this.lastBlowEndedAt = -1
    this.blowCount = 0
    this.blowPeak = 0
    this.last = null
    this.resetRange()
  }

  /**
   * 满气压对应的信噪比：最低 stopSnrDb + dynamicRangeDb。
   * autoRange 时吹气超过它就跟上去（带平滑，瞬间的噗声不会一下撑满），不吹时按 autoRangeDecayDbPerSec 回落。
   */
  private updateFullScale(snrDb: number, dt: number): void {
    const o = this.opts
    const min = o.stopSnrDb + o.dynamicRangeDb
    if (!o.autoRange) {
      this.fullScaleSnrDb = min
      return
    }
    if (this.state === 'blowing') {
      if (snrDb > this.fullScaleSnrDb) {
        this.fullScaleSnrDb += (snrDb - this.fullScaleSnrDb) * smoothingCoef(dt, AUTO_RANGE_ATTACK_MS)
      }
    } else {
      this.fullScaleSnrDb -= (o.autoRangeDecayDbPerSec * dt) / 1000
    }
    if (this.fullScaleSnrDb < min) this.fullScaleSnrDb = min
  }

  private beginCalibration(durationMs: number, resolve?: (r: PuffCalibration) => void): void {
    const now = performance.now()
    if (this.state === 'blowing' && this.last) this.finishBlow(this.last)
    this.calibration = {until: now + durationMs, dbs: [], ...(resolve ? {resolve} : {})}
    this.state = 'calibrating'
  }

  private emit<K extends PuffEventName>(name: K, payload: PuffEventMap[K]): void {
    const set = this.listeners.get(name)
    if (!set) return
    for (const listener of set) (listener as Listener<K>)(payload)
  }

  private tick = (): void => {
    const analyser = this.analyser
    const ctx = this.audioContext
    if (!analyser || !ctx) return
    const now = performance.now()
    const dt = Math.max(1, now - this.lastTickAt)
    this.lastTickAt = now
    const o = this.opts

    analyser.getFloatTimeDomainData(this.timeData)
    analyser.getFloatFrequencyData(this.freqData)
    const level = computeLevelFeatures(this.timeData)
    const spectral = computeSpectralFeatures(this.freqData, ctx.sampleRate, this.prevFreqData)
    const periodic = computePeriodicity(this.timeData, ctx.sampleRate)
    if (!this.prevFreqData || this.prevFreqData.length !== this.freqData.length) {
      this.prevFreqData = new Float32Array(this.freqData.length)
    }
    this.prevFreqData.set(this.freqData)

    const calibration = this.calibration
    if (calibration) {
      calibration.dbs.push(level.db)
      if (now >= calibration.until) this.completeCalibration(calibration)
    }

    const snrDb = level.db - this.noiseFloorDb
    const scores: PuffScores = {
      loudness: clamp01((snrDb - o.stopSnrDb) / (o.startSnrDb + 10 - o.stopSnrDb)),
      noisiness: clamp01((spectral.localFlatness - 0.15) / 0.3),
      aperiodicity: 1 - clamp01((periodic.periodicity - 0.5) / 0.4),
      turbulence: clamp01((spectral.bands.sub.ratio + spectral.bands.low.ratio - 0.3) / 0.5),
    }
    const rawConfidence =
      scores.loudness * scores.aperiodicity * (0.4 + 0.6 * Math.max(scores.noisiness, scores.turbulence))
    this.confidence += (rawConfidence - this.confidence) * smoothingCoef(dt, 30)

    this.updateFullScale(snrDb, dt)
    const rawLevel = clamp01((snrDb - o.stopSnrDb) / (this.fullScaleSnrDb - o.stopSnrDb)) ** o.pressureCurve

    let blowStart = false
    let blowEnd = false
    if (this.state === 'idle') {
      const ok = snrDb >= o.startSnrDb && this.confidence >= o.startConfidence
      this.onTimer = ok ? this.onTimer + dt : 0
      if (this.onTimer >= o.minOnMs) {
        this.state = 'blowing'
        blowStart = true
        this.onTimer = 0
        this.offTimer = 0
        this.blowStartedAt = now
        this.blowCount++
        this.blowPeak = 0
        this.blowPressureSum = 0
        this.blowArticulations = 0
      }
    } else if (this.state === 'blowing') {
      const keep = snrDb >= o.stopSnrDb && this.confidence >= o.stopConfidence
      this.offTimer = keep ? 0 : this.offTimer + dt
      if (this.offTimer >= o.minOffMs) {
        this.state = 'idle'
        blowEnd = true
        this.offTimer = 0
      }
    } else if (!calibration) {
      this.state = 'idle'
    }

    if (this.state !== 'blowing' && !calibration) this.adaptNoiseFloor(level.db, dt)

    const isBlowing = this.state === 'blowing'
    const target = isBlowing ? rawLevel : 0
    const prevPressure = this.pressure
    const tau = target > this.pressure ? o.attackMs : o.releaseMs
    this.pressure += (target - this.pressure) * smoothingCoef(dt, tau)
    if (this.pressure < 1e-4) this.pressure = 0
    const pressureVelocity = ((this.pressure - prevPressure) / dt) * 1000

    this.history.push({t: now, level: rawLevel, pressure: this.pressure})
    const keepMs = Math.max(o.modulationWindowMs, o.steadinessWindowMs, o.articulationWindowMs * 3)
    while (this.history.length && this.history[0]!.t < now - keepMs) this.history.shift()

    let articulation = blowStart
    if (isBlowing && !blowStart && now - this.lastArticulationAt >= o.articulationMinGapMs) {
      articulation = this.detectArticulation(now, rawLevel)
    }
    if (articulation) {
      this.lastArticulationAt = now
      this.blowArticulations++
    }

    if (isBlowing) {
      this.blowPeak = Math.max(this.blowPeak, this.pressure)
      this.blowPressureSum += this.pressure * dt
    }

    const blowDuration = isBlowing ? now - this.blowStartedAt : 0
    const {steadiness, modulationRate, modulationDepth, modulationClarity} = this.analyseStability(
      now,
      isBlowing,
      blowDuration,
    )

    const frame: PuffFrame = {
      ...level,
      ...spectral,
      ...periodic,
      time: now - this.startedAt,
      audioTime: ctx.currentTime,
      dt,
      state: this.state,
      isBlowing,
      blowStart,
      blowEnd,
      articulation,
      pressure: this.pressure,
      pressureVelocity,
      level: rawLevel,
      peakPressure: this.blowPeak,
      confidence: this.confidence,
      scores,
      noiseFloorDb: this.noiseFloorDb,
      snrDb,
      fullScaleSnrDb: this.fullScaleSnrDb,
      blowDuration,
      silenceDuration: isBlowing || this.lastBlowEndedAt < 0 ? 0 : now - this.lastBlowEndedAt,
      blowCount: this.blowCount,
      steadiness,
      modulationRate,
      modulationDepth,
      modulationClarity,
      binHz: ctx.sampleRate / o.fftSize,
      sampleRate: ctx.sampleRate,
      ...(o.includeSpectrum ? {spectrum: new Float32Array(this.freqData)} : {}),
      ...(o.includeWaveform ? {waveform: new Float32Array(this.timeData)} : {}),
    }
    this.last = frame

    if (blowStart) this.emit('blowStart', frame)
    if (articulation) this.emit('articulation', frame)
    if (blowEnd) this.finishBlow(frame)
    this.emit('frame', frame)
  }

  private completeCalibration(run: CalibrationRun): void {
    this.calibration = null
    this.state = 'idle'
    const dbs = run.dbs.filter((db) => db > MIN_NOISE_FLOOR_DB)
    const floor = dbs.length ? median(dbs) : MIN_NOISE_FLOOR_DB
    const mean = dbs.length ? dbs.reduce((s, v) => s + v, 0) / dbs.length : floor
    const variance = dbs.length ? dbs.reduce((s, v) => s + (v - mean) ** 2, 0) / dbs.length : 0
    this.noiseFloorDb = floor
    this.resetRange()
    const result: PuffCalibration = {noiseFloorDb: floor, noiseStdDb: Math.sqrt(variance), frames: dbs.length}
    run.resolve?.(result)
    this.emit('calibrated', result)
  }

  /** 空闲时底噪缓慢跟随环境：变安静时快速下调，变吵时缓慢上调（避免把吹气学成底噪） */
  private adaptNoiseFloor(db: number, dt: number): void {
    const diff = db - this.noiseFloorDb
    if (diff < 0) {
      this.noiseFloorDb = Math.max(MIN_NOISE_FLOOR_DB, this.noiseFloorDb + diff * smoothingCoef(dt, 400))
    } else if (diff < this.opts.stopSnrDb) {
      this.noiseFloorDb += diff * smoothingCoef(dt, 3000)
    }
  }

  /** 吐音：窗口内先有深回落（谷底 ≤ 峰值 × dipRatio 且落差 ≥ 阈值一半），随后从谷底回升 ≥ 阈值 */
  private detectArticulation(now: number, level: number): boolean {
    const o = this.opts
    let minIdx = -1
    let minLevel = Infinity
    for (let i = this.history.length - 1; i >= 0; i--) {
      const point = this.history[i]!
      if (point.t < now - o.articulationWindowMs) break
      if (point.level < minLevel) {
        minLevel = point.level
        minIdx = i
      }
    }
    if (minIdx < 0 || level - minLevel < o.articulationThreshold) return false
    let maxBefore = 0
    for (let i = minIdx - 1; i >= 0; i--) {
      const point = this.history[i]!
      if (point.t < now - o.articulationWindowMs * 3) break
      if (point.level > maxBefore) maxBefore = point.level
    }
    return maxBefore - minLevel >= o.articulationThreshold * 0.5 && minLevel <= maxBefore * o.articulationDipRatio
  }

  private analyseStability(
    now: number,
    isBlowing: boolean,
    blowDuration: number,
  ): {steadiness: number; modulationRate: number; modulationDepth: number; modulationClarity: number} {
    const o = this.opts
    if (!isBlowing) return {steadiness: 0, modulationRate: 0, modulationDepth: 0, modulationClarity: 0}

    const steadyPoints = this.history.filter((p) => p.t >= now - Math.min(o.steadinessWindowMs, blowDuration))
    let steadiness = 0
    if (steadyPoints.length >= 3) {
      const mean = steadyPoints.reduce((s, p) => s + p.pressure, 0) / steadyPoints.length
      const std = Math.sqrt(steadyPoints.reduce((s, p) => s + (p.pressure - mean) ** 2, 0) / steadyPoints.length)
      steadiness = clamp01(1 - std * 8)
    }

    const windowStart = Math.max(
      now - Math.min(o.modulationWindowMs, blowDuration),
      this.lastArticulationAt + MODULATION_SKIP_AFTER_ARTICULATION_MS,
    )
    const points = this.history.filter((p) => p.t >= windowStart)
    const none = {steadiness, modulationRate: 0, modulationDepth: 0, modulationClarity: 0}
    if (points.length < 12 || now - points[0]!.t < MODULATION_MIN_SPAN_MS) return none

    const residual = detrend(resampleLevel(points, MODULATION_STEP_MS))
    const n = residual.length
    const energy = residual.reduce((s, r) => s + r * r, 0)
    if (energy <= 0) return none

    const minLag = Math.ceil(1000 / MODULATION_MAX_HZ / MODULATION_STEP_MS)
    const maxLag = Math.min(Math.floor(1000 / MODULATION_MIN_HZ / MODULATION_STEP_MS), n >> 1)
    if (maxLag <= minLag + 1) return none
    const nac = new Float64Array(maxLag + 2)
    for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
      let acf = 0
      let e0 = 0
      let e1 = 0
      for (let i = 0; i + lag < n; i++) {
        acf += residual[i]! * residual[i + lag]!
        e0 += residual[i]! ** 2
        e1 += residual[i + lag]! ** 2
      }
      nac[lag] = e0 > 0 && e1 > 0 ? acf / Math.sqrt(e0 * e1) : 0
    }

    const peaks: number[] = []
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (nac[lag]! > 0 && nac[lag]! > nac[lag - 1]! && nac[lag]! >= nac[lag + 1]!) peaks.push(lag)
    }
    if (!peaks.length) return none
    const weighted = (l: number): number => (nac[l]! * (n - l)) / n
    const highest = Math.max(...peaks.map(weighted))
    const lag = peaks.find((l) => weighted(l) >= highest * KEY_MAXIMA_RATIO)!
    const clarity = clamp01(nac[lag]!)
    const depth = Math.sqrt((2 * energy * clarity) / n)
    if (clarity < MODULATION_MIN_CLARITY || depth < MODULATION_MIN_DEPTH) return {...none, modulationClarity: clarity}

    const y0 = nac[lag - 1]!
    const y1 = nac[lag]!
    const y2 = nac[lag + 1]!
    const denom = y0 - 2 * y1 + y2
    const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0
    return {
      steadiness,
      modulationRate: 1000 / ((lag + shift) * MODULATION_STEP_MS),
      modulationDepth: depth,
      modulationClarity: clarity,
    }
  }

  private finishBlow(frame: PuffFrame): void {
    const now = performance.now()
    const duration = now - this.blowStartedAt
    this.lastBlowEndedAt = now
    this.emit('blowEnd', {
      startTime: this.blowStartedAt - this.startedAt,
      endTime: now - this.startedAt,
      duration,
      peakPressure: this.blowPeak,
      averagePressure: duration > 0 ? this.blowPressureSum / duration : 0,
      articulationCount: this.blowArticulations,
      frame,
    })
  }
}
