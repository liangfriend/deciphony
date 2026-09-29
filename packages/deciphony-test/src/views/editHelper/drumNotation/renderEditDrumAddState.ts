import {DrumHeadTypeEnum} from '@deciphony/renderer'
import type {Chronaxie} from '@deciphony/renderer'
import {DRUM_MAX_CHRONAXIE, type DrumVoice} from '@deciphony/extensions/dr-edit'
import {CHRONAXIE_OPTIONS} from '../renderEditAddNoteState'

export type DrumAddKind = 'note' | 'rest'

/** 小节添加模式：待插入的鼓谱符号 */
export type AddDrumState = {
  /** up = 一声部（符干向上），down = 二声部（符干向下） */
  voice: DrumVoice
  kind: DrumAddKind
  headType: DrumHeadTypeEnum
  chronaxie: Chronaxie
  /** 附点个数，0 为无 */
  dot: 0 | 1 | 2
}

export const DEFAULT_ADD_DRUM_STATE: AddDrumState = {
  voice: 'up',
  kind: 'note',
  headType: DrumHeadTypeEnum.Normal,
  chronaxie: 32,
  dot: 0,
}

export const DRUM_VOICE_OPTIONS: {value: DrumVoice; label: string}[] = [
  {value: 'up', label: '一声部（向上）'},
  {value: 'down', label: '二声部（向下）'},
]

export const DRUM_ADD_KIND_OPTIONS: {value: DrumAddKind; label: string}[] = [
  {value: 'note', label: '音符'},
  {value: 'rest', label: '休止符'},
]

export const DRUM_HEAD_OPTIONS: {value: DrumHeadTypeEnum; label: string}[] = [
  {value: DrumHeadTypeEnum.Normal, label: '普通'},
  {value: DrumHeadTypeEnum.Cross, label: '叉号'},
  {value: DrumHeadTypeEnum.CircledCross, label: '叉号加圆'},
  {value: DrumHeadTypeEnum.CircledSlash, label: '斜线加圆'},
  {value: DrumHeadTypeEnum.Triangle, label: '三角形'},
  {value: DrumHeadTypeEnum.Diamond, label: '棱形'},
]

export const DRUM_DOT_OPTIONS: {value: 0 | 1 | 2; label: string}[] = [
  {value: 0, label: '无'},
  {value: 1, label: '单附点'},
  {value: 2, label: '双附点'},
]

/** 音符 / 休止符时值：无全音符 / 二分音符 */
export const DRUM_CHRONAXIE_OPTIONS = CHRONAXIE_OPTIONS.filter((opt) => opt.value <= DRUM_MAX_CHRONAXIE)

/** 超出的时值夹回四分 */
export function normalizeAddDrumState(state: AddDrumState): AddDrumState {
  if (state.chronaxie > DRUM_MAX_CHRONAXIE) {
    return {...state, chronaxie: DRUM_MAX_CHRONAXIE}
  }
  return state
}
