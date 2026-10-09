import {
  BarlineTypeEnum,
  BeamTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
  getMeasureNoteList,
  isNoteRest,
  slotSymbol,
  timeSignatureTypeToBeats,
} from '@deciphony/renderer'
import type {Measure, MeasureNoteSlot, MusicScore, NoteSymbol} from '@deciphony/renderer'
import {
  DEFAULT_MEASURE_HEIGHT,
  DEFAULT_SPACING,
  createAugmentationDot,
  createBarline,
  createBracket,
  createClef,
  createGrandStaff,
  createKeySignature,
  createMeasure,
  createMusicScore,
  createNoteRest,
  createNoteSymbol,
  createSingleStaff,
  createSlur,
  createTimeSignature,
  resolveAutoBeamType,
} from '../dr-edit/score-builder'
import {glyphFor, spell, type SpellScope} from '../dr-midi-transfer/midiToMusicScore'
import type {MidiRecordPiece} from './types'

const TOP_SPACE_HEIGHT = 16
const TIE_THICKNESS = 4
const STAFF_CLEFS = [ClefTypeEnum.Treble, ClefTypeEnum.Bass] as const

export type PianoScoreWriterOptions = {
  timeSignature: TimeSignatureTypeEnum
  keySignature: KeySignatureTypeEnum
  measuresPerLine: number
  bpm: number
  title?: string
  width?: number
}

export type WriteResult = {
  pieces: MidiRecordPiece[]
  tieIds: string[]
  layoutChanged: boolean
}

type StaffState = {
  /** 已写到的位置（unit256） */
  cursor: number
  /** 小节序号 → 小节内变音记忆 */
  scopes: Map<number, SpellScope>
}

function lineHeight(): number {
  const {uSpace, dSpace} = DEFAULT_SPACING.grandStaff
  const {uSpaceI, dSpaceI, uSpaceO, dSpaceO} = DEFAULT_SPACING.singleStaff
  return uSpace + dSpace + 2 * (DEFAULT_MEASURE_HEIGHT + uSpaceI + dSpaceI + uSpaceO + dSpaceO)
}

/** 复拍子（6/8、9/8、12/8）按附点四分成组连杠，其余按四分 */
function beamBeat(time: TimeSignatureTypeEnum): number {
  const {beats, beatType} = timeSignatureTypeToBeats(time)
  return beatType === 8 && beats % 3 === 0 && beats > 3 ? 96 : 64
}

function setBeam(note: NoteSymbol, beam: BeamTypeEnum) {
  for (const info of note.notesInfo) info.beamType = beam
}

/** 钢琴大谱表（高音 + 低音）增量写入：按时间顺序追加休止 / 音符，按需建小节与换行 */
export function createPianoScoreWriter(options: PianoScoreWriterOptions) {
  const {timeSignature, keySignature} = options
  const measuresPerLine = Math.max(1, Math.floor(options.measuresPerLine))
  const {beats, beatType} = timeSignatureTypeToBeats(timeSignature)
  const capacity = (beats * 256) / beatType
  const beat = beamBeat(timeSignature)

  const score: MusicScore = createMusicScore({
    type: MusicScoreTypeEnum.StandardStaff,
    title: options.title ?? '',
    bpm: Math.round(options.bpm),
    beatUnit: 4,
    keySignature,
    timeSignature,
    width: options.width ?? 1000,
    height: TOP_SPACE_HEIGHT,
    topSpaceHeight: TOP_SPACE_HEIGHT,
  })
  const staves: StaffState[] = [
    {cursor: 0, scopes: new Map()},
    {cursor: 0, scopes: new Map()},
  ]
  const onsets = new WeakMap<MeasureNoteSlot, number>()

  function measureCount(): number {
    return score.grandStaffs.length * measuresPerLine
  }

  function addLine() {
    const lineIndex = score.grandStaffs.length
    const grandStaff = createGrandStaff({withDefaultStaff: false, bracket: createBracket(BracketTypeEnum.Brace, 0)})
    STAFF_CLEFS.forEach((clef, staffIndex) => {
      const staff = createSingleStaff({withDefaultMeasure: false, data: {}})
      for (let i = 0; i < measuresPerLine; i++) {
        const measure = createMeasure()
        if (i === 0) {
          measure.clef_f = createClef(clef)
          measure.keySignature_f = createKeySignature(keySignature)
          if (lineIndex === 0) measure.timeSignature_f = createTimeSignature(timeSignature)
        }
        staff.measures.push(measure)
      }
      grandStaff.staves[staffIndex] = staff
    })
    score.grandStaffs.push(grandStaff)
    score.height = TOP_SPACE_HEIGHT + score.grandStaffs.length * lineHeight()
  }

  /** 保证小节 no 存在；返回是否新增了行 */
  function ensureMeasure(no: number): boolean {
    let added = false
    while (measureCount() <= no) {
      addLine()
      added = true
    }
    return added
  }

  function locate(no: number) {
    const grandStaffIndex = Math.floor(no / measuresPerLine)
    const measureIndex = no % measuresPerLine
    return {grandStaffIndex, measureIndex}
  }

  function measureAt(staffIndex: number, no: number): Measure {
    const {grandStaffIndex, measureIndex} = locate(no)
    return score.grandStaffs[grandStaffIndex]!.staves[staffIndex]!.measures[measureIndex]!
  }

  function scopeOf(staffIndex: number, no: number): SpellScope {
    const scopes = staves[staffIndex]!.scopes
    let scope = scopes.get(no)
    if (!scope) {
      scope = new Map()
      scopes.set(no, scope)
    }
    return scope
  }

  /** 按拍位重算整小节符杠，并保证首尾成对（Combined 前要有可连音，OnlyRight 后要接 Combined） */
  function rebeam(measure: Measure) {
    const syms = getMeasureNoteList(measure).map((slot) => ({slot, sym: slotSymbol(slot)}))
    let prevBeamable = false
    for (const {slot, sym} of syms) {
      if (isNoteRest(sym) || !('notesInfo' in sym) || !sym.notesInfo.length) {
        prevBeamable = false
        continue
      }
      const note = sym as NoteSymbol
      let beam = resolveAutoBeamType(onsets.get(slot) ?? 0, note.notesInfo[0]!.chronaxie, beat)
      if (beam === BeamTypeEnum.Combined && !prevBeamable) beam = BeamTypeEnum.OnlyRight
      setBeam(note, beam)
      prevBeamable = beam !== BeamTypeEnum.None
    }
    syms.forEach(({sym}, i) => {
      if (isNoteRest(sym) || !('notesInfo' in sym)) return
      const note = sym as NoteSymbol
      if (note.notesInfo[0]?.beamType !== BeamTypeEnum.OnlyRight) return
      const next = syms[i + 1]?.sym
      const nextBeam = next && !isNoteRest(next) && 'notesInfo' in next
        ? (next as NoteSymbol).notesInfo[0]?.beamType
        : undefined
      if (nextBeam !== BeamTypeEnum.Combined) setBeam(note, BeamTypeEnum.None)
    })
  }

  function pushSlot(staffIndex: number, no: number, slot: MeasureNoteSlot, onsetInMeasure: number, duration: number): MidiRecordPiece {
    const measure = measureAt(staffIndex, no)
    const list = getMeasureNoteList(measure)
    list.push(slot)
    onsets.set(slot, onsetInMeasure)
    rebeam(measure)
    return {slot, measureNo: no, ...locate(no), slotIndex: list.length - 1, onsetInMeasure, duration}
  }

  /** 从当前写入位置补休止到 to；整小节用全休止 */
  function writeRest(staffIndex: number, to: number): WriteResult {
    const state = staves[staffIndex]!
    const result: WriteResult = {pieces: [], tieIds: [], layoutChanged: false}
    let pos = state.cursor
    while (pos < to) {
      const no = Math.floor(pos / capacity)
      if (ensureMeasure(no)) result.layoutChanged = true
      const measureStart = no * capacity
      const onset = pos - measureStart
      if (onset === 0 && to >= measureStart + capacity) {
        result.pieces.push(pushSlot(staffIndex, no, createNoteRest({chronaxie: 256}), 0, capacity))
        pos = measureStart + capacity
        continue
      }
      const glyph = glyphFor(Math.min(to, measureStart + capacity) - pos)
      const slot = createNoteRest({
        chronaxie: glyph.base,
        ...(glyph.dots ? {augmentationDot: createAugmentationDot(glyph.dots)} : {}),
      })
      result.pieces.push(pushSlot(staffIndex, no, slot, onset, glyph.total))
      pos += glyph.total
    }
    state.cursor = Math.max(state.cursor, to)
    return result
  }

  /** 在当前写入位置写一组音（和弦），到 to 结束；跨小节 / 无法单个时值表示时拆段并加延音线 */
  function writeNote(staffIndex: number, midis: number[], to: number): WriteResult {
    const state = staves[staffIndex]!
    const clef = STAFF_CLEFS[staffIndex]!
    const result: WriteResult = {pieces: [], tieIds: [], layoutChanged: false}
    const sorted = [...new Set(midis)].sort((a, b) => a - b)
    let prevIds: string[] | null = null
    let pos = state.cursor
    while (pos < to) {
      const no = Math.floor(pos / capacity)
      if (ensureMeasure(no)) result.layoutChanged = true
      const measureStart = no * capacity
      const onset = pos - measureStart
      const glyph = glyphFor(Math.min(to, measureStart + capacity) - pos)
      const scope = scopeOf(staffIndex, no)
      const spelled = sorted.map((midi) => spell(midi, clef, keySignature, scope))
      const regions = spelled.map((s) => s.region)
      const direction = (Math.min(...regions) + Math.max(...regions)) / 2 > 4 ? 'down' : 'up'
      const dot = glyph.dots ? {augmentationDot: createAugmentationDot(glyph.dots)} : {}
      const slot = createNoteSymbol({
        notesInfo: spelled.map((s) => ({
          region: s.region,
          chronaxie: glyph.base,
          direction,
          ...(s.accidental != null ? {accidental: s.accidental} : {}),
          ...dot,
        })),
      })
      result.pieces.push(pushSlot(staffIndex, no, slot, onset, glyph.total))
      const ids = (slotSymbol(slot) as NoteSymbol).notesInfo.map((info) => info.id)
      if (prevIds) {
        prevIds.forEach((startId, i) => {
          const tie = createSlur({startId, endId: ids[i]!})
          if (tie.data?.slur) tie.data.slur.thickness = TIE_THICKNESS
          score.affiliatedSymbols.push(tie)
          result.tieIds.push(tie.id)
        })
      }
      prevIds = ids
      pos += glyph.total
    }
    state.cursor = Math.max(state.cursor, to)
    return result
  }

  /** 结束：两谱表补齐到最后一个用到的小节末，裁掉其后的空小节，写终止线 */
  function finish(): boolean {
    const lastNo = Math.max(0, ...staves.map((s) => Math.ceil(s.cursor / capacity) - 1))
    const end = (lastNo + 1) * capacity
    let layoutChanged = ensureMeasure(lastNo)
    staves.forEach((_, i) => writeRest(i, end))
    const keepLines = Math.floor(lastNo / measuresPerLine) + 1
    if (score.grandStaffs.length > keepLines) {
      score.grandStaffs.length = keepLines
      layoutChanged = true
    }
    const lastLine = score.grandStaffs[keepLines - 1]!
    const keepInLine = (lastNo % measuresPerLine) + 1
    for (const staff of lastLine.staves) {
      if (staff.measures.length > keepInLine) {
        staff.measures.length = keepInLine
        layoutChanged = true
      }
      staff.measures[keepInLine - 1]!.barline_b = createBarline(BarlineTypeEnum.Final_barline)
    }
    score.height = TOP_SPACE_HEIGHT + score.grandStaffs.length * lineHeight()
    return layoutChanged
  }

  addLine()

  return {
    score,
    capacity,
    cursor: (staffIndex: number) => staves[staffIndex]!.cursor,
    writeRest,
    writeNote,
    finish,
  }
}

export type PianoScoreWriter = ReturnType<typeof createPianoScoreWriter>
