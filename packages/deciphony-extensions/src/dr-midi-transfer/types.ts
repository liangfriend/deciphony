import type {KeySignatureTypeEnum, MusicScore, TimeSignatureTypeEnum} from '@deciphony/renderer'

/** 写在 SingleStaff.data.midi 上的音轨信息（导入时写入，导出时读取） */
export type StaffMidiData = {
  trackName?: string
  channel?: number
  /** GM 音色 0..127 */
  program?: number
}

export type MusicScoreToMidiOptions = {
  /** ticks per quarter，默认 480 */
  ppq?: number
  /** 力度 1..127，默认 80 */
  velocity?: number
  /**
   * GM 音色：number 为全部谱表共用；数组按谱表下标取。
   * 未指定时依次取 staff.data.midi.program → 谱种默认（五线/简谱 0 钢琴，Tab6 25 钢弦吉他，Tab4 24 尼龙弦）
   */
  program?: number | number[]
  /** 覆盖曲谱 bpm */
  bpm?: number
}

export type MidiToMusicScoreOptions = {
  /** 量化网格：8 / 16 / 32 分音符，默认 16 */
  quantize?: 8 | 16 | 32
  /** 每行（grandStaff）小节数，默认 4 */
  measuresPerLine?: number
  /** 标题，默认取第一条音轨名 */
  title?: string
  /** 忽略 MIDI 自带调号，强制指定 */
  keySignature?: KeySignatureTypeEnum
  /** 忽略 MIDI 自带拍号，强制指定 */
  timeSignature?: TimeSignatureTypeEnum
  /**
   * 音域跨度大的单轨（如钢琴）是否拆成高/低音两行：
   * - 'auto'（默认）：高低两侧音符都足够多时在中央 C 处拆分
   * - 'none'：不拆
   * - number：以该 midi 为界拆分（≥ 界限进高音谱表）
   */
  splitStaff?: 'auto' | 'none' | number
  /** 包含通道 10（打击乐）音符，默认 false */
  includeDrums?: boolean
  width?: number
  height?: number
}

export type MidiToMusicScoreResult = {
  musicScore: MusicScore
  warnings: string[]
}
