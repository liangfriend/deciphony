// pitch-detect.ts — Web Audio 管线委托 @deciphony/pitch-detection
//
// 与「伴奏 BufferSource 同 AudioContext」并存时：渲染线程里各节点按 quantum 并行处理，
// Source 不会在 API 语义上阻塞 Analyser。若出现长时间无音高，更常见是 (1) 麦克风支路
// 未接到 destination 时个别实现对子图调度偏弱 → PitchDetector 内用 gain=0 静音 tap；
// (2) detect 走 rAF，主线程被解码/UI 占满时读点稀疏；(3) getUserMedia 的 AEC/NS/AGC
// 仍可能压低人声 RMS。

import {
  PitchDetector,
  pitchDetectTuning,
  detectFrequency,
  frequencyToNote,
  type PitchDetectCallback,
} from '@deciphony/pitch-detection'
import {_audioContext} from './ContextManager'
import type {DetectCallback} from './types'

export {pitchDetectTuning}

let detector: PitchDetector | null = null

function requireContext(): AudioContext {
  if (!_audioContext) {
    throw new Error('请先调用startTuneJudge')
  }
  return _audioContext
}

function wrapCallback(cb: DetectCallback): PitchDetectCallback {
  return (res, currentTime) => {
    cb(res, currentTime)
  }
}

function createDetector(): PitchDetector {
  return new PitchDetector({
    audioContext: requireContext(),
  })
}

export async function startDetectWithStream(
  stream: MediaStream,
  cb: DetectCallback,
) {
  detector?.stop()
  detector = createDetector()
  await detector.startWithStream(stream, wrapCallback(cb))
}

export async function startDetect(cb: DetectCallback) {
  detector?.stop()
  detector = createDetector()
  await detector.start(wrapCallback(cb))
}

function dispose() {
  // 不关闭 AudioContext（由 tune-judge ContextManager 持有）
  detector?.stop()
  detector = null
}

const pitchDetect = {
  startDetect,
  startDetectWithStream,
  dispose,
  frequencyToNote,
  autoCorrelate: detectFrequency,
  tuning: pitchDetectTuning,
}

export default pitchDetect
