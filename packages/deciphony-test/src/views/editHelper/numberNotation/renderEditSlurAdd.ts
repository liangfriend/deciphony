import type {Measure, MusicScore, NoteNumber, NotesNumberInfo, SingleStaff} from 'deciphony-renderer'
import {createSlur} from '../../dr-extensions/dr-edit/score-builder'
import {isNoteNumberSlot, isSlotRestLike} from '../../dr-extensions/dr-edit/score-builder/noteSlot'
import type {NumberHeadEditSlot} from './renderEditNumberHeadProperties'

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
    if (noteIndex >= measure.notes.length) {
      measureIndex += 1
      noteIndex = 0
      continue
    }

    const slot = measure.notes[noteIndex]!
    noteIndex += 1
    if (!isNoteNumberSlot(slot) || isSlotRestLike(slot)) continue

    remaining -= 1
    if (remaining === 0) {
      return pickNotesNumberInfoForSlurEnd(slot, voiceIndex)
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
