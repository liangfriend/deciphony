import type {MusicScore, SingleStaff} from '@deciphony/renderer'
import type {DR_playSequence} from './types'

/** 单谱表 / 曲谱未设置 data.instrumentValue 时使用的音色名 */
export const DEFAULT_TONE_COLOR = 'piano'

/** 已约定的技巧后缀：对应 data.instrumentValue_${suffix} */
export const TONE_VARIANT_HARMONIC = 'harmonic' as const

type InstrumentValueBag = Record<string, unknown>

function asDataBag(data: unknown): InstrumentValueBag | undefined {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return undefined
  return data as InstrumentValueBag
}

/** `instrumentValue` 或 `instrumentValue_${variant}` */
export function instrumentValueKey(variant?: string | null): string {
  const v = variant?.trim()
  return v ? `instrumentValue_${v}` : 'instrumentValue'
}

/** 从 data 对象读取音色名；variant 有值时只读扩展键，不自动回落基础键 */
export function readInstrumentValueField(
  data: unknown,
  variant?: string | null,
): string | undefined {
  const bag = asDataBag(data)
  if (!bag) return undefined
  const raw = bag[instrumentValueKey(variant)]
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

/**
 * 解析最终音色名。
 * 有 variant（如 harmonic）时：曲谱 data → 单谱表 data 的 instrumentValue_xxx，再降级两边的 instrumentValue。
 * 无 variant：单谱表 instrumentValue → 曲谱 instrumentValue。
 */
export function resolveInstrumentToneColorName(options: {
  scoreData?: unknown
  staffData?: unknown
  toneVariant?: string | null
  defaultToneColor?: string
}): string {
  const variant = options.toneVariant?.trim() || undefined
  const fallback = options.defaultToneColor?.trim() || DEFAULT_TONE_COLOR
  if (variant) {
    return (
      readInstrumentValueField(options.scoreData, variant)
      ?? readInstrumentValueField(options.staffData, variant)
      ?? readInstrumentValueField(options.staffData)
      ?? readInstrumentValueField(options.scoreData)
      ?? fallback
    )
  }
  return (
    readInstrumentValueField(options.staffData)
    ?? readInstrumentValueField(options.scoreData)
    ?? fallback
  )
}

/** 读取单谱表基础音色（singleStaff.data.instrumentValue）；未设置或为空返回 undefined */
export function readStaffInstrumentValue(staff: SingleStaff | null | undefined): string | undefined {
  return readInstrumentValueField(staff?.data)
}

/** 写入单谱表基础音色；传空字符串 / undefined 时删除字段，回落到默认音色 */
export function writeStaffInstrumentValue(staff: SingleStaff, value: string | undefined): void {
  const data = (staff.data ?? {}) as InstrumentValueBag
  if (value == null || !value.trim()) {
    delete data.instrumentValue
  } else {
    data.instrumentValue = value.trim()
  }
  staff.data = data
}

/** 写入曲谱 / 单谱表 data 上的技巧音色键 instrumentValue_${variant} */
export function writeInstrumentValueVariant(
  target: {data?: unknown},
  variant: string,
  value: string | undefined,
): void {
  const key = instrumentValueKey(variant)
  const data = asDataBag(target.data) ?? {}
  if (value == null || !value.trim()) {
    delete data[key]
  } else {
    data[key] = value.trim()
  }
  target.data = data
}

/** 多弦 tab 后缀 id（`infoId:region`）→ 原始 info id，便于反查谱表 */
export function baseNoteIdForToneLookup(noteId: string): string {
  const i = noteId.indexOf(':')
  return i < 0 ? noteId : noteId.slice(0, i)
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
export function buildIdToStaffMap(musicScore: MusicScore): Map<string, SingleStaff> {
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
 * 按音符所在单谱表 / 曲谱 data 写入 toneColor。
 * - 普通：staff.data.instrumentValue → score.data.instrumentValue → default
 * - 有 toneVariant（如 harmonic）：优先两边的 instrumentValue_${variant}，再降级 instrumentValue
 */
export function applyStaffToneColor(
  seq: DR_playSequence,
  musicScore: MusicScore,
  defaultToneColor: string = DEFAULT_TONE_COLOR,
  idToStaff: Map<string, SingleStaff> = buildIdToStaffMap(musicScore),
): DR_playSequence {
  const scoreData = musicScore.data
  for (const item of seq) {
    const staff = idToStaff.get(baseNoteIdForToneLookup(item.note_id))
    item.toneColor = resolveInstrumentToneColorName({
      scoreData,
      staffData: staff?.data,
      toneVariant: item.toneVariant,
      defaultToneColor,
    })
  }
  return seq
}
