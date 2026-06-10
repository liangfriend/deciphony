import type {Measure, MusicScore, NoteNumber, NotesNumberInfo} from 'deciphony-renderer'
import {KeySignatureTypeEnum} from 'deciphony-renderer'
import {isNoteNumberSlot, isSlotRestLike} from '../../dr-edit/score-builder/noteSlot'
import {getMeasurePositions, getNoteNumberMidi, getPlayMeasureIndexes} from '../../scoreUtil'
import {applySlurTieRealDuration, GRACE_PLAY_DURATION, pushPitchItem} from '../playCommon'
import type {DR_playSequence, Unit256} from '../types'
import {getDuration} from '../types'

type NumberPlayState = {
  curKeySignature: KeySignatureTypeEnum
}

function applyMeasureKeySignatureFront(state: NumberPlayState, measure: Measure): void {
  if (measure.keySignature_f) state.curKeySignature = measure.keySignature_f.type
}

function applyMeasureKeySignatureBack(state: NumberPlayState, measure: Measure): void {
  if (measure.keySignature_b) state.curKeySignature = measure.keySignature_b.type
}

function resolveNoteNumberDotCount(note: NoteNumber): number {
  if (note.augmentationDot) return note.augmentationDot.count
  return note.notesInfo[0]?.augmentationDot?.count ?? 0
}

function hasPitch(ni: NotesNumberInfo): boolean {
  return ni.syllable !== 0 && ni.syllable !== 'X'
}

function pushGraceNumberNote(
  seq: DR_playSequence,
  g: NotesNumberInfo,
  at: Unit256,
  staveIndex: number,
  keySignature: KeySignatureTypeEnum,
  noteStaveIndex: Map<string, number>,
): void {
  if (!hasPitch(g)) return
  const midi = getNoteNumberMidi(g, keySignature)
  pushPitchItem(seq, noteStaveIndex, staveIndex, {
    note_id: g.id,
    midi,
    duration: GRACE_PLAY_DURATION,
    playTime: at,
  })
}

function appendGraceNotesBefore(
  seq: DR_playSequence,
  graceNotes: NotesNumberInfo[] | undefined,
  mainPlayTime: Unit256,
  staveIndex: number,
  keySignature: KeySignatureTypeEnum,
  noteStaveIndex: Map<string, number>,
): void {
  const list = graceNotes ?? []
  if (!list.length) return
  let t = mainPlayTime - list.length * GRACE_PLAY_DURATION
  for (const g of list) {
    pushGraceNumberNote(seq, g, t, staveIndex, keySignature, noteStaveIndex)
    t += GRACE_PLAY_DURATION
  }
}

function appendGraceNotesAfter(
  seq: DR_playSequence,
  graceNotes: NotesNumberInfo[] | undefined,
  mainPlayTime: Unit256,
  mainDuration: Unit256,
  staveIndex: number,
  keySignature: KeySignatureTypeEnum,
  noteStaveIndex: Map<string, number>,
): void {
  const list = graceNotes ?? []
  if (!list.length) return
  const steal = Math.min(mainDuration, list.length * GRACE_PLAY_DURATION)
  let t = mainPlayTime + mainDuration - steal
  for (const g of list) {
    pushGraceNumberNote(seq, g, t, staveIndex, keySignature, noteStaveIndex)
    t += GRACE_PLAY_DURATION
  }
}

function appendNoteNumberSequence(
  seq: DR_playSequence,
  note: NoteNumber,
  playTime: Unit256,
  staveIndex: number,
  keySignature: KeySignatureTypeEnum,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  const duration = getDuration(note.chronaxie, resolveNoteNumberDotCount(note))
  const lead = note.notesInfo[0]

  appendGraceNotesBefore(seq, lead?.graceNotes, playTime, staveIndex, keySignature, noteStaveIndex)

  for (const ni of note.notesInfo) {
    if (!hasPitch(ni)) continue
    const midi = getNoteNumberMidi(ni, keySignature)
    pushPitchItem(seq, noteStaveIndex, staveIndex, {note_id: ni.id, midi, duration, playTime})
  }

  appendGraceNotesAfter(seq, lead?.graceNotesAfter, playTime, duration, staveIndex, keySignature, noteStaveIndex)
  return playTime + duration
}

function appendMeasureSequence(
  seq: DR_playSequence,
  measure: Measure,
  measureStart: Unit256,
  staveIndex: number,
  state: NumberPlayState,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  applyMeasureKeySignatureFront(state, measure)
  let playTime = measureStart

  for (const slot of measure.notes) {
    if (!isNoteNumberSlot(slot)) continue

    if (isSlotRestLike(slot)) {
      const duration = getDuration(slot.chronaxie, resolveNoteNumberDotCount(slot))
      seq.push({note_id: slot.id, midi: 0, duration, playTime})
      playTime += duration
      continue
    }

    playTime = appendNoteNumberSequence(
      seq,
      slot,
      playTime,
      staveIndex,
      state.curKeySignature,
      noteStaveIndex,
    )
  }

  applyMeasureKeySignatureBack(state, measure)
  return playTime - measureStart
}

/**
 * 简谱 → 可播放序列
 * - 按小节调号（首调）换算 getNoteNumberMidi
 * - 时值在 NoteNumber 层；和弦共享同一 duration
 * - 休止符 / 节奏 X：midi = 0
 */
export function getNumberNotationPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  const measurePositions = getMeasurePositions(musicScoreData)
  const playMeasureIndexes = getPlayMeasureIndexes(musicScoreData)

  const seq: DR_playSequence = []
  const noteStaveIndex = new Map<string, number>()
  const maxStaves = Math.max(0, ...musicScoreData.grandStaffs.map((gs) => gs.staves.length))
  const staveStates: NumberPlayState[] = Array.from({length: maxStaves}, () => ({
    curKeySignature: KeySignatureTypeEnum.C,
  }))
  let globalPlayTime: Unit256 = 0

  for (const measureIndex of playMeasureIndexes) {
    const {grandStaffIndex, measureIndex: measureInGrandStaffIndex} = measurePositions[measureIndex]
    const grandStaff = musicScoreData.grandStaffs[grandStaffIndex]
    let measureDuration: Unit256 = 0

    for (let staveIndex = 0; staveIndex < grandStaff.staves.length; staveIndex++) {
      const measure = grandStaff.staves[staveIndex].measures[measureInGrandStaffIndex]
      if (!measure) continue
      const staveDuration = appendMeasureSequence(
        seq,
        measure,
        globalPlayTime,
        staveIndex,
        staveStates[staveIndex]!,
        noteStaveIndex,
      )
      measureDuration = Math.max(measureDuration, staveDuration)
    }
    globalPlayTime += measureDuration
  }

  applySlurTieRealDuration(seq, musicScoreData, noteStaveIndex)
  return seq.sort((a, b) => a.playTime - b.playTime)
}
