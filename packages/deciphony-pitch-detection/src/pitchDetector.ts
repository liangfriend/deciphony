import {DywaPitchTracker} from './dywaPitchTracker'
import {DEFAULT_PITCH_DETECT_TUNING, pitchDetectTuning} from './constants'
import {detectFrequency, toPitchDetectResult} from './detect'
import type {
  PitchDetectCallback,
  PitchDetectorOptions,
  PitchDetectTuning,
} from './types'

/**
 * 麦克风 / MediaStream 实时音高检测。
 *
 * 与「伴奏 BufferSource 同 AudioContext」并存时：渲染线程里各节点按 quantum 并行处理。
 * 麦克风支路未接到 destination 时个别实现对子图调度偏弱 → 使用 gain=0 静音 tap。
 */
export class PitchDetector {
  readonly tuning: PitchDetectTuning

  private audioContext: AudioContext | null
  private ownsAudioContext = false
  private analyser: AnalyserNode | undefined
  private dataArray: Float32Array<ArrayBuffer> | undefined
  private source: MediaStreamAudioSourceNode | undefined
  private micSilentTap: GainNode | undefined
  private micStream: MediaStream | null = null
  private ownsMicStream = true
  private animationFrameId = 0
  private detectCallback: PitchDetectCallback | undefined
  private dywaTracker: DywaPitchTracker | null = null
  private running = false

  constructor(options: PitchDetectorOptions = {}) {
    const {
      audioContext,
      shareTuning = true,
      silenceRmsThreshold,
      dywaMaximaThresholdRatio,
      mediaAudioConstraints,
      minFrequency,
      maxFrequency,
    } = options

    this.audioContext = audioContext ?? null

    const hasOverride =
      silenceRmsThreshold !== undefined ||
      dywaMaximaThresholdRatio !== undefined ||
      mediaAudioConstraints !== undefined ||
      minFrequency !== undefined ||
      maxFrequency !== undefined

    if (shareTuning && !hasOverride) {
      this.tuning = pitchDetectTuning
    } else {
      this.tuning = {
        silenceRmsThreshold:
          silenceRmsThreshold ?? pitchDetectTuning.silenceRmsThreshold,
        dywaMaximaThresholdRatio:
          dywaMaximaThresholdRatio ?? pitchDetectTuning.dywaMaximaThresholdRatio,
        mediaAudioConstraints: {
          ...DEFAULT_PITCH_DETECT_TUNING.mediaAudioConstraints,
          ...pitchDetectTuning.mediaAudioConstraints,
          ...(mediaAudioConstraints ?? {}),
        },
        minFrequency: minFrequency ?? pitchDetectTuning.minFrequency,
        maxFrequency: maxFrequency ?? pitchDetectTuning.maxFrequency,
      }
    }
  }

  get context(): AudioContext | null {
    return this.audioContext
  }

  /** 使用 getUserMedia 开麦检测 */
  async start(cb: PitchDetectCallback): Promise<void> {
    this.stop()
    this.resetTracker()
    this.ownsMicStream = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: this.tuning.mediaAudioConstraints,
      })
      this.connectMicStream(stream, cb)
    } catch (e) {
      console.error('获取麦克风失败:', e)
      throw e
    }
  }

  /** 使用已有 MediaStream（dispose/stop 时不会 stop tracks） */
  async startWithStream(
    stream: MediaStream,
    cb: PitchDetectCallback,
  ): Promise<void> {
    this.stop()
    this.resetTracker()
    this.ownsMicStream = false
    try {
      this.connectMicStream(stream, cb)
    } catch (e) {
      console.error('连接麦克风失败:', e)
      throw e
    }
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = 0
    if (this.micStream && this.ownsMicStream) {
      for (const t of this.micStream.getTracks()) {
        t.stop()
      }
    }
    this.micStream = null
    this.ownsMicStream = true
    try {
      this.source?.disconnect()
    } catch {
      /* already disconnected */
    }
    this.source = undefined
    try {
      this.analyser?.disconnect()
    } catch {
      /* noop */
    }
    this.analyser = undefined
    try {
      this.micSilentTap?.disconnect()
    } catch {
      /* noop */
    }
    this.micSilentTap = undefined
    this.dataArray = undefined
    this.detectCallback = undefined
  }

  /** 停止检测；若本实例创建了 AudioContext 则 close */
  dispose(): void {
    this.stop()
    if (this.ownsAudioContext && this.audioContext) {
      void this.audioContext.close()
    }
    this.audioContext = null
    this.ownsAudioContext = false
    this.dywaTracker = null
  }

  private resetTracker(): void {
    this.dywaTracker = new DywaPitchTracker(-1, -1)
    this.dywaTracker.MaximaThresholdRatio = this.tuning.dywaMaximaThresholdRatio
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
      this.ownsAudioContext = true
    }
    return this.audioContext
  }

  private getTracker(): DywaPitchTracker {
    if (!this.dywaTracker) this.resetTracker()
    return this.dywaTracker!
  }

  private connectMicStream(stream: MediaStream, cb: PitchDetectCallback): void {
    this.detectCallback = cb
    this.micStream = stream
    const audioContext = this.ensureContext()
    const analyser = audioContext.createAnalyser()
    this.analyser = analyser

    const need = this.getTracker().NeededSampleCount(80)
    analyser.fftSize = Math.min(32768, Math.max(2048, need))
    this.dataArray = new Float32Array(analyser.fftSize)

    this.source = audioContext.createMediaStreamSource(stream)
    this.source.connect(analyser)
    this.micSilentTap = audioContext.createGain()
    this.micSilentTap.gain.value = 0
    analyser.connect(this.micSilentTap)
    this.micSilentTap.connect(audioContext.destination)

    this.running = true
    this.tick()
  }

  private tick = (): void => {
    if (!this.running || !this.analyser || !this.dataArray || !this.audioContext) {
      return
    }
    this.analyser.getFloatTimeDomainData(this.dataArray)
    const frequency = detectFrequency(
      this.dataArray,
      this.audioContext.sampleRate,
      {
        tracker: this.getTracker(),
        silenceRmsThreshold: this.tuning.silenceRmsThreshold,
        dywaMaximaThresholdRatio: this.tuning.dywaMaximaThresholdRatio,
        minFrequency: this.tuning.minFrequency,
        maxFrequency: this.tuning.maxFrequency,
      },
    )

    let result = toPitchDetectResult(frequency)
    if (frequency === -1) {
      this.dywaTracker?.ClearPitchHistory()
      result = {pitch: '', frequency: 0, midi: 0}
    }
    this.detectCallback?.(result, this.audioContext.currentTime)
    this.animationFrameId = requestAnimationFrame(this.tick)
  }
}
