/** Standard MIDI File 的底层结构（与 MusicScore 无关） */

export type MidiNoteEvent = {
  /** 起始 tick（绝对） */
  tick: number
  durationTicks: number
  /** 0..127 */
  midi: number
  /** 1..127 */
  velocity: number
  /** 0..15 */
  channel: number
}

export type MidiTempoEvent = {
  tick: number
  /** 每四分音符微秒数（FF 51） */
  microsecondsPerQuarter: number
}

export type MidiTimeSignatureEvent = {
  tick: number
  numerator: number
  /** 实际分母（2、4、8…），不是 2 的幂指数 */
  denominator: number
}

export type MidiKeySignatureEvent = {
  tick: number
  /** -7..7：负数为降号数，正数为升号数 */
  sf: number
  /** 0 = 大调，1 = 小调 */
  mi: 0 | 1
}

export type MidiProgramEvent = {
  tick: number
  channel: number
  program: number
}

export type MidiTrack = {
  name?: string
  notes: MidiNoteEvent[]
  programs: MidiProgramEvent[]
}

export type MidiFileData = {
  /** 0 | 1 | 2 */
  format: number
  /** ticks per quarter note */
  ppq: number
  tracks: MidiTrack[]
  /** 全局 meta（任意音轨里出现的都汇总到这里，按 tick 排序） */
  tempos: MidiTempoEvent[]
  timeSignatures: MidiTimeSignatureEvent[]
  keySignatures: MidiKeySignatureEvent[]
}
