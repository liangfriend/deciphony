import {isNoteSymbol, slotSymbol} from '@deciphony/renderer'
import type {MusicScore, NotesInfo, NoteSymbol, SingleStaff} from '@deciphony/renderer'
import {createSlur} from '@deciphony/extensions/dr-edit/score-builder'
import {locateNotesInfoById} from '@deciphony/extensions/dr-edit/score-builder/locate'
import type {NoteHeadEditSlot} from './renderEditNoteHeadProperties'
import {getMeasureVoices} from '@deciphony/renderer'
import type {MeasureNoteSlot} from '@deciphony/renderer'

/** 连音线跨越的连续音符位数（含当前音符） */
export type SlurSpan = 2 | 3 | 4

type VoiceKey = 'up' | 'down'

/** 普通小节只有 up；鼓谱按声部取，连音线只在同一声部内找终点 */
function voiceSlots(measure: Measure, voice: VoiceKey): MeasureNoteSlot[] {
  return getMeasureVoices(measure)[voice]
}

export const SLUR_SPAN_OPTIONS: SlurSpan[] = [2, 3, 4]

function pickNotesInfoForSlurEnd(note: NoteSymbol, voiceIndex: number): NotesInfo | null {
  if (note.notesInfo.length === 0) return null
  if (voiceIndex >= 0 && voiceIndex < note.notesInfo.length) {
    return note.notesInfo[voiceIndex]!
  }
  return note.notesInfo[0]!
}

/**
 * 从当前音符位起向右数 `slotsToRight` 个 NoteSymbol（跳过休止符）。
 * 仅搜索当前小节与下一个小节；不足则返回 null。
 */
export function findNotesInfoAtRightOffset(
  singleStaff: SingleStaff,
  startMeasureIndex: number,
  startNoteIndex: number,
  slotsToRight: number,
  voiceIndex: number,
  voice: VoiceKey = 'up',
): NotesInfo | null {
  if (slotsToRight <= 0) return null

  let remaining = slotsToRight
  let measureIndex = startMeasureIndex
  let noteIndex = startNoteIndex + 1

  while (remaining > 0) {
    if (measureIndex > startMeasureIndex + 1) return null
    if (measureIndex >= singleStaff.measures.length) return null

    const slots = voiceSlots(singleStaff.measures[measureIndex]!, voice)
    if (noteIndex >= slots.length) {
      measureIndex += 1
      noteIndex = 0
      continue
    }

    const slot = slotSymbol(slots[noteIndex]!)
    noteIndex += 1
    if (!isNoteSymbol(slot)) continue

    remaining -= 1
    if (remaining === 0) {
      return pickNotesInfoForSlurEnd(slot, voiceIndex)
    }
  }

  return null
}

function resolveNoteHeadAnchor(
  editSlot: NoteHeadEditSlot,
): {
  singleStaff: SingleStaff
  measureIndex: number
  noteIndex: number
  voiceIndex: number
  voice: VoiceKey
  startInfo: NotesInfo
} | null {
  const info = editSlot.info
  if (!info?.id) return null

  const located = locateNotesInfoById(editSlot.musicScore, info.id)
  if (!located) return null

  const voiceIndex = located.note.notesInfo.findIndex((ni) => ni.id === info.id)
  if (voiceIndex < 0) return null

  const measure = located.measure
  let voice: VoiceKey = 'up'
  let noteIndex = voiceSlots(measure, 'up').findIndex((s) => slotSymbol(s) === located.note)
  if (noteIndex < 0) {
    voice = 'down'
    noteIndex = voiceSlots(measure, 'down').findIndex((s) => slotSymbol(s) === located.note)
  }
  if (noteIndex < 0) return null

  return {
    singleStaff: located.singleStaff,
    measureIndex: located.measureIndex,
    noteIndex,
    voiceIndex,
    voice,
    startInfo: located.notesInfo,
  }
}

/** 在选中音符头与右侧第 (span-1) 个音符头之间添加连音线；不足两小节内音符则失败 */
export function tryAddSlurFromNoteHead(editSlot: NoteHeadEditSlot, span: SlurSpan): boolean {
  const anchor = resolveNoteHeadAnchor(editSlot)
  if (!anchor) return false

  const endInfo = findNotesInfoAtRightOffset(
    anchor.singleStaff,
    anchor.measureIndex,
    anchor.noteIndex,
    span - 1,
    anchor.voiceIndex,
    anchor.voice,
  )
  if (!endInfo || endInfo.id === anchor.startInfo.id) return false

  const musicScore = editSlot.musicScore as MusicScore
  musicScore.affiliatedSymbols.push(
    createSlur({startId: anchor.startInfo.id, endId: endInfo.id}),
  )
  return true
}
