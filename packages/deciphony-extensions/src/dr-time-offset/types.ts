import type {MusicScore} from '@deciphony/renderer'

export type TimeOffsetAction = {
  label: string
  onClick: () => void
}

export type TimeOffsetEditorProps = {
  /** 音频地址（http / dataURL） */
  audioUrl: string
  /** 曲谱（原地 mutate slot.data） */
  musicScore: MusicScore
  /** 每秒对应像素 */
  pxPerSecond?: number
  /** 解码采样率提示 */
  sampleRate?: number
  /** MeasureNoteSlot.data 上的时间属性名 */
  timePropName?: string
  /** 自定义按钮（排在内置「重置对齐 / 播放 / 停止 / 重置」左侧） */
  actions?: TimeOffsetAction[]
}

/** 原谱播放：note/rest id → 当前第几遍（0-based） */
export type NotePassMap = Map<string, number>

export type FlattenStaffRow = {
  /** 唯一键（按单谱表索引，多列已合并） */
  key: string
  /** 单谱表在复谱表内的索引（0=第一行 …） */
  staffIndex: number
  slots: FlattenSlotItem[]
}

export type FlattenSlotItem = {
  /** 原谱 slot id（反复多遍时相同） */
  slotId: string
  /** 第几遍，0-based；对应 data[timeProp][passIndex] */
  passIndex: number
  /** 展平项唯一键：`${slotId}#${passIndex}` */
  flattenKey: string
  /** 本遍绝对秒 */
  time: number
  chronaxie: number
  /** 休止符无 region 列表 */
  isRest: boolean
  /** 五线：线间位置；简谱为空 */
  regions: number[]
  /**
   * 简谱：各音音节（0 / 1–7 / 'X'）；休止为 [0]。
   * 五线谱为空数组。
   */
  syllables: Array<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X'>
  /** 简谱八度点（与 syllables 等长；五线可空） */
  octaveDots: number[]
  /** 用于原谱高亮的 note / rest id */
  highlightIds: string[]
  /** 直接引用原 slot.data，拖拽时写回数组 */
  slotRef: {data: Record<string, unknown>}
}

