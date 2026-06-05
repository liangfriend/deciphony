import {isNoteSymbol} from 'deciphony-renderer'
import type {Measure, MusicScore, NotesInfo, NoteSymbol, SingleStaff} from 'deciphony-renderer'
import {createSlur} from '../dr-extensions/dr-edit/score-builder'
import type {NoteHeadEditSlot} from './renderEditNoteHeadProperties'

/** 连音线跨越的连续音符位数（含当前音符） */
export type SlurSpan = 2 | 3 | 4

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
): NotesInfo | null {
  if (slotsToRight <= 0) return null

  let remaining = slotsToRight
  let measureIndex = startMeasureIndex
  let noteIndex = startNoteIndex + 1

  while (remaining > 0) {
    if (measureIndex > startMeasureIndex + 1) return null
    if (measureIndex >= singleStaff.measures.length) return null

    const measure = singleStaff.measures[measureIndex]!
    if (noteIndex >= measure.notes.length) {
      measureIndex += 1
      noteIndex = 0
      continue
    }

    const slot = measure.notes[noteIndex]!
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
  startInfo: NotesInfo
} | null {
  const {singleStaff, measure, note, info} = editSlot
  if (!singleStaff || !measure || !note || !info) return null

  const measureIndex = singleStaff.measures.indexOf(measure as Measure)
  if (measureIndex < 0) return null

  const noteIndex = measure.notes.indexOf(note)
  if (noteIndex < 0) return null

  const voiceIndex = note.notesInfo.indexOf(info)
  if (voiceIndex < 0) return null

  return {singleStaff, measureIndex, noteIndex, voiceIndex, startInfo: info}
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
  )
  if (!endInfo || endInfo.id === anchor.startInfo.id) return false

  const musicScore = editSlot.musicScore as MusicScore
  musicScore.affiliatedSymbols.push(
    createSlur({startId: anchor.startInfo.id, endId: endInfo.id}),
  )
  return true
}
