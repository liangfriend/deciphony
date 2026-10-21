import type {MusicScore, SingleStaff} from '@deciphony/renderer'
import {baseNoteIdForToneLookup, buildIdToStaffMap} from './toneColor'
import type {DR_playSequence} from './types'

/** 单谱表 data.volume 的基准值：100 = 原音量 */
export const DEFAULT_STAFF_VOLUME = 100

/**
 * 读单谱表 data.volume（基准 100）；没有或不是有限非负数时返回 undefined。
 */
export function readStaffVolume(staff: SingleStaff | null | undefined): number | undefined {
  const raw = (staff?.data as Record<string, unknown> | undefined)?.volume
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : undefined
}

/** 写单谱表 data.volume；传 undefined 删除字段（回到 100） */
export function writeStaffVolume(staff: SingleStaff, value: number | undefined): void {
  const data = (staff.data ?? {}) as Record<string, unknown>
  if (value == null || !Number.isFinite(value) || value < 0) {
    delete data.volume
  } else {
    data.volume = value
  }
  staff.data = data
}

/**
 * 按音符所在单谱表的 data.volume 缩放音量：item.volume ×= volume / 100。
 * 没设 volume（或等于 100）的谱表不动，item.volume 保持原样（未设置仍视为 1）。
 */
export function applyStaffVolume(
  seq: DR_playSequence,
  musicScore: MusicScore,
  idToStaff: Map<string, SingleStaff> = buildIdToStaffMap(musicScore),
): DR_playSequence {
  for (const item of seq) {
    const volume = readStaffVolume(idToStaff.get(baseNoteIdForToneLookup(item.note_id)))
    if (volume == null || volume === DEFAULT_STAFF_VOLUME) continue
    item.volume = (item.volume ?? 1) * (volume / DEFAULT_STAFF_VOLUME)
  }
  return seq
}
