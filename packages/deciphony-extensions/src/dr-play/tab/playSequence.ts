import {MusicScoreTypeEnum, NoteSymbolTypeEnum} from '@deciphony/renderer'
import type {Measure, MusicScore, TabNote, TabNoteInfo, TabRest, tabChord} from '@deciphony/renderer'
import {getMeasurePositions, getPlayMeasureIndexes} from '../../scoreUtil'
import {applySlurTieRealDuration, GRACE_PLAY_DURATION, pushPitchItem} from '../playCommon'
import type {DR_playSequence, Unit256} from '../types'
import {getDuration} from '../types'
import {
  GUITAR_OPEN_MIDI,
  UKULELE_OPEN_MIDI,
  isChordSymbol,
  resolveTabStringMidi,
  type ChordShape,
} from './pitch'

type TabPlayState = {
  /** 沿播放顺序最近一次出现的和弦图；空占位不更新 */
  chord: ChordShape | null
}

function openMidiForScore(type: MusicScore['type']): readonly number[] {
  return type === MusicScoreTypeEnum.Tab4 ? UKULELE_OPEN_MIDI : GUITAR_OPEN_MIDI
}

function isTabNote(slot: Measure['notes'][number]): slot is TabNote & Measure['notes'][number] {
  return 'type' in slot
    && slot.type === NoteSymbolTypeEnum.Note
    && 'isSlap' in slot
    && 'notesInfo' in slot
}

function isTabRest(slot: Measure['notes'][number]): slot is TabRest & Measure['notes'][number] {
  return 'type' in slot && slot.type === NoteSymbolTypeEnum.Rest && !('notesInfo' in slot)
}

function infoDuration(info: TabNoteInfo): Unit256 {
  return getDuration(info.chronaxie, info.augmentationDot?.count ?? 0)
}

function regionsOf(info: TabNoteInfo): number[] {
  if (info.type === 'arpeggio' || info.type === 'strumming') {
    const start = Math.min(info.regionRange.start, info.regionRange.end)
    const end = Math.max(info.regionRange.start, info.regionRange.end)
    const regions: number[] = []
    for (let region = start; region <= end; region++) regions.push(region)
    return regions
  }
  return [info.region]
}

function rememberChord(state: TabPlayState, chord: tabChord | null | undefined): void {
  if (isChordSymbol(chord)) state.chord = chord
}

/**
 * 同一 TabNoteInfo 可能盖住多根弦（琶音 / 扫弦）。
 * 第一声用 info.id，便于高亮对准箭头或品格；其余弦加 region 后缀，避免播放器按 id 覆盖。
 */
function appendInfoPitches(
  seq: DR_playSequence,
  info: TabNoteInfo,
  playTime: Unit256,
  duration: Unit256,
  openMidi: readonly number[],
  chord: ChordShape | null,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const pitches: {region: number; midi: number}[] = []
  for (const region of regionsOf(info)) {
    const midi = resolveTabStringMidi(openMidi, region, info.value, chord)
    if (midi != null) pitches.push({region, midi})
  }
  if (!pitches.length) {
    seq.push({note_id: info.id, midi: 0, duration, playTime})
    return
  }
  pitches.forEach((pitch, index) => {
    const noteId = index === 0 ? info.id : `${info.id}:${pitch.region}`
    pushPitchItem(seq, noteStaveIndex, staveIndex, {
      note_id: noteId,
      midi: pitch.midi,
      duration,
      playTime,
    })
  })
}

function appendGraceNotes(
  seq: DR_playSequence,
  graceNotes: TabNoteInfo[] | undefined,
  startTime: Unit256,
  openMidi: readonly number[],
  chord: ChordShape | null,
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): void {
  const list = graceNotes ?? []
  let time = startTime
  for (const grace of list) {
    appendInfoPitches(seq, grace, time, GRACE_PLAY_DURATION, openMidi, chord, staveIndex, noteStaveIndex)
    time += GRACE_PLAY_DURATION
  }
}

function appendTabNote(
  seq: DR_playSequence,
  note: TabNote,
  playTime: Unit256,
  state: TabPlayState,
  openMidi: readonly number[],
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  rememberChord(state, note.chord)
  const slotDuration = note.notesInfo.length
    ? Math.max(...note.notesInfo.map(infoDuration))
    : 0

  const graceBefore = note.graceNotes ?? []
  appendGraceNotes(
    seq,
    graceBefore,
    playTime - graceBefore.length * GRACE_PLAY_DURATION,
    openMidi,
    state.chord,
    staveIndex,
    noteStaveIndex,
  )

  for (const info of note.notesInfo) {
    appendInfoPitches(seq, info, playTime, infoDuration(info), openMidi, state.chord, staveIndex, noteStaveIndex)
  }

  const graceAfter = note.graceNotesAfter ?? []
  const steal = Math.min(slotDuration, graceAfter.length * GRACE_PLAY_DURATION)
  appendGraceNotes(
    seq,
    graceAfter,
    playTime + slotDuration - steal,
    openMidi,
    state.chord,
    staveIndex,
    noteStaveIndex,
  )

  return playTime + slotDuration
}

function appendMeasureSequence(
  seq: DR_playSequence,
  measure: Measure,
  measureStart: Unit256,
  state: TabPlayState,
  openMidi: readonly number[],
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  let playTime = measureStart
  for (const slot of measure.notes) {
    if (isTabRest(slot)) {
      rememberChord(state, 'chord' in slot ? (slot as {chord?: tabChord}).chord : undefined)
      const duration = getDuration(slot.chronaxie, slot.augmentationDot?.count ?? 0)
      seq.push({note_id: slot.id, midi: 0, duration, playTime})
      playTime += duration
      continue
    }
    if (!isTabNote(slot)) continue
    playTime = appendTabNote(seq, slot, playTime, state, openMidi, staveIndex, noteStaveIndex)
  }
  return playTime - measureStart
}

/**
 * 吉他谱 / 尤克里里谱 → 可播放序列。
 * 空弦音高按谱种固定。品优先；x 用当前生效和弦图；都没有则空弦。
 * 泛音、拍弦、推弦不改变音高。
 */
export function getTabPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  const openMidi = openMidiForScore(musicScoreData.type)
  const measurePositions = getMeasurePositions(musicScoreData)
  const playMeasureIndexes = getPlayMeasureIndexes(musicScoreData)

  const seq: DR_playSequence = []
  const noteStaveIndex = new Map<string, number>()
  const maxStaves = Math.max(0, ...musicScoreData.grandStaffs.map((gs) => gs.staves.length))
  const staveStates: TabPlayState[] = Array.from({length: maxStaves}, () => ({chord: null}))
  let globalPlayTime: Unit256 = 0

  for (const measureIndex of playMeasureIndexes) {
    const {grandStaffIndex, measureIndex: measureInGrandStaffIndex} = measurePositions[measureIndex]!
    const grandStaff = musicScoreData.grandStaffs[grandStaffIndex]
    if (!grandStaff) continue
    let measureDuration: Unit256 = 0
    for (let staveIndex = 0; staveIndex < grandStaff.staves.length; staveIndex++) {
      const measure = grandStaff.staves[staveIndex]?.measures[measureInGrandStaffIndex]
      if (!measure) continue
      const staveDuration = appendMeasureSequence(
        seq,
        measure,
        globalPlayTime,
        staveStates[staveIndex]!,
        openMidi,
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
