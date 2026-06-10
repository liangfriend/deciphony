import {
  AccidentalTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  Measure,
  MusicScore,
  NoteSymbol,
  NoteSymbolTypeEnum,
  NotesInfo,
  StaffSlot,
} from 'deciphony-renderer'
import {
  getKeySignatureAccidental,
  getMeasurePositions,
  getNoteMidi,
  getPlayMeasureIndexes,
  type AlteredAccidental,
} from '../../scoreUtil'
import {applySlurTieRealDuration, GRACE_PLAY_DURATION, pushPitchItem} from '../playCommon'
import type {DR_playSequence, Unit256} from '../types'
import {getDuration} from '../types'

type StaffPlayState = {
  curKeySignature: KeySignatureTypeEnum
  curClef: ClefTypeEnum
}

type MeasureAccidentalScope = Map<number, AlteredAccidental | null>

function applyMeasureKeySignatureFront(state: StaffPlayState, measure: Measure): void {
  if (measure.keySignature_f) state.curKeySignature = measure.keySignature_f.type
}

function applyMeasureClefFront(state: StaffPlayState, measure: Measure): void {
  if (measure.clef_f) state.curClef = measure.clef_f.type
}

function applyMeasureKeySignatureBack(state: StaffPlayState, measure: Measure): void {
  if (measure.keySignature_b) state.curKeySignature = measure.keySignature_b.type
}

function applyMeasureClefBack(state: StaffPlayState, measure: Measure): void {
  if (measure.clef_b) state.curClef = measure.clef_b.type
}

function applySlotClef(state: StaffPlayState, clef: {type: ClefTypeEnum} | undefined): void {
  if (clef) state.curClef = clef.type
}

function resolveAccidentalInMeasure(
  explicitType: AccidentalTypeEnum | undefined,
  scope: MeasureAccidentalScope,
  clef: ClefTypeEnum,
  keySignature: KeySignatureTypeEnum,
  region: number,
): AlteredAccidental | null {
  if (explicitType != null) {
    if (explicitType === AccidentalTypeEnum.Natural) {
      scope.set(region, null)
      return null
    }
    const altered = explicitType as AlteredAccidental
    scope.set(region, altered)
    return altered
  }
  if (scope.has(region)) return scope.get(region) ?? null
  return getKeySignatureAccidental(clef, keySignature, region)
}

function appendNotesInfoChord(
  seq: DR_playSequence,
  notesInfo: NotesInfo[],
  playTime: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  const lead = notesInfo[0]
  const duration = lead ? getDuration(lead.chronaxie, lead.augmentationDot?.count ?? 0) : 0
  for (const noteInfo of notesInfo) {
    const accidental = resolveAccidentalInMeasure(
      noteInfo.accidental?.type,
      scope,
      state.curClef,
      state.curKeySignature,
      noteInfo.region,
    )
    const midi = getNoteMidi(state.curClef, noteInfo.region, accidental)
    pushPitchItem(seq, noteStaveIndex, staveIndex, {note_id: noteInfo.id, midi, duration, playTime})
  }
  return duration
}

function pushGraceNote(
  seq: DR_playSequence,
  g: NotesInfo,
  at: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const accidental = resolveAccidentalInMeasure(
    g.accidental?.type,
    scope,
    state.curClef,
    state.curKeySignature,
    g.region,
  )
  const midi = getNoteMidi(state.curClef, g.region, accidental)
  pushPitchItem(seq, noteStaveIndex, staveIndex, {
    note_id: g.id,
    midi,
    duration: GRACE_PLAY_DURATION,
    playTime: at,
  })
}

function appendGraceNotesBefore(
  seq: DR_playSequence,
  graceNotes: NotesInfo[] | undefined,
  mainPlayTime: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const list = graceNotes ?? []
  if (!list.length) return
  let t = mainPlayTime - list.length * GRACE_PLAY_DURATION
  for (const g of list) {
    pushGraceNote(seq, g, t, state, scope, staveIndex, noteStaveIndex)
    t += GRACE_PLAY_DURATION
  }
}

function appendGraceNotesAfter(
  seq: DR_playSequence,
  graceNotes: NotesInfo[] | undefined,
  mainPlayTime: Unit256,
  mainDuration: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const list = graceNotes ?? []
  if (!list.length) return
  const steal = Math.min(mainDuration, list.length * GRACE_PLAY_DURATION)
  let t = mainPlayTime + mainDuration - steal
  for (const g of list) {
    pushGraceNote(seq, g, t, state, scope, staveIndex, noteStaveIndex)
    t += GRACE_PLAY_DURATION
  }
}

function appendNoteSymbolSequence(
  seq: DR_playSequence,
  note: NoteSymbol,
  playTime: Unit256,
  state: StaffPlayState,
  scope: MeasureAccidentalScope,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  applySlotClef(state, note.clef)
  appendGraceNotesBefore(seq, note.graceNotes, playTime, state, scope, staveIndex, noteStaveIndex)
  const chordDuration = appendNotesInfoChord(
    seq,
    note.notesInfo,
    playTime,
    state,
    scope,
    staveIndex,
    noteStaveIndex,
  )
  appendGraceNotesAfter(
    seq,
    note.graceNotesAfter,
    playTime,
    chordDuration,
    state,
    scope,
    staveIndex,
    noteStaveIndex,
  )
  return playTime + chordDuration
}

function appendMeasureSequence(
  seq: DR_playSequence,
  measure: Measure,
  measureStart: Unit256,
  state: StaffPlayState,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  const measureAccidentals: MeasureAccidentalScope = new Map()
  applyMeasureKeySignatureFront(state, measure)
  applyMeasureClefFront(state, measure)

  let playTime = measureStart
  for (const slot of measure.notes) {
    const s = slot as StaffSlot
    if (s.type === NoteSymbolTypeEnum.Rest) {
      applySlotClef(state, s.clef)
      const duration = getDuration(s.chronaxie, s.augmentationDot?.count ?? 0)
      seq.push({note_id: s.id, midi: 0, duration, playTime})
      playTime += duration
    } else if (s.type === NoteSymbolTypeEnum.Note) {
      playTime = appendNoteSymbolSequence(
        seq,
        s,
        playTime,
        state,
        measureAccidentals,
        staveIndex,
        noteStaveIndex,
      )
    }
  }

  applyMeasureClefBack(state, measure)
  applyMeasureKeySignatureBack(state, measure)
  return playTime - measureStart
}

/**
 * 五线谱 → 可播放序列
 * - 谱号/调号/小节变音记忆 → getNoteMidi
 * - 倚音、延音线等同 dr-play 既有语义
 */
export function getStandardStaffPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  const measurePositions = getMeasurePositions(musicScoreData)
  const playMeasureIndexes = getPlayMeasureIndexes(musicScoreData)

  const seq: DR_playSequence = []
  const noteStaveIndex = new Map<string, number>()
  const maxStaves = Math.max(0, ...musicScoreData.grandStaffs.map((gs) => gs.staves.length))
  const staffStates: StaffPlayState[] = Array.from({length: maxStaves}, () => ({
    curKeySignature: KeySignatureTypeEnum.C,
    curClef: ClefTypeEnum.Treble,
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
        staffStates[staveIndex],
        staveIndex,
        noteStaveIndex,
      )
      measureDuration = Math.max(measureDuration, staveDuration)
    }
    globalPlayTime += measureDuration
  }

  applySlurTieRealDuration(seq, musicScoreData, noteStaveIndex)
  return seq.sort((a, b) => a.playTime - b.playTime)
}
