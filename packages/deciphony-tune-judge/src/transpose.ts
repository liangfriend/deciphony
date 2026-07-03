/**
 * 整段移调修正：唱对旋律但低/高几个八度时，相对音程仍正确。
 * 用多组 (标准 midi, 检测 midi) 估计「半音偏移」，再把检测频率按该偏移平移后再比音准。
 */

export type TransposePair = {
  expectedMidi: number;
  detectedMidi: number;
};

/** 取中位数，抗少量错音、抖音 */
export function medianTransposeSemitones(pairs: readonly TransposePair[]): number {
  if (pairs.length === 0) return 0;
  const deltas = pairs.map((p) => p.expectedMidi - p.detectedMidi).sort((a, b) => a - b);
  return deltas[Math.floor(deltas.length / 2)]!;
}

/** 将频率整体平移若干半音（用于把「唱低了」的 f 对齐到谱面音区） */
export function shiftFrequencyBySemitones(freqHz: number, semitones: number): number {
  return freqHz * Math.pow(2, semitones / 12);
}

/** 连续 midi（与 pitch-detect 中 frequencyToMIDI 一致） */
export function frequencyToContinuousMidi(frequency: number): number {
  if (frequency < 20 || frequency > 5000) return -1;
  const A4 = 440;
  return Math.round(12 * Math.log2(frequency / A4)) + 69;
}
