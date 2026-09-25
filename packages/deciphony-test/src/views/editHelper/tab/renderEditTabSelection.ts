import {MusicScoreTypeEnum} from '@deciphony/renderer'
import type {MusicScore, SlotData} from '@deciphony/renderer'

export function isTabScore(score: MusicScore | null | undefined): boolean {
  return score?.type === MusicScoreTypeEnum.Tab4 || score?.type === MusicScoreTypeEnum.Tab6
}

const TAB_INFO_TYPES = new Set(['normal', 'harmonic', 'arpeggio', 'strumming'])

/** 选中的是某条 TabNoteInfo（标准音 / 泛音 / 琶音 / 扫弦） */
export function isTabInfoSelected(selected: SlotData | null): boolean {
  const info = selected?.info as {type?: string} | null | undefined
  if (!info || selected?.self !== selected?.info || !selected?.note || !selected.measure) return false
  return typeof info.type === 'string' && TAB_INFO_TYPES.has(info.type)
}

/** 选中的是推弦符号 */
export function isBendSelected(selected: SlotData | null): boolean {
  const self = selected?.self as {periodOne?: unknown; periodTwo?: unknown} | null | undefined
  if (!self || selected?.self === selected?.info) return false
  return typeof self.periodOne === 'number' && typeof self.periodTwo === 'number'
}
