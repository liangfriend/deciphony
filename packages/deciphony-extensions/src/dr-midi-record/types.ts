import type {KeySignatureTypeEnum, MeasureNoteSlot, MusicScore, TimeSignatureTypeEnum} from '@deciphony/renderer'

/** right → 高音谱表（staffIndex 0），left → 低音谱表（staffIndex 1） */
export type MidiRecordHand = 'right' | 'left'

export type MidiRecorderOptions = {
  /** 四分音符 bpm */
  bpm: number
  timeSignature: TimeSignatureTypeEnum
  /** 每行（每个单谱表）小节数 */
  measuresPerLine: number
  /** 默认 C */
  keySignature?: KeySignatureTypeEnum
  /** 量化网格 = 最小音符：4 / 8 / 16 / 32 分音符，默认 16；不需要细碎时值时调大（如 8）容错更大 */
  quantize?: 4 | 8 | 16 | 32
  /** 起音离拍点在 beatSnap × 一拍以内，直接吸到拍点（比网格就近更宽容），默认 0.2，0 关闭，最大 0.5 */
  beatSnap?: number
  /** 短于此长度（unit256，四分 = 64）的空档并入前一个音，不写休止；默认 2 个网格（16 分网格时 = 八分） */
  minRest?: number
  /** 输入延迟补偿（ms）：所有 noteOn/noteOff 时间先减去它；节拍器有输出延迟、人总按晚时设 30–100 */
  latencyMs?: number
  /** 按下时间相差在此范围内的音算同一次触键（和弦），默认 60ms */
  chordWindowMs?: number
  /** 一只手同时能按到的最大跨度（半音），默认 12；超出则拆给两只手 */
  handSpan?: number
  title?: string
  /** 曲谱宽度，默认 1000 */
  width?: number
  /**
   * 开始延时（ms）：第 1 小节起点 = start(time) + startDelayMs，用于宿主预备拍（如延时一拍 = 60000 / bpm）。
   * start() 后立即开始检测，起点前 earlyToleranceMs 以内按下的音记在第 1 拍。startOnFirstNote 时无效
   */
  startDelayMs?: number
  /** 起点之前多早按下仍算第一拍（ms），默认半拍；更早的音（预备拍内）忽略 */
  earlyToleranceMs?: number
  /** true：以第一个音的按下时间为第 1 小节起点；默认 false，以 start() 时刻为起点（配合宿主节拍器） */
  startOnFirstNote?: boolean
  /** 时间源（ms），默认 performance.now()；与 noteOn/noteOff 传入的 time 同一基准 */
  now?: () => number
  /** 每写入一个音符组 / 一段休止回调一次 */
  onAppend?: (event: MidiRecordAppendEvent) => void
}

/** 一次写入落到某个小节里的一段（跨小节会拆成多段并用延音线连接） */
export type MidiRecordPiece = {
  slot: MeasureNoteSlot
  /** 全曲小节序号（0 起） */
  measureNo: number
  grandStaffIndex: number
  /** 在所在 grandStaff 内的小节下标 */
  measureIndex: number
  /** 在小节音符列表中的下标 */
  slotIndex: number
  /** 小节内起点（unit256，四分 = 64） */
  onsetInMeasure: number
  duration: number
}

export type MidiRecordAppendEvent = {
  kind: 'note' | 'rest'
  hand: MidiRecordHand
  /** 0 高音谱表，1 低音谱表 */
  staffIndex: 0 | 1
  /** 本组音高（升序）；休止为空 */
  midis: number[]
  /** 自录制起点的起始位置（unit256） */
  onset: number
  duration: number
  pieces: MidiRecordPiece[]
  /** 本次新增的延音线（affiliatedSymbols）id */
  tieIds: string[]
  /** 新增了行或改了曲谱高度（宿主可能需要整体重排） */
  layoutChanged: boolean
  /** 录制器内部维护的同一个对象（原地修改） */
  musicScore: MusicScore
}

export type MidiRecordPosition = {
  /** 自起点的位置（unit256）；未开始计时为 null */
  units: number | null
  /** 当前所在小节序号（0 起） */
  measureNo: number | null
}

export type MidiRecorder = {
  /** 开始录制；返回内部 MusicScore（第一行空小节已建好） */
  start(time?: number): MusicScore
  noteOn(midi: number, velocity?: number, time?: number): void
  noteOff(midi: number, time?: number): void
  /** 结束录制：补齐休止、裁掉多余小节、写终止线，返回 MusicScore */
  stop(time?: number): MusicScore
  getMusicScore(): MusicScore | null
  isRecording(): boolean
  getPosition(time?: number): MidiRecordPosition
  dispose(): void
}
