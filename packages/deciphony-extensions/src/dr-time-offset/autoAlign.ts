import {
  NoteSymbolTypeEnum,
  type MeasureNoteSlot,
  type MusicScore,
  type NoteRest,
  type NoteSymbol,
} from '@deciphony/renderer'
import {isNoteNumberSlot, isSlotRestLike} from '../dr-edit/score-builder/noteSlot'
import {getDrPlaySequence} from '../dr-play'
import {MAX_SYNC_SECONDS} from './constants'
import {unit256ToSeconds} from './unitToSeconds'

function ensureData(slot: MeasureNoteSlot): Record<string, unknown> {
  if (!slot.data || typeof slot.data !== 'object') {
    ;(slot as {data: Record<string, unknown>}).data = {}
  }
  return slot.data as Record<string, unknown>
}

function isNumberRestInfo(syllable: unknown): boolean {
  return syllable === 0 || syllable === 'X'
}

/**
 * 按 dr-play 序列（已含反复展开）写入各音符/休止符
 * `slot.data[timePropName]: number[]`，下标 = 第几遍。
 * 同一 note_id 多次出现依次 push；结果 = 理论时间 + introOffsetSec。
 * 支持五线（Note/Rest）与简谱（NoteNumber）。
 */
export function autoAlignTimeOffsets(
  musicScore: MusicScore,
  timePropName: string,
  beatUnit = 4,
  introOffsetSec = 0,
): void {
  const bpm = musicScore.bpm ?? 120
  if (!(bpm > 0)) {
    console.warn('[autoAlignTimeOffsets] musicScore.bpm 无效，跳过对齐', bpm)
    return
  }
  const bu = beatUnit > 0 ? beatUnit : 4
  const offset = Number.isFinite(introOffsetSec) ? Math.max(0, introOffsetSec) : 0
  const seq = getDrPlaySequence(musicScore)
  const timesByNoteId = new Map<string, number[]>()
  for (const it of seq) {
    const sec = Math.min(
      MAX_SYNC_SECONDS,
      Math.max(0, unit256ToSeconds(it.playTime, bpm, bu) + offset),
    )
    const list = timesByNoteId.get(it.note_id)
    if (list) list.push(sec)
    else timesByNoteId.set(it.note_id, [sec])
  }

  for (const gs of musicScore.grandStaffs ?? []) {
    for (const staff of gs.staves ?? []) {
      for (const measure of staff.measures ?? []) {
        for (const slot of measure.notes ?? []) {
          // 简谱 NoteNumber：无 type，时值/音高在 notesInfo
          if (isNoteNumberSlot(slot)) {
            if (isSlotRestLike(slot)) {
              const lead = slot.notesInfo[0]
              const id = lead?.id ?? slot.id
              const times = timesByNoteId.get(id) ?? timesByNoteId.get(slot.id)
              if (times?.length) ensureData(slot)[timePropName] = [...times]
            } else {
              let times: number[] | undefined
              for (const ni of slot.notesInfo) {
                if (isNumberRestInfo(ni.syllable)) continue
                const v = timesByNoteId.get(ni.id)
                if (v?.length) {
                  times = v
                  break
                }
              }
              if (times?.length) ensureData(slot)[timePropName] = [...times]
            }
            continue
          }

          const s = slot as MeasureNoteSlot & (NoteSymbol | NoteRest)
          if (s.type === NoteSymbolTypeEnum.Rest) {
            const times = timesByNoteId.get(s.id)
            if (times?.length) ensureData(slot)[timePropName] = [...times]
          } else if (s.type === NoteSymbolTypeEnum.Note) {
            const ids = s.notesInfo?.map((n) => n.id) ?? []
            // 和弦共用一遍次：取首音（各音 playTime 序列应一致）
            let times: number[] | undefined
            for (const id of ids) {
              const v = timesByNoteId.get(id)
              if (v?.length) {
                times = v
                break
              }
            }
            if (times?.length) ensureData(slot)[timePropName] = [...times]
          }
        }
      }
    }
  }
}
