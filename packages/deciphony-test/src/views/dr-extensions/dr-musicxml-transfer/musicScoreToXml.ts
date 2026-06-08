import {
  AccidentalTypeEnum,
  BeamTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScore,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
  type Measure,
  type NoteRest,
  type NoteSymbol,
  type StaffSlot,
} from 'deciphony-renderer'
import {getNoteMidi, type AlteredAccidental} from '../scoreUtil'
import {chronaxieToDuration, createMusicXmlBuilder, midiToPitch} from './xmlBuilder'
import type {MusicXmlMeasureAttributes} from './xmlBuilder'

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

function isExportableSlot(slot: unknown): slot is NoteSymbol | NoteRest {
  return (
    typeof slot === 'object'
    && slot != null
    && 'type' in slot
    && (slot.type === NoteSymbolTypeEnum.Note || slot.type === NoteSymbolTypeEnum.Rest)
  )
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

function writeStaffMeasureNotes(
  builder: ReturnType<typeof createMusicXmlBuilder>,
  measure: Measure,
  staffNum: number,
  staffState: StaffState,
  divisions: number,
): number {
  let currentTime = 0

  for (const slot of measure.notes as StaffSlot[]) {
    if (!isExportableSlot(slot)) continue

    if (slot.clef) {
      builder.writeAttributes({
        clefs: [{staff: staffNum, clef: slot.clef.type}],
      })
      staffState.curClef = slot.clef.type
    }

    if (slot.type === NoteSymbolTypeEnum.Rest) {
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
      continue
    }

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
        ...(notesInfo.beamType !== BeamTypeEnum.None ? {beam: true} : {}),
      })

      if (toneIdx === 0) currentTime += duration
    }
  }

  return currentTime
}

/**
 * musicScore → MusicXML（仅导出 xmlToMusicScore 可解析的符号）
 */
export function buildMusicScoreToXml(musicScore: MusicScore): File {
  const mergedStaves = mergeMeasuresFromGrandStaffs(musicScore)
  const staffCount = mergedStaves.length
  const measureCount = mergedStaves[0]?.length ?? 0

  const builder = createMusicXmlBuilder({
    divisions: DEFAULT_DIVISIONS,
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
