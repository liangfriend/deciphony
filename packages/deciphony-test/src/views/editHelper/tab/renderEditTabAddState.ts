import type {Chronaxie} from '@deciphony/renderer'

/** 小节添加模式：待插入的吉他 / 尤克里里符号 */
export type TabAddKind = 'normal' | 'harmonic' | 'arpeggio' | 'strumming' | 'rest'

export type AddTabState = {
  kind: TabAddKind
  chronaxie: Chronaxie
  /** 品；-1 为 x */
  fret: number
  /** 琶音 / 扫弦起点，0 起（界面显示 +1） */
  regionStart: number
  /** 琶音 / 扫弦终点，0 起 */
  regionEnd: number
}

export const DEFAULT_ADD_TAB_STATE: AddTabState = {
  kind: 'normal',
  chronaxie: 64,
  fret: 0,
  regionStart: 0,
  regionEnd: 5,
}

export const TAB_ADD_KIND_OPTIONS: {value: TabAddKind; label: string}[] = [
  {value: 'normal', label: '标准音'},
  {value: 'harmonic', label: '泛音'},
  {value: 'arpeggio', label: '琶音'},
  {value: 'strumming', label: '扫弦'},
  {value: 'rest', label: '休止符'},
]

export const TAB_FRET_OPTIONS: {value: number; label: string}[] = [
  {value: -1, label: 'x'},
  ...Array.from({length: 28}, (_, fret) => ({value: fret, label: String(fret)})),
]

export const TAB_SEMITONE_OPTIONS: {value: number; label: string}[] = [
  0, 0.5, 1, 1.5, 2, 2.5, 3,
].map((value) => ({value, label: String(value)}))
