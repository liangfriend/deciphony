import {
  isNoteNumberSymbol,
  isNoteRest,
  isNoteSymbol,
  getMeasureSlots,
  slotSymbol,
  type MeasureNoteSlot,
  type MusicScore,
  type NoteNumber,
  type NoteRest,
  type NoteSymbol,
  type NotesNumberInfo,
} from '@deciphony/renderer'
import {isNoteNumberSlot as isMeasureNoteNumberSlot} from '../dr-edit/score-builder/noteSlot'
import {getMeasurePositions, getPlayMeasureIndexes} from '../scoreUtil'
import {
  FLATTEN_LINE_GAP,
  FLATTEN_LYRIC_H,
  FLATTEN_STAFF_PAD_Y,
  FLATTEN_STEM_LENGTH,
  MAX_SYNC_SECONDS,
} from './constants'
import type {FlattenSlotItem, FlattenStaffRow, NotePassMap} from './types'

/** 简谱展平行内高：数字 + 减时线 + 八度点留白 */
export const FLATTEN_NUMBER_INNER_H = 56

/** 展平谱一行的高度（不含歌词带） */
export function flattenStaffRowHeight(isNumber: boolean): number {
  if (isNumber) return FLATTEN_NUMBER_INNER_H + FLATTEN_STAFF_PAD_Y * 2
  return 4 * FLATTEN_LINE_GAP + FLATTEN_STAFF_PAD_Y * 2 + FLATTEN_STEM_LENGTH * 0.35
}

/** 展平谱各行顶部 y 与总高（有歌词的行多一条歌词带） */
export function flattenRowLayout(
  rows: readonly FlattenStaffRow[],
  isNumber: boolean,
): {tops: number[]; heights: number[]; total: number} {
  const base = flattenStaffRowHeight(isNumber)
  const tops: number[] = []
  const heights: number[] = []
  let y = 0
  for (const row of rows) {
    const h = base + (row.hasLyrics ? FLATTEN_LYRIC_H : 0)
    tops.push(y)
    heights.push(h)
    y += h
  }
  return {tops, heights, total: Math.max(base, y)}
}

/** 第 passIndex 遍的歌词：取 `lyrics[passIndex]`；只有一段词时每遍都用它 */
function slotLyricText(slot: MeasureNoteSlot, passIndex: number): string {
  const list = Array.isArray(slot.lyrics) ? slot.lyrics : []
  const item = list.length === 1 ? list[0] : list[passIndex]
  return (item?.text ?? '').trim()
}

function ensureData(slot: MeasureNoteSlot): Record<string, unknown> {
  if (!slot.data || typeof slot.data !== 'object') {
    slot.data = {}
  }
  return slot.data as Record<string, unknown>
}

/** 将 data[prop] 规范为秒数组（兼容旧版单个 number） */
export function readTimeArray(
  data: Record<string, unknown> | undefined,
  timePropName: string,
): number[] {
  const raw = data?.[timePropName]
  if (Array.isArray(raw)) {
    return raw.map((v) => {
      const n = typeof v === 'number' ? v : Number(v)
      if (!Number.isFinite(n) || n < 0) return 0
      return Math.min(MAX_SYNC_SECONDS, n)
    })
  }
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return [Math.min(MAX_SYNC_SECONDS, raw)]
  }
  return []
}

/** 读取某一遍的绝对秒；该遍尚未写入则 null（与显式 0 区分） */
export function readPassTime(
  data: Record<string, unknown> | undefined,
  timePropName: string,
  passIndex: number,
): number | null {
  const arr = readTimeArray(data, timePropName)
  if (passIndex < 0 || passIndex >= arr.length) return null
  const n = arr[passIndex]
  if (n == null || !Number.isFinite(n) || n < 0) return null
  return n
}

/**
 * 写入某一遍时间。若属性不存在或长度不足，前面补 0。
 * 例：改第 2 遍为 0.7 → `[0, 0.7]`
 */
export function writePassTime(
  slotRef: {data: Record<string, unknown>},
  timePropName: string,
  passIndex: number,
  seconds: number,
): number {
  const t = Math.min(MAX_SYNC_SECONDS, Math.max(0, seconds))
  const prev = slotRef.data[timePropName]
  let arr: number[]
  if (Array.isArray(prev)) {
    arr = prev.map((v) => {
      const n = typeof v === 'number' ? v : Number(v)
      return Number.isFinite(n) && n >= 0 ? Math.min(MAX_SYNC_SECONDS, n) : 0
    })
  } else if (typeof prev === 'number' && Number.isFinite(prev) && prev >= 0) {
    arr = [Math.min(MAX_SYNC_SECONDS, prev)]
  } else {
    arr = []
  }
  while (arr.length <= passIndex) arr.push(0)
  arr[passIndex] = t
  slotRef.data[timePropName] = arr
  return t
}

/** @deprecated 使用 writePassTime；无 pass 时等价写第 0 遍 */
export function writeSlotTime(
  slotRef: {data: Record<string, unknown>},
  timePropName: string,
  seconds: number,
): number {
  return writePassTime(slotRef, timePropName, 0, seconds)
}

function isNumberRestInfo(ni: NotesNumberInfo): boolean {
  return ni.syllable === 0 || ni.syllable === 'X'
}

function slotVisual(
  slot: MeasureNoteSlot,
): Pick<
  FlattenSlotItem,
  'chronaxie' | 'isRest' | 'regions' | 'syllables' | 'octaveDots' | 'highlightIds'
> | null {
  if (isMeasureNoteNumberSlot(slot)) {
    const note = slotSymbol(slot) as NoteNumber
    const infos = note.notesInfo ?? []
    if (!infos.length) return null
    const pitched = infos.filter((ni) => !isNumberRestInfo(ni))
    const isRest = pitched.length === 0
    if (isRest) {
      const lead = infos[0]!
      return {
        chronaxie: lead.chronaxie,
        isRest: true,
        regions: [],
        syllables: [0],
        octaveDots: [0],
        // 与 dr-play 简谱休止 note_id 一致：lead.id ?? slot.id
        highlightIds: [lead.id ?? slot.id],
      }
    }
    return {
      chronaxie: pitched[0]!.chronaxie,
      isRest: false,
      regions: [],
      syllables: pitched.map((ni) => ni.syllable),
      octaveDots: pitched.map((ni) => ni.octaveDot ?? 0),
      highlightIds: pitched.map((ni) => ni.id),
    }
  }

  const s = slotSymbol(slot)
  if (isNoteRest(s)) {
    const rest = s as NoteRest
    return {
      chronaxie: rest.chronaxie,
      isRest: true,
      regions: [],
      syllables: [],
      octaveDots: [],
      highlightIds: [rest.id],
    }
  }
  if (isNoteSymbol(s)) {
    const infos = (s as NoteSymbol).notesInfo ?? []
    if (!infos.length) return null
    return {
      chronaxie: infos[0]!.chronaxie,
      isRest: false,
      regions: infos.map((n) => n.region),
      syllables: [],
      octaveDots: [],
      highlightIds: infos.map((n) => n.id),
    }
  }
  return null
}

/**
 * 各复谱表的单谱表数量必须一致，否则无法按「谱表行」展平（多列合并）。
 */
export function validateFlattenStaffLayout(musicScore: MusicScore): string | null {
  const grandStaffs = musicScore.grandStaffs ?? []
  if (!grandStaffs.length) return '曲谱错误：没有复谱表，无法展平'
  const counts = grandStaffs.map((gs) => gs.staves?.length ?? 0)
  if (counts.some((c) => c <= 0)) {
    return `曲谱错误：存在空复谱表（单谱表数：${counts.join(', ')}），无法展平`
  }
  const first = counts[0]!
  if (counts.some((c) => c !== first)) {
    return `曲谱错误：复谱表内单谱表数量不一致（${counts.join(', ')}），无法展平`
  }
  return null
}

/**
 * 展平行：先按 `getPlayMeasureIndexes` 展开反复，再按单谱表索引合并多列。
 * 同一音符多遍 → 多个 FlattenSlotItem，用 `passIndex` 对应 `data[timeProp][passIndex]`。
 */
export function buildFlattenStaffRows(
  musicScore: MusicScore,
  timePropName: string,
): FlattenStaffRow[] {
  if (validateFlattenStaffLayout(musicScore)) return []

  const grandStaffs = musicScore.grandStaffs ?? []
  const staffCount = grandStaffs[0]?.staves?.length ?? 0
  const measurePositions = getMeasurePositions(musicScore)
  const playMeasureIndexes = getPlayMeasureIndexes(musicScore)
  const rows: FlattenStaffRow[] = []

  for (let si = 0; si < staffCount; si++) {
    const slots: FlattenSlotItem[] = []
    /** 同一原 slot 出现次数 → 下一遍 passIndex */
    const passCountBySlotId = new Map<string, number>()

    for (const flatMeasureIndex of playMeasureIndexes) {
      const pos = measurePositions[flatMeasureIndex]
      if (!pos) continue
      const {grandStaffIndex, measureIndex} = pos
      const measure = grandStaffs[grandStaffIndex]?.staves?.[si]?.measures?.[measureIndex]
      if (!measure) continue

      for (const slot of getMeasureSlots(measure)) {
        const visual = slotVisual(slot)
        if (!visual) continue
        const slotId = (slot as MeasureNoteSlot & {id: string}).id
        const passIndex = passCountBySlotId.get(slotId) ?? 0
        passCountBySlotId.set(slotId, passIndex + 1)
        const data = ensureData(slot)
        slots.push({
          slotId,
          passIndex,
          flattenKey: `${slotId}#${passIndex}`,
          time: readPassTime(data, timePropName, passIndex),
          chronaxie: visual.chronaxie,
          isRest: visual.isRest,
          regions: visual.regions,
          syllables: visual.syllables,
          octaveDots: visual.octaveDots,
          highlightIds: visual.highlightIds,
          lyric: slotLyricText(slot, passIndex),
          slotRef: {data},
        })
      }
    }

    rows.push({
      key: `s${si}`,
      staffIndex: si,
      slots,
      hasLyrics: slots.some((s) => s.lyric !== ''),
    })
  }

  return rows
}

export function createNotePassMap(): NotePassMap {
  return new Map()
}

/** 停止时：不清空 key，已有值全部置 0（回到第一遍） */
export function resetNotePassMap(map: NotePassMap): void {
  for (const key of map.keys()) {
    map.set(key, 0)
  }
}

/**
 * 根据当前播放秒收集应高亮的 note/rest id（展平后的时间轴）。
 * 未写入时间（time == null）的项不参与匹配，避免「全谱一起亮」。
 * 若传入 passMap，则把当前激活项的 passIndex 写入对应 highlightId（原谱播放用）。
 */
export function collectHighlightIdsAtTime(
  rows: FlattenStaffRow[],
  currentSec: number,
  passMap?: NotePassMap,
): string[] {
  const items: {time: number; ids: string[]; passIndex: number}[] = []
  for (const row of rows) {
    for (const slot of row.slots) {
      if (slot.time == null || !Number.isFinite(slot.time)) continue
      items.push({time: slot.time, ids: slot.highlightIds, passIndex: slot.passIndex})
    }
  }
  if (!items.length) return []
  items.sort((a, b) => a.time - b.time || a.passIndex - b.passIndex)
  const times = [...new Set(items.map((i) => i.time))]
  if (currentSec < times[0]!) return []
  let active = times[0]!
  for (const t of times) {
    if (t <= currentSec) active = t
    else break
  }
  const ids: string[] = []
  for (const it of items) {
    if (it.time !== active) continue
    ids.push(...it.ids)
    if (passMap) {
      for (const id of it.ids) {
        passMap.set(id, it.passIndex)
      }
    }
  }
  return ids
}

/** 展平行里是否至少有一个已写入的时间点（用于开播前校验谱音同步） */
export function hasTimedFlattenSlots(rows: FlattenStaffRow[]): boolean {
  for (const row of rows) {
    for (const slot of row.slots) {
      if (slot.time != null && Number.isFinite(slot.time)) return true
    }
  }
  return false
}

