import {
  DoubleMeasureAffiliatedSymbolNameEnum,
  getMeasureSlots,
  slotSymbol,
  type MeasureNoteSlot,
  type MusicScore,
} from '@deciphony/renderer'
import {getMeasurePositions} from '../scoreUtil'
import type {DR_playLyric, DR_playSequence} from './types'

type LyricSlot = {
  slot: MeasureNoteSlot
  /** 小节在 getMeasurePositions 中的下标 */
  positionIndex: number
}

/** 带歌词的槽位：按槽位 id、按主音 note id（倚音不挂歌词）各索引一份 */
function collectLyricSlots(musicScore: MusicScore) {
  const bySlotId = new Map<string, LyricSlot>()
  const byNoteId = new Map<string, LyricSlot>()
  getMeasurePositions(musicScore).forEach(({grandStaffIndex, measureIndex}, positionIndex) => {
    for (const staff of musicScore.grandStaffs[grandStaffIndex]?.staves ?? []) {
      const measure = staff.measures[measureIndex]
      if (!measure) continue
      for (const slot of getMeasureSlots(measure)) {
        if (!Array.isArray(slot.lyrics) || !slot.lyrics.length) continue
        const found = {slot, positionIndex}
        bySlotId.set(slot.id, found)
        const body = slotSymbol(slot)
        if (!('notesInfo' in body) || !Array.isArray(body.notesInfo)) continue
        for (const ni of body.notesInfo) byNoteId.set(ni.id, found)
      }
    }
  })
  return {bySlotId, byNoteId}
}

/** 小节下标 → 所在房子标注的遍次（升序，从 0 起） */
function collectVoltaPasses(musicScore: MusicScore): Map<number, number[]> {
  const positionById = new Map(getMeasurePositions(musicScore).map((p, i) => [p.measure.id, i]))
  const out = new Map<number, number[]>()
  for (const symbol of musicScore.affiliatedSymbols ?? []) {
    if (symbol.name !== DoubleMeasureAffiliatedSymbolNameEnum.Volta) continue
    const value = 'volta' in symbol.data ? symbol.data.volta?.value : undefined
    const a = positionById.get(symbol.startId)
    const b = positionById.get(symbol.endId)
    if (!value?.length || a == null || b == null) continue
    const passes = [...value].sort((x, y) => x - y)
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.set(i, passes)
  }
  return out
}

function lyricAt(
  {slot, positionIndex}: LyricSlot,
  occurrence: number,
  voltaPasses: Map<number, number[]>,
): DR_playLyric | undefined {
  const pass = voltaPasses.get(positionIndex)?.[occurrence] ?? occurrence
  const list = slot.lyrics!
  const verse = list.length === 1 ? 0 : pass
  const text = list[verse]?.text?.trim()
  return text ? {text, verse, slotId: slot.id} : undefined
}

/**
 * 取词规则：槽位按展开反复的顺序第 occurrence 次出现 = 反复第 occurrence 遍；
 * 在房子里的音按房子标注的遍次（第二房子只播一次也算第 2 遍）。
 * 取 `slot.lyrics[遍次]`；只有一段词时每遍都用它；空词返回 undefined。
 */
export function createPlayLyricResolver(
  musicScore: MusicScore,
): (slotId: string, occurrence: number) => DR_playLyric | undefined {
  const {bySlotId} = collectLyricSlots(musicScore)
  const voltaPasses = collectVoltaPasses(musicScore)
  return (slotId, occurrence) => {
    const found = bySlotId.get(slotId)
    return found ? lyricAt(found, occurrence, voltaPasses) : undefined
  }
}

/**
 * 给序列写 `lyric`：按 note_id（tab 取 `:` 前）找槽位，同一 note_id 第 n 次出现 = 第 n 次经过该槽位，
 * 取词规则见 createPlayLyricResolver。须在选段裁剪前调用（裁剪后遍数对不上）。
 */
export function applyPlayLyrics(seq: DR_playSequence, musicScore: MusicScore): DR_playSequence {
  const {byNoteId} = collectLyricSlots(musicScore)
  if (!byNoteId.size) return seq
  const voltaPasses = collectVoltaPasses(musicScore)
  const passCount = new Map<string, number>()
  for (const it of seq) {
    const occurrence = passCount.get(it.note_id) ?? 0
    passCount.set(it.note_id, occurrence + 1)
    if (it.midi <= 0) continue
    const colon = it.note_id.indexOf(':')
    const found = byNoteId.get(it.note_id) ?? (colon > 0 ? byNoteId.get(it.note_id.slice(0, colon)) : undefined)
    if (!found) continue
    const lyric = lyricAt(found, occurrence, voltaPasses)
    if (lyric) it.lyric = lyric
  }
  return seq
}
