import {isFretboardScoreType, isNoteRest, isNoteSymbol, MusicScoreTypeEnum, resolveStaffType, slotSymbol, getMeasureSlots, TabNoteInfoTypeEnum} from '@deciphony/renderer'
import type {Measure, MeasureNoteSlot, MusicScore, TabNote, TabNoteInfo, tabChord} from '@deciphony/renderer'
import {getMeasurePositions, getPlayMeasureIndexes} from '../../scoreUtil'
import {applyPitchOctaveOffset, applySlurTieRealDuration, GRACE_PLAY_DURATION, pushPitchItem} from '../playCommon'
import {TONE_VARIANT_HARMONIC} from '../toneColor'
import type {DR_playSequence, Unit256} from '../types'
import {getDuration} from '../types'
import {
  isChordSymbol,
  openMidiForFretInstrument,
  resolveOpenMidiForScoreType,
  resolveStringMidi,
  type ChordShape,
  type FretInstrument,
} from './pitch'

export type FretInstrumentPlayOptions = {
  /**
   * 整份谱强制空弦表（MIDI）。传入后忽略曲谱 type。
   * 长度应 ≥ 实际用到的最大 region+1。
   */
  openMidi?: readonly number[]
  /**
   * 整份谱强制乐器；一般不需要——单谱表 type 为 Guitar / Ukulele / Bass4|5|6 时按该谱表选。
   * 与 openMidi 同时传时以 openMidi 为准。
   */
  instrument?: FretInstrument
}

/** @deprecated 使用 FretInstrumentPlayOptions */
export type TabPlaySequenceOptions = FretInstrumentPlayOptions & {
  /** @deprecated 使用 instrument */
  tabInstrument?: 'guitar' | 'ukulele' | 'bass'
  /** @deprecated type 已区分贝斯，不再需要 */
  bassInstrumentValues?: string[]
}

type FretPlayState = {
  /** 沿播放顺序最近一次出现的和弦图；空占位不更新 */
  chord: ChordShape | null
}

function isTabNote(measureSlot: MeasureNoteSlot): measureSlot is MeasureNoteSlot {
  const slot = slotSymbol(measureSlot)
  return isNoteSymbol(slot) && 'isSlap' in slot
}

function isTabRest(measureSlot: MeasureNoteSlot): boolean {
  const slot = slotSymbol(measureSlot)
  return isNoteRest(slot)
}

function tabNoteBody(measureSlot: MeasureNoteSlot): TabNote {
  return slotSymbol(measureSlot) as TabNote
}

function tabRestBody(measureSlot: MeasureNoteSlot): import('@deciphony/renderer').NoteRest {
  return slotSymbol(measureSlot) as import('@deciphony/renderer').NoteRest
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

function rememberChord(state: FretPlayState, chord: tabChord | null | undefined): void {
  if (isChordSymbol(chord)) state.chord = chord
}

function resolveOpenMidi(scoreType: MusicScoreTypeEnum | undefined, options: TabPlaySequenceOptions): readonly number[] {
  if (options.openMidi) return options.openMidi
  if (options.instrument) return openMidiForFretInstrument(options.instrument)
  if (options.tabInstrument === 'guitar') return openMidiForFretInstrument('guitar')
  if (options.tabInstrument === 'ukulele') return openMidiForFretInstrument('ukulele')
  if (options.tabInstrument === 'bass') {
    // 兼容旧 API：按当前 type 推弦数，否则六弦贝斯
    return resolveOpenMidiForScoreType(scoreType)
  }
  return resolveOpenMidiForScoreType(scoreType)
}

function toneVariantOf(info: TabNoteInfo): string | undefined {
  return info.type === TabNoteInfoTypeEnum.Harmonic ? TONE_VARIANT_HARMONIC : undefined
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
  const toneVariant = toneVariantOf(info)
  const pitches: {region: number; midi: number}[] = []
  for (const region of regionsOf(info)) {
    const midi = resolveStringMidi(openMidi, region, info.value, chord)
    if (midi != null) pitches.push({region, midi})
  }
  if (!pitches.length) {
    seq.push({note_id: info.id, midi: 0, duration, playTime, ...(toneVariant ? {toneVariant} : {})})
    return
  }
  pitches.forEach((pitch, index) => {
    const noteId = index === 0 ? info.id : `${info.id}:${pitch.region}`
    pushPitchItem(seq, noteStaveIndex, staveIndex, {
      note_id: noteId,
      midi: pitch.midi,
      duration,
      playTime,
      ...(toneVariant ? {toneVariant} : {}),
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
  state: FretPlayState,
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
  state: FretPlayState,
  openMidi: readonly number[],
  staveIndex: number,
  noteStaveIndex: Map<string, number>,
): Unit256 {
  let playTime = measureStart
  for (const measureSlot of getMeasureSlots(measure)) {
    if (isTabRest(measureSlot)) {
      const rest = tabRestBody(measureSlot)
      rememberChord(state, 'chord' in rest ? (rest as {chord?: tabChord}).chord : undefined)
      const duration = getDuration(rest.chronaxie, rest.augmentationDot?.count ?? 0)
      seq.push({note_id: rest.id, midi: 0, duration, playTime})
      playTime += duration
      continue
    }
    if (!isTabNote(measureSlot)) continue
    playTime = appendTabNote(seq, tabNoteBody(measureSlot), playTime, state, openMidi, staveIndex, noteStaveIndex)
  }
  return playTime - measureStart
}

/**
 * 指板类谱（吉他 / 尤克里里 / 贝斯）→ 可播放序列。
 * 空弦音高由单谱表 type 决定；options.openMidi / instrument 可覆盖整份调用。
 */
export function getFretInstrumentPlaySequence(
  musicScoreData: MusicScore,
  options: TabPlaySequenceOptions = {},
): DR_playSequence {
  const measurePositions = getMeasurePositions(musicScoreData)
  const playMeasureIndexes = getPlayMeasureIndexes(musicScoreData)

  const seq: DR_playSequence = []
  const noteStaveIndex = new Map<string, number>()
  const maxStaves = Math.max(0, ...musicScoreData.grandStaffs.map((gs) => gs.staves.length))
  const staveStates: FretPlayState[] = Array.from({length: maxStaves}, () => ({chord: null}))
  let globalPlayTime: Unit256 = 0

  for (const measureIndex of playMeasureIndexes) {
    const {grandStaffIndex, measureIndex: measureInGrandStaffIndex} = measurePositions[measureIndex]!
    const grandStaff = musicScoreData.grandStaffs[grandStaffIndex]
    if (!grandStaff) continue
    let measureDuration: Unit256 = 0
    for (let staveIndex = 0; staveIndex < grandStaff.staves.length; staveIndex++) {
      const staff = grandStaff.staves[staveIndex]
      const measure = staff?.measures[measureInGrandStaffIndex]
      if (!staff || !measure) continue
      const openMidi = resolveOpenMidi(resolveStaffType(staff, musicScoreData), options)
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
  applyPitchOctaveOffset(seq, musicScoreData)
  return seq.sort((a, b) => a.playTime - b.playTime)
}

export function getGuitarPlaySequence(score: MusicScore, options: FretInstrumentPlayOptions = {}): DR_playSequence {
  return getFretInstrumentPlaySequence(score, {...options, instrument: options.instrument ?? 'guitar'})
}

export function getUkulelePlaySequence(score: MusicScore, options: FretInstrumentPlayOptions = {}): DR_playSequence {
  return getFretInstrumentPlaySequence(score, {...options, instrument: options.instrument ?? 'ukulele'})
}

/** 贝斯：不传 instrument 时按单谱表 type（Bass4/5/6）选空弦表 */
export function getBassPlaySequence(score: MusicScore, options: FretInstrumentPlayOptions = {}): DR_playSequence {
  return getFretInstrumentPlaySequence(score, options)
}

/** @deprecated 使用 getFretInstrumentPlaySequence / getGuitarPlaySequence 等 */
export function getTabPlaySequence(
  musicScoreData: MusicScore,
  options: TabPlaySequenceOptions = {},
): DR_playSequence {
  return getFretInstrumentPlaySequence(musicScoreData, options)
}

export function isFretboardMusicScore(score: MusicScore): boolean {
  return score.grandStaffs.some((grandStaff) =>
    grandStaff.staves.some((staff) => isFretboardScoreType(resolveStaffType(staff, score))),
  )
}
