import type {Chronaxie} from 'deciphony-renderer'

/** 小节添加模式：待插入的符号类型 */
export type AddNoteSlotKind = 'note' | 'rest'

export type AddNoteState = {
  kind: AddNoteSlotKind
  chronaxie: Chronaxie
}

export const DEFAULT_ADD_NOTE_STATE: AddNoteState = {
  kind: 'note',
  chronaxie: 64,
}

export const ADD_NOTE_KIND_OPTIONS: { value: AddNoteSlotKind; label: string }[] = [
  {value: 'note', label: '音符'},
  {value: 'rest', label: '休止符'},
]

/** 时值选项（chronaxie 越大音符越长） */
export const CHRONAXIE_OPTIONS: { value: Chronaxie; label: string }[] = [
  {value: 256, label: '全音符'},
  {value: 128, label: '二分音符'},
  {value: 64, label: '四分音符'},
  {value: 32, label: '八分音符'},
  {value: 16, label: '十六分音符'},
  {value: 8, label: '三十二分音符'},
  {value: 4, label: '六十四分音符'},
  {value: 2, label: '一百二十八分音符'},
]
