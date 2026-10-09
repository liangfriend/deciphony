import {
  AccidentalTypeEnum,
  BeamTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScore,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
  isNoteRest,
  isNoteSymbol,
  getMeasureSlots,
  slotSymbol,
  type Measure,
  type MeasureNoteSlot,
  type NoteRest,
  type NoteSymbol,
} from '@deciphony/renderer'
import {getNoteMidi, type AlteredAccidental} from '../scoreUtil'
import {chronaxieToDuration, createMusicXmlBuilder, midiToPitch} from './xmlBuilder'
import type {MusicXmlExportTarget, MusicXmlMeasureAttributes} from './xmlBuilder'

export type MusicXmlExportOptions = {
  /** 默认 ms4（version 4.0）；传 ms3 时 version 写成 3.1，beam 等规则不变 */
  target?: MusicXmlExportTarget
}

const DEFAULT_DIVISIONS = 16

type StaffState = {
  curClef: ClefTypeEnum
  curKey: KeySignatureTypeEnum
  curTime: TimeSignatureTypeEnum
}

function defaultClefForStaff(staffIdx: number): ClefTypeEnum {
  return staffIdx === 0 ? ClefTypeEnum.Treble : ClefTypeEnum.Bass
}

function mergeMeasuresFromGrandStaffs(musicScore: MusicScore): Measure[][] {
  if (musicScore.grandStaffs.length === 0) return []

  const staffCount = musicScore.grandStaffs[0]!.staves.length
  const mergedStaves = Array.from({length: staffCount}, () => [] as Measure[])

  for (const grandStaff of musicScore.grandStaffs) {
    for (let staffIdx = 0; staffIdx < staffCount; staffIdx++) {
      mergedStaves[staffIdx]!.push(...(grandStaff.staves[staffIdx]?.measures ?? []))
    }
  }

  return mergedStaves
}

function isExportableSlot(slot: unknown): slot is MeasureNoteSlot {
  if (typeof slot !== 'object' || slot == null || !('symbol' in slot)) return false
  const body = slotSymbol(slot as MeasureNoteSlot)
  return isNoteSymbol(body) || isNoteRest(body)
}

function applyAttributesToStaffStates(attrs: MusicXmlMeasureAttributes, staffStates: StaffState[]) {
  for (const item of attrs.clefs ?? []) {
    staffStates[item.staff - 1]!.curClef = item.clef
  }
  if (attrs.key != null) {
    for (const state of staffStates) state.curKey = attrs.key
  }
  if (attrs.time != null) {
    for (const state of staffStates) state.curTime = attrs.time
  }
}

function buildFrontAttributes(
  mergedStaves: Measure[][],
  measureIdx: number,
  staffCount: number,
  staffStates: StaffState[],
  isFirstMeasure: boolean,
  divisions: number,
): MusicXmlMeasureAttributes | null {
  const clefChanges: NonNullable<MusicXmlMeasureAttributes['clefs']> = []
  let key: KeySignatureTypeEnum | undefined
  let time: TimeSignatureTypeEnum | undefined

  for (let staffIdx = 0; staffIdx < staffCount; staffIdx++) {
    const measure = mergedStaves[staffIdx]?.[measureIdx]
    if (!measure) continue
    if (measure.clef_f) {
      clefChanges.push({staff: staffIdx + 1, clef: measure.clef_f.type})
    }
    if (measure.keySignature_f) key = measure.keySignature_f.type
    if (measure.timeSignature_f) time = measure.timeSignature_f.type
  }

  if (!isFirstMeasure && clefChanges.length === 0 && key == null && time == null) {
    return null
  }

  const attrs: MusicXmlMeasureAttributes = {}

  if (isFirstMeasure) {
    attrs.divisions = divisions
    attrs.staves = staffCount
    attrs.clefs = Array.from({length: staffCount}, (_, staffIdx) => ({
      staff: staffIdx + 1,
      clef:
        mergedStaves[staffIdx]?.[measureIdx]?.clef_f?.type
        ?? staffStates[staffIdx]!.curClef,
    }))
    attrs.key =
      mergedStaves[0]?.[measureIdx]?.keySignature_f?.type
      ?? staffStates[0]!.curKey
    attrs.time =
      mergedStaves[0]?.[measureIdx]?.timeSignature_f?.type
      ?? staffStates[0]!.curTime
    return attrs
  }

  if (clefChanges.length) attrs.clefs = clefChanges
  if (key != null) attrs.key = key
  if (time != null) attrs.time = time
  return attrs
}

function buildBackAttributes(
  mergedStaves: Measure[][],
  measureIdx: number,
  staffCount: number,
): MusicXmlMeasureAttributes | null {
  const clefChanges: NonNullable<MusicXmlMeasureAttributes['clefs']> = []
  let key: KeySignatureTypeEnum | undefined
  let time: TimeSignatureTypeEnum | undefined

  for (let staffIdx = 0; staffIdx < staffCount; staffIdx++) {
    const measure = mergedStaves[staffIdx]?.[measureIdx]
    if (!measure) continue
    if (measure.clef_b) {
      clefChanges.push({staff: staffIdx + 1, clef: measure.clef_b.type})
    }
    if (measure.keySignature_b) key = measure.keySignature_b.type
    if (measure.timeSignature_b) time = measure.timeSignature_b.type
  }

  if (clefChanges.length === 0 && key == null && time == null) return null

  const attrs: MusicXmlMeasureAttributes = {}
  if (clefChanges.length) attrs.clefs = clefChanges
  if (key != null) attrs.key = key
  if (time != null) attrs.time = time
  return attrs
}

function toAlteredAccidental(
  accidental: AccidentalTypeEnum | undefined,
): AlteredAccidental | null {
  if (accidental == null || accidental === AccidentalTypeEnum.Natural) return null
  return accidental
}

/** chronaxie → MusicXML beam number 层数：四分及以上 0，八分 1，十六分 2… */
function chronaxieBeamLevels(chronaxie: number): number {
  if (chronaxie >= 64) return 0
  let levels = 0
  for (let c = 32; c >= chronaxie && c >= 1; c /= 2) levels++
  return levels
}

type BeamNeighbor = {chronaxie: number; beamType: BeamTypeEnum}

/**
 * OnlyRight / Combined → MusicXML begin / continue / end。
 * 不同时值连杠时，按自身层数与前后音符层数决定每一层的取值。
 */
function resolveBeams(
  chronaxie: number,
  beamType: BeamTypeEnum,
  prev: BeamNeighbor | null,
  next: BeamNeighbor | null,
): Array<{number: number; value: string}> {
  if (beamType === BeamTypeEnum.None) return []
  const levels = chronaxieBeamLevels(chronaxie)
  if (levels === 0) return []

  const nextLevelsRaw = next != null ? chronaxieBeamLevels(next.chronaxie) : 0
  const nextInGroup =
    next != null &&
    nextLevelsRaw > 0 &&
    next.beamType === BeamTypeEnum.Combined &&
    (beamType === BeamTypeEnum.OnlyRight || beamType === BeamTypeEnum.Combined)
  // 孤立的 OnlyRight（右侧没有可连杠的 Combined）不写 beam
  if (beamType === BeamTypeEnum.OnlyRight && !nextInGroup) return []

  const prevLevelsRaw = prev != null ? chronaxieBeamLevels(prev.chronaxie) : 0
  const prevInGroup =
    prev != null &&
    prevLevelsRaw > 0 &&
    prev.beamType !== BeamTypeEnum.None &&
    beamType === BeamTypeEnum.Combined
  const prevLevels = prevInGroup ? prevLevelsRaw : 0
  const nextLevels = nextInGroup ? nextLevelsRaw : 0

  const beams: Array<{number: number; value: string}> = []
  for (let n = 1; n <= levels; n++) {
    let value: string
    if (prevLevels < n && nextLevels < n) {
      // 这一层只在本音上出现（如八分连杠里夹的十六分）：用 hook，不能只写 begin
      value = nextInGroup ? 'forward hook' : 'backward hook'
    } else if (prevLevels < n) value = 'begin'
    else if (nextLevels < n) value = 'end'
    else value = 'continue'
    beams.push({number: n, value})
  }
  return beams
}

/** 小节内主音（和弦第一个）的前后邻居，用于决定 beam begin/continue/end */
function beamNeighborsInMeasure(measure: Measure): Array<BeamNeighbor | null> {
  const notes: BeamNeighbor[] = []
  for (const measureSlot of getMeasureSlots(measure)) {
    if (!isExportableSlot(measureSlot)) continue
    const slot = slotSymbol(measureSlot)
    if (isNoteRest(slot)) {
      notes.push({chronaxie: slot.chronaxie, beamType: BeamTypeEnum.None})
      continue
    }
    if (!isNoteSymbol(slot)) continue
    const lead = slot.notesInfo[0]
    if (!lead) continue
    notes.push({
      chronaxie: lead.chronaxie,
      beamType: lead.beamType ?? BeamTypeEnum.None,
    })
  }
  return notes
}

function writeStaffMeasureNotes(
  builder: ReturnType<typeof createMusicXmlBuilder>,
  measure: Measure,
  staffNum: number,
  staffState: StaffState,
  divisions: number,
): number {
  let currentTime = 0
  const neighbors = beamNeighborsInMeasure(measure)
  let noteIdx = 0

  for (const measureSlot of getMeasureSlots(measure)) {
    if (!isExportableSlot(measureSlot)) continue
    const slot = slotSymbol(measureSlot)

    const staffBody = isNoteRest(slot) || isNoteSymbol(slot) ? slot : null
    if (staffBody?.clef) {
      builder.writeAttributes({
        clefs: [{staff: staffNum, clef: staffBody.clef.type}],
      })
      staffState.curClef = staffBody.clef.type
    }

    if (isNoteRest(slot)) {
      const duration = chronaxieToDuration(slot.chronaxie, divisions)
      builder.writeNote({
        rest: true,
        chronaxie: slot.chronaxie,
        duration,
        staff: staffNum,
        voice: 1,
        ...(slot.augmentationDot ? {dots: slot.augmentationDot.count} : {}),
      })
      currentTime += duration
      noteIdx++
      continue
    }

    if (!isNoteSymbol(slot)) continue

    const prev = noteIdx > 0 ? neighbors[noteIdx - 1]! : null
    const next = noteIdx + 1 < neighbors.length ? neighbors[noteIdx + 1]! : null
    const lead = slot.notesInfo[0]
    const beams =
      lead != null
        ? resolveBeams(lead.chronaxie, lead.beamType ?? BeamTypeEnum.None, prev, next)
        : []
    noteIdx++

    for (let toneIdx = 0; toneIdx < slot.notesInfo.length; toneIdx++) {
      const notesInfo = slot.notesInfo[toneIdx]!
      const clef = slot.clef?.type ?? staffState.curClef
      const accidentalType = notesInfo.accidental?.type
      const midi = getNoteMidi(clef, notesInfo.region, toAlteredAccidental(accidentalType))
      const pitch = midiToPitch(midi)
      const duration = chronaxieToDuration(notesInfo.chronaxie, divisions)

      if (pitch == null) continue

      builder.writeNote({
        ...(toneIdx > 0 ? {chord: true} : {}),
        pitch,
        chronaxie: notesInfo.chronaxie,
        duration,
        staff: staffNum,
        voice: 1,
        stem: notesInfo.direction,
        ...(notesInfo.augmentationDot ? {dots: notesInfo.augmentationDot.count} : {}),
        ...(accidentalType != null ? {accidental: accidentalType} : {}),
        // 符杠只写在和弦主音上
        ...(toneIdx === 0 && beams.length ? {beams} : {}),
      })

      if (toneIdx === 0) currentTime += duration
    }
  }

  return currentTime
}

/**
 * musicScore → MusicXML（仅导出 xmlToMusicScore 可解析的符号）
 * @param options.target ms4（默认，MusicXML 4.0）| ms3（MusicXML 3.1，给 MuseScore 3）
 */
export function buildMusicScoreToXml(
  musicScore: MusicScore,
  options: MusicXmlExportOptions = {},
): File {
  const mergedStaves = mergeMeasuresFromGrandStaffs(musicScore)
  const staffCount = mergedStaves.length
  const measureCount = mergedStaves[0]?.length ?? 0

  const builder = createMusicXmlBuilder({
    divisions: DEFAULT_DIVISIONS,
    target: options.target ?? 'ms4',
    ...(musicScore.bpm != null ? {bpm: musicScore.bpm} : {}),
    ...(musicScore.title ? {title: musicScore.title} : {}),
    ...(musicScore.author ? {composer: musicScore.author} : {}),
  })
  const divisions = builder.getDivisions()

  const staffStates: StaffState[] = Array.from({length: staffCount}, (_, staffIdx) => ({
    curClef: defaultClefForStaff(staffIdx),
    curKey: KeySignatureTypeEnum.C,
    curTime: TimeSignatureTypeEnum['4_4'],
  }))

  if (measureCount === 0) {
    builder.beginMeasure(1)
    builder.writeAttributes({divisions, staves: Math.max(staffCount, 1)})
    builder.writeNote({
      rest: true,
      chronaxie: 256,
      duration: chronaxieToDuration(256, divisions),
      voice: 1,
      staff: 1,
    })
    return builder.toFile()
  }

  for (let measureIdx = 0; measureIdx < measureCount; measureIdx++) {
    builder.beginMeasure(measureIdx + 1)

    const frontAttrs = buildFrontAttributes(
      mergedStaves,
      measureIdx,
      staffCount,
      staffStates,
      measureIdx === 0,
      divisions,
    )
    if (frontAttrs) {
      builder.writeAttributes(frontAttrs)
      applyAttributesToStaffStates(frontAttrs, staffStates)
    }

    let currentTime = 0
    for (let staffIdx = 0; staffIdx < staffCount; staffIdx++) {
      if (staffIdx > 0 && currentTime > 0) {
        builder.writeBackup(currentTime)
        currentTime = 0
      }

      const measure = mergedStaves[staffIdx]?.[measureIdx]
      if (!measure) continue

      currentTime = writeStaffMeasureNotes(
        builder,
        measure,
        staffIdx + 1,
        staffStates[staffIdx]!,
        divisions,
      )
    }

    const backAttrs = buildBackAttributes(mergedStaves, measureIdx, staffCount)
    if (backAttrs) {
      builder.writeAttributes(backAttrs)
      applyAttributesToStaffStates(backAttrs, staffStates)
    }
  }

  return builder.toFile()
}
