import {ANALYSIS_MAX_HZ, ANALYSIS_MIN_HZ, PITCH_MAX_HZ, PITCH_MIN_HZ, PUFF_BANDS} from './constants'
import type {
  PuffBand,
  PuffBandName,
  PuffLevelFeatures,
  PuffPeriodicity,
  PuffSpectralFeatures,
} from './types'

const MIN_DB = -160
/** 有效频段：能量不低于频谱最大值 - 该 dB 的首尾 bin 之间 */
const ACTIVE_RANGE_DB = 30
/** 局部平坦度的分块宽度（bin）；分块计算可抵消频谱整体倾斜 */
const LOCAL_CHUNK_BINS = 8
/** McLeod：取第一个不低于最高关键峰该比例的峰，避免选到倍周期 */
const KEY_MAXIMA_RATIO = 0.9

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** 时域：RMS / 峰值 / dBFS / 过零率 / 削波 */
export function computeLevelFeatures(samples: Float32Array): PuffLevelFeatures {
  let sum = 0
  let peak = 0
  let crossings = 0
  let prev = samples[0] ?? 0
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i]!
    sum += v * v
    const a = v < 0 ? -v : v
    if (a > peak) peak = a
    if (i > 0 && (v >= 0) !== (prev >= 0)) crossings++
    prev = v
  }
  const rms = Math.sqrt(sum / Math.max(1, samples.length))
  return {
    rms,
    peak,
    db: rms > 0 ? Math.max(MIN_DB, 20 * Math.log10(rms)) : MIN_DB,
    zeroCrossingRate: crossings / Math.max(1, samples.length - 1),
    clipping: peak >= 0.99,
  }
}

function powerToDb(p: number): number {
  return p > 0 ? Math.max(MIN_DB, 10 * Math.log10(p)) : MIN_DB
}

/**
 * 频域特征。spectrumDb 为 AnalyserNode.getFloatFrequencyData 的结果（长度 fftSize/2）。
 * prevSpectrumDb 用于频谱通量，可省略。
 */
export function computeSpectralFeatures(
  spectrumDb: Float32Array,
  sampleRate: number,
  prevSpectrumDb?: Float32Array | null,
): PuffSpectralFeatures {
  const binCount = spectrumDb.length
  const binHz = sampleRate / 2 / binCount
  const lo = Math.max(1, Math.floor(ANALYSIS_MIN_HZ / binHz))
  const hi = Math.min(binCount - 1, Math.ceil(ANALYSIS_MAX_HZ / binHz))

  let total = 0
  let weighted = 0
  let logSum = 0
  let flux = 0
  const power = new Float64Array(binCount)
  for (let i = lo; i <= hi; i++) {
    const db = Number.isFinite(spectrumDb[i]!) ? Math.max(MIN_DB, spectrumDb[i]!) : MIN_DB
    const p = 10 ** (db / 10)
    power[i] = p
    total += p
    weighted += p * i * binHz
    logSum += Math.log(p + 1e-20)
    if (prevSpectrumDb) {
      const prev = Number.isFinite(prevSpectrumDb[i]!) ? Math.max(MIN_DB, prevSpectrumDb[i]!) : MIN_DB
      const diff = db - prev
      if (diff > 0) flux += diff
    }
  }
  const count = hi - lo + 1
  const mean = total / count
  const geoMean = Math.exp(logSum / count)

  let maxDb = MIN_DB
  for (let i = lo; i <= hi; i++) maxDb = Math.max(maxDb, powerToDb(power[i]!))
  let activeLo = hi
  let activeHi = lo
  for (let i = lo; i <= hi; i++) {
    if (powerToDb(power[i]!) >= maxDb - ACTIVE_RANGE_DB) {
      activeLo = Math.min(activeLo, i)
      activeHi = Math.max(activeHi, i)
    }
  }
  if (activeHi - activeLo < 8) {
    activeLo = Math.max(lo, activeLo - 4)
    activeHi = Math.min(hi, activeHi + 4)
  }
  let activeSum = 0
  let activeLog = 0
  for (let i = activeLo; i <= activeHi; i++) {
    activeSum += power[i]!
    activeLog += Math.log(power[i]! + 1e-20)
  }
  const activeCount = activeHi - activeLo + 1
  const activeMean = activeSum / activeCount

  let localWeighted = 0
  let localPower = 0
  for (let start = activeLo; start <= activeHi; start += LOCAL_CHUNK_BINS) {
    const end = Math.min(activeHi, start + LOCAL_CHUNK_BINS - 1)
    const n = end - start + 1
    if (n < LOCAL_CHUNK_BINS / 2) break
    let s = 0
    let l = 0
    for (let i = start; i <= end; i++) {
      s += power[i]!
      l += Math.log(power[i]! + 1e-20)
    }
    if (s <= 0) continue
    localWeighted += s * clamp01(Math.exp(l / n) / (s / n))
    localPower += s
  }

  let rolloff = 0
  const target = total * 0.85
  let acc = 0
  for (let i = lo; i <= hi; i++) {
    acc += power[i]!
    if (acc >= target) {
      rolloff = i * binHz
      break
    }
  }

  const bands = {} as Record<PuffBandName, PuffBand>
  for (const [name, [fLo, fHi]] of Object.entries(PUFF_BANDS) as [PuffBandName, [number, number]][]) {
    const bLo = Math.max(lo, Math.floor(fLo / binHz))
    const bHi = Math.min(hi, Math.ceil(fHi / binHz) - 1)
    let bandPower = 0
    for (let i = bLo; i <= bHi; i++) bandPower += power[i]!
    bands[name] = {db: powerToDb(bandPower), ratio: total > 0 ? bandPower / total : 0}
  }

  return {
    spectralCentroid: total > 0 ? weighted / total : 0,
    spectralFlatness: mean > 0 ? clamp01(geoMean / mean) : 0,
    activeFlatness: activeMean > 0 ? clamp01(Math.exp(activeLog / activeCount) / activeMean) : 0,
    localFlatness: localPower > 0 ? localWeighted / localPower : 0,
    activeBandLow: activeLo * binHz,
    activeBandHigh: activeHi * binHz,
    spectralRolloff: rolloff,
    spectralFlux: prevSpectrumDb ? flux / count : 0,
    bands,
  }
}

/**
 * 周期性（McLeod NSDF）：只在第一个负区间之后找关键峰，避免低频气流噪声在小延迟处的高相关被误判为音高。
 */
export function computePeriodicity(samples: Float32Array, sampleRate: number): PuffPeriodicity {
  const minLag = Math.max(2, Math.floor(sampleRate / PITCH_MAX_HZ))
  const maxLag = Math.floor(sampleRate / PITCH_MIN_HZ)
  const size = Math.min(samples.length, maxLag * 2 + 64)
  if (size <= maxLag + 8) return {periodicity: 0, pitch: null}
  const x = samples.subarray(samples.length - size)

  let mean = 0
  for (let i = 0; i < size; i++) mean += x[i]!
  mean /= size

  const nsdf = new Float32Array(maxLag + 1)
  for (let tau = 1; tau <= maxLag; tau++) {
    let acf = 0
    let m = 0
    for (let j = 0; j + tau < size; j++) {
      const a = x[j]! - mean
      const b = x[j + tau]! - mean
      acf += a * b
      m += a * a + b * b
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0
  }

  let tau = 1
  while (tau <= maxLag && nsdf[tau]! > 0) tau++
  const keyMaxima: {tau: number; value: number}[] = []
  while (tau <= maxLag) {
    while (tau <= maxLag && nsdf[tau]! <= 0) tau++
    let localTau = -1
    let localVal = 0
    while (tau <= maxLag && nsdf[tau]! > 0) {
      if (nsdf[tau]! > localVal) {
        localVal = nsdf[tau]!
        localTau = tau
      }
      tau++
    }
    if (localTau >= minLag) keyMaxima.push({tau: localTau, value: localVal})
  }
  if (!keyMaxima.length) return {periodicity: 0, pitch: null}

  const highest = Math.max(...keyMaxima.map((k) => k.value))
  const chosen = keyMaxima.find((k) => k.value >= highest * KEY_MAXIMA_RATIO)!
  const bestTau = chosen.tau
  const bestVal = chosen.value
  const y0 = nsdf[bestTau - 1] ?? bestVal
  const y2 = nsdf[bestTau + 1] ?? bestVal
  const denom = y0 - 2 * bestVal + y2
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0
  const periodicity = clamp01(highest)
  return {
    periodicity,
    pitch: periodicity >= 0.7 ? sampleRate / (bestTau + shift) : null,
  }
}
