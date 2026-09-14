/**
 * 解码音频并生成稀疏峰值（每秒约 peaksPerSecond 个点，避免大数组爆内存）。
 */
export async function decodeAudioForWaveform(
  url: string,
  sampleRate?: number,
  peaksPerSecond = 100,
): Promise<{buffer: AudioBuffer; peaks: Float32Array; duration: number}> {
  const res = await fetch(url)
  const arr = await res.arrayBuffer()
  const Ctx =
    window.AudioContext ||
    (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext
  const ctx = sampleRate && sampleRate > 0 ? new Ctx({sampleRate}) : new Ctx()
  try {
    const buffer = await ctx.decodeAudioData(arr.slice(0))
    const channel = buffer.getChannelData(0)
    const duration = buffer.duration
    const totalPeaks = Math.max(1, Math.ceil(duration * peaksPerSecond))
    const bucket = Math.max(1, Math.floor(channel.length / totalPeaks))
    const peaks = new Float32Array(totalPeaks)
    for (let i = 0; i < totalPeaks; i++) {
      const start = i * bucket
      const end = Math.min(channel.length, start + bucket)
      let peak = 0
      for (let j = start; j < end; j++) {
        const a = Math.abs(channel[j]!)
        if (a > peak) peak = a
      }
      peaks[i] = peak
    }
    return {buffer, peaks, duration}
  } finally {
    await ctx.close().catch(() => undefined)
  }
}
