import type {MusicScore, SingleStaff} from '@deciphony/renderer'
import type {DR_playSequence} from './types'

/** 单谱表未设置 data.instrumentValue 时使用的音色名 */
export const DEFAULT_TONE_COLOR = 'piano'

type InstrumentValueData = {instrumentValue?: unknown}

/** 读取单谱表音色（singleStaff.data.instrumentValue）；未设置或为空返回 undefined */
export function readStaffInstrumentValue(staff: SingleStaff | null | undefined): string | undefined {
  const value = (staff?.data as InstrumentValueData | undefined)?.instrumentValue
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

/** 写入单谱表音色；传空字符串 / undefined 时删除字段，回落到默认音色 */
export function writeStaffInstrumentValue(staff: SingleStaff, value: string | undefined): void {
  const data = (staff.data ?? {}) as InstrumentValueData
  if (value == null || !value.trim()) {
    delete data.instrumentValue
  } else {
    data.instrumentValue = value.trim()
  }
  staff.data = data
}

/** 深度收集子树内所有对象的 id */
function collectIds(node: unknown, visit: (id: string) => void): void {
  if (node == null || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) collectIds(item, visit)
    return
  }
  const obj = node as Record<string, unknown>
  if (typeof obj.id === 'string') visit(obj.id)
  for (const [key, value] of Object.entries(obj)) {
    if (key !== 'id' && key !== 'data') collectIds(value, visit)
  }
}

/** 小节子树内任意 id（音符 / 休止符 / 倚音 / tab 音 / 小节本身）→ 所属单谱表 */
function buildIdToStaffMap(musicScore: MusicScore): Map<string, SingleStaff> {
  const map = new Map<string, SingleStaff>()
  for (const grandStaff of musicScore.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        collectIds(measure, (id) => map.set(id, staff))
      }
    }
  }
  return map
}

/**
 * 按音符所在单谱表写入 toneColor：有 data.instrumentValue 用其值，否则用 defaultToneColor。
 * 原地修改并返回 seq。
 */
export function applyStaffToneColor(
  seq: DR_playSequence,
  musicScore: MusicScore,
  defaultToneColor: string = DEFAULT_TONE_COLOR,
): DR_playSequence {
  const idToStaff = buildIdToStaffMap(musicScore)
  for (const item of seq) {
    item.toneColor = readStaffInstrumentValue(idToStaff.get(item.note_id)) ?? defaultToneColor
  }
  return seq
}
