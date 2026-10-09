import {slotSymbol} from '@deciphony/renderer'
import type {MusicScore, NoteNumber, NotesNumberInfo, SingleStaff} from '@deciphony/renderer'
import {createSlur} from '@deciphony/extensions/dr-edit/score-builder'
import {locateNotesNumberInfoById} from '@deciphony/extensions/dr-edit/score-builder/locate'
import {isNoteNumberSlot, isSlotRestLike} from '@deciphony/extensions/dr-edit/score-builder/noteSlot'
import type {NumberHeadEditSlot} from './renderEditNumberHeadProperties'
import {getMeasureNoteList} from '@deciphony/renderer'

export type SlurSpan = 2 | 3 | 4

export const SLUR_SPAN_OPTIONS: SlurSpan[] = [2, 3, 4]

function pickNotesNumberInfoForSlurEnd(note: NoteNumber, voiceIndex: number): NotesNumberInfo | null {
  if (note.notesInfo.length === 0) return null
  if (voiceIndex >= 0 && voiceIndex < note.notesInfo.length) {
    return note.notesInfo[voiceIndex]!
  }
  return note.notesInfo[0]!
}

export function findNotesNumberInfoAtRightOffset(
  singleStaff: SingleStaff,
  startMeasureIndex: number,
  startNoteIndex: number,
  slotsToRight: number,
  voiceIndex: number,
): NotesNumberInfo | null {
  if (slotsToRight <= 0) return null

  let remaining = slotsToRight
  let measureIndex = startMeasureIndex
  let noteIndex = startNoteIndex + 1

  while (remaining > 0) {
    if (measureIndex > startMeasureIndex + 1) return null
    if (measureIndex >= singleStaff.measures.length) return null

    const measure = singleStaff.measures[measureIndex]!
    if (noteIndex >= getMeasureNoteList(measure).length) {
      measureIndex += 1
      noteIndex = 0
      continue
    }

    const slot = getMeasureNoteList(measure)[noteIndex]!
    noteIndex += 1
    if (!isNoteNumberSlot(slot) || isSlotRestLike(slot)) continue
    const note = slotSymbol(slot) as NoteNumber

    remaining -= 1
    if (remaining === 0) {
      return pickNotesNumberInfoForSlurEnd(note, voiceIndex)
    }
  }

  return null
}

function resolveNumberHeadAnchor(
  editSlot: NumberHeadEditSlot,
): {
  singleStaff: SingleStaff
  measureIndex: number
  noteIndex: number
  voiceIndex: number
  startInfo: NotesNumberInfo
} | null {
  const info = editSlot.info
  if (!info?.id) return null

  // 用 id 定位，避免 Vue proxy / 引用不相等导致 indexOf 失败
  const located = locateNotesNumberInfoById(editSlot.musicScore, info.id)
  if (!located) return null

  // 倚音不做跨度连音线起点（只连主音符）
  const voiceIndex = located.note.notesInfo.findIndex((ni) => ni.id === info.id)
  if (voiceIndex < 0) return null

  return {
    singleStaff: located.singleStaff,
    measureIndex: located.measureIndex,
    noteIndex: located.noteIndex,
    voiceIndex,
    startInfo: located.notesNumberInfo,
  }
}

export function tryAddSlurFromNumberHead(editSlot: NumberHeadEditSlot, span: SlurSpan): boolean {
  const anchor = resolveNumberHeadAnchor(editSlot)
  if (!anchor) return false

  const endInfo = findNotesNumberInfoAtRightOffset(
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
