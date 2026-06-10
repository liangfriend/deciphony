import {
  AccidentalTypeEnum,
  BeamTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  Measure,
  MusicScore,
  MusicScoreTypeEnum,
  NoteNumber,
  NoteRest,
  NoteSymbol,
  NoteSymbolTypeEnum,
  NotesInfo,
  NotesNumberInfo,
} from 'deciphony-renderer'
import {isNoteRest, isNoteSymbol} from 'deciphony-renderer'
import {
  createAccidental,
  createClef,
  createNoteNumber,
} from '../dr-edit/score-builder'
import {
  getKeySignatureAccidental,
  getNoteMidi,
  getNoteNumberMidi,
  getNoteRegionAndAccidental,
  getOctaveAndSyllable,
  type AlteredAccidental,
} from '../scoreUtil'

export type NotationTransferOptions = {
  priority?: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat
}

type StaffTransferState = {
  curKeySignature: KeySignatureTypeEnum
  curClef: ClefTypeEnum
}

type NumberTransferState = {
  curKeySignature: KeySignatureTypeEnum
}

type MeasureAccidentalScope = Map<number, AlteredAccidental | null>

const DEFAULT_CLEF = ClefTypeEnum.Treble
const DEFAULT_KEY = KeySignatureTypeEnum.C
/** 倚音转回线谱时的默认时值 */
const GRACE_CHRONAXIE = 32 as const

function cloneScore(score: MusicScore): MusicScore {
  return JSON.parse(JSON.stringify(score)) as MusicScore
}

function isNumberRest(note: NoteNumber): boolean {
  return !note.notesInfo.length || note.notesInfo.every((ni) => ni.syllable === 0)
}

function applyMeasureKeySignatureFront(
  state: {curKeySignature: KeySignatureTypeEnum},
  measure: Measure,
): void {
  if (measure.keySignature_f) state.curKeySignature = measure.keySignature_f.type
}

function applyMeasureClefFront(state: StaffTransferState, measure: Measure): void {
  if (measure.clef_f) state.curClef = measure.clef_f.type
}

function applyMeasureKeySignatureBack(
  state: {curKeySignature: KeySignatureTypeEnum},
  measure: Measure,
): void {
  if (measure.keySignature_b) state.curKeySignature = measure.keySignature_b.type
}

function applyMeasureClefBack(state: StaffTransferState, measure: Measure): void {
  if (measure.clef_b) state.curClef = measure.clef_b.type
}

function applySlotClef(state: StaffTransferState, clef: {type: ClefTypeEnum} | undefined): void {
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

/** 简谱无谱号，仅移除 clef */
function stripClefOnly(measure: Measure): void {
  delete measure.clef_f
  delete measure.clef_b
}

/** 同一 NoteSymbol 内 notesInfo 时值必须一致（简谱不支持多声部） */
function assertNoPolyphonicChronaxie(score: MusicScore): void {
  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        for (const slot of measure.notes) {
          if (!isNoteSymbol(slot)) continue
          const chronaxies = new Set(slot.notesInfo.map((ni) => ni.chronaxie))
          if (chronaxies.size > 1) {
            throw new Error('该五线谱存在多声部，不可转换为简谱')
          }
        }
      }
    }
  }
}

function staffNotesInfoToNumberInfo(
  info: NotesInfo,
  state: StaffTransferState,
  scope: MeasureAccidentalScope,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): NotesNumberInfo {
  const effectiveAcc = resolveAccidentalInMeasure(
    info.accidental?.type,
    scope,
    state.curClef,
    state.curKeySignature,
    info.region,
  )
  const midi = getNoteMidi(state.curClef, info.region, effectiveAcc)
  const {octave, syllable, accidental} = getOctaveAndSyllable(midi, priority, state.curKeySignature)

  const out: NotesNumberInfo = {
    id: info.id,
    syllable: syllable as NotesNumberInfo['syllable'],
    octaveDot: octave as NotesNumberInfo['octaveDot'],
  }
  if (info.augmentationDot) out.augmentationDot = info.augmentationDot
  if (accidental) out.accidental = createAccidental(accidental)
  return out
}

function convertNoteSymbolToNoteNumber(
  note: NoteSymbol,
  state: StaffTransferState,
  scope: MeasureAccidentalScope,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): NoteNumber {
  applySlotClef(state, note.clef)
  const lead = note.notesInfo[0]!
  const notesInfo = note.notesInfo.map((ni) =>
    staffNotesInfoToNumberInfo(ni, state, scope, priority),
  )

  if (note.graceNotes?.length && notesInfo[0]) {
    notesInfo[0].graceNotes = note.graceNotes.map((g) =>
      staffNotesInfoToNumberInfo(g, state, scope, priority),
    )
  }
  if (note.graceNotesAfter?.length && notesInfo[0]) {
    notesInfo[0].graceNotesAfter = note.graceNotesAfter.map((g) =>
      staffNotesInfoToNumberInfo(g, state, scope, priority),
    )
  }

  return {
    id: note.id,
    relativeX: note.relativeX,
    relativeY: note.relativeY,
    relativeW: note.relativeW,
    relativeH: note.relativeH,
    chronaxie: lead.chronaxie,
    notesInfo,
    beamType: lead.beamType ?? BeamTypeEnum.None,
    affiliatedSymbols: note.notesInfo.flatMap((ni) => ni.affiliatedSymbols ?? []),
    widthRatio: note.widthRatio,
    widthRatioForMeasure: note.widthRatioForMeasure,
  }
}

function convertRestToNoteNumber(rest: NoteRest): NoteNumber {
  const note = createNoteNumber({
    syllable: 0,
    chronaxie: rest.chronaxie,
    beamType: BeamTypeEnum.None,
    widthRatio: rest.widthRatio,
    widthRatioForMeasure: rest.widthRatioForMeasure,
    ...(rest.augmentationDot ? {augmentationDot: rest.augmentationDot} : {}),
  })
  note.id = rest.id
  note.relativeX = rest.relativeX
  note.relativeY = rest.relativeY
  note.relativeW = rest.relativeW
  note.relativeH = rest.relativeH
  note.affiliatedSymbols = rest.affiliatedSymbols ?? []
  return note
}

function numberInfoToStaffInfo(
  info: NotesNumberInfo,
  chronaxie: NotesInfo['chronaxie'],
  beamType: BeamTypeEnum,
  affiliatedSymbols: NotesInfo['affiliatedSymbols'],
  keySignature: KeySignatureTypeEnum,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
  graceChronaxie?: NotesInfo['chronaxie'],
): NotesInfo {
  if (info.syllable === 0 || info.syllable === 'X') {
    throw new Error('休止符或节奏音符无法转为线谱音符头')
  }

  const midi = getNoteNumberMidi(info, keySignature)
  const {region, accidental} = getNoteRegionAndAccidental(DEFAULT_CLEF, midi, keySignature, priority)
  const staffInfo: NotesInfo = {
    id: info.id,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
    region,
    chronaxie: graceChronaxie ?? chronaxie,
    direction: region > 4 ? 'down' : 'up',
    beamType,
    affiliatedSymbols,
  }
  if (info.augmentationDot) staffInfo.augmentationDot = info.augmentationDot
  if (accidental) staffInfo.accidental = createAccidental(accidental)
  return staffInfo
}

function convertNoteNumberToNoteSymbol(
  note: NoteNumber,
  keySignature: KeySignatureTypeEnum,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): NoteSymbol {
  const affiliated = note.affiliatedSymbols ?? []
  const notesInfo = note.notesInfo.map((ni, index) =>
    numberInfoToStaffInfo(
      ni,
      note.chronaxie,
      note.beamType ?? BeamTypeEnum.None,
      index === 0 ? affiliated : [],
      keySignature,
      priority,
    ),
  )

  const symbol: NoteSymbol = {
    id: note.id,
    relativeX: note.relativeX,
    relativeY: note.relativeY,
    relativeW: note.relativeW,
    relativeH: note.relativeH,
    type: NoteSymbolTypeEnum.Note,
    notesInfo,
    widthRatio: note.widthRatio,
    widthRatioForMeasure: note.widthRatioForMeasure,
  }

  const lead = note.notesInfo[0]
  if (lead?.graceNotes?.length) {
    symbol.graceNotes = lead.graceNotes.map((g) =>
      numberInfoToStaffInfo(g, note.chronaxie, BeamTypeEnum.None, [], keySignature, priority, GRACE_CHRONAXIE),
    )
  }
  if (lead?.graceNotesAfter?.length) {
    symbol.graceNotesAfter = lead.graceNotesAfter.map((g) =>
      numberInfoToStaffInfo(g, note.chronaxie, BeamTypeEnum.None, [], keySignature, priority, GRACE_CHRONAXIE),
    )
  }
  return symbol
}

function convertNoteNumberToRest(note: NoteNumber): NoteRest {
  const rest: NoteRest = {
    id: note.id,
    relativeX: note.relativeX,
    relativeY: note.relativeY,
    relativeW: note.relativeW,
    relativeH: note.relativeH,
    type: NoteSymbolTypeEnum.Rest,
    chronaxie: note.chronaxie,
    affiliatedSymbols: note.affiliatedSymbols,
    widthRatio: note.widthRatio,
    widthRatioForMeasure: note.widthRatioForMeasure,
  }
  if (note.augmentationDot) rest.augmentationDot = note.augmentationDot
  return rest
}

function ensureDefaultClef(measure: Measure): void {
  if (!measure.clef_f) {
    measure.clef_f = createClef(DEFAULT_CLEF)
  }
}

/**
 * 五线谱 → 简谱
 * - 校验同音符位多声部（chronaxie 不一致）
 * - 按谱号/调号/小节变音记忆换算 midi，再 getOctaveAndSyllable（首调）
 * - 仅删除谱号，保留调号
 */
export function standardStaffToNumberNotation(
  score: MusicScore,
  options: NotationTransferOptions = {},
): MusicScore {
  if (score.type !== MusicScoreTypeEnum.StandardStaff) {
    throw new Error('仅支持五线谱曲谱转换为简谱')
  }

  assertNoPolyphonicChronaxie(score)
  const out = cloneScore(score)
  out.type = MusicScoreTypeEnum.NumberNotation
  const priority = options.priority ?? AccidentalTypeEnum.Sharp

  for (const grandStaff of out.grandStaffs) {
    for (const staff of grandStaff.staves) {
      const state: StaffTransferState = {
        curKeySignature: KeySignatureTypeEnum.C,
        curClef: ClefTypeEnum.Treble,
      }

      for (const measure of staff.measures) {
        const scope: MeasureAccidentalScope = new Map()
        applyMeasureKeySignatureFront(state, measure)
        applyMeasureClefFront(state, measure)

        measure.notes = measure.notes.map((slot) => {
          if (isNoteSymbol(slot)) {
            return convertNoteSymbolToNoteNumber(slot, state, scope, priority)
          }
          if (isNoteRest(slot)) {
            return convertRestToNoteNumber(slot)
          }
          return slot
        })

        applyMeasureClefBack(state, measure)
        applyMeasureKeySignatureBack(state, measure)
        stripClefOnly(measure)
      }
    }
  }

  return out
}

/**
 * 简谱 → 五线谱（补充高音谱号；调号沿用简谱小节上的 keySignature）
 */
export function numberNotationToStandardStaff(
  score: MusicScore,
  options: NotationTransferOptions = {},
): MusicScore {
  if (score.type !== MusicScoreTypeEnum.NumberNotation) {
    throw new Error('仅支持简谱曲谱转换为五线谱')
  }

  const out = cloneScore(score)
  out.type = MusicScoreTypeEnum.StandardStaff
  const priority = options.priority ?? AccidentalTypeEnum.Sharp

  for (const grandStaff of out.grandStaffs) {
    for (const staff of grandStaff.staves) {
      const state: NumberTransferState = {curKeySignature: DEFAULT_KEY}

      for (const measure of staff.measures) {
        applyMeasureKeySignatureFront(state, measure)

        measure.notes = measure.notes.map((slot) => {
          const note = slot as NoteNumber
          if (isNumberRest(note)) return convertNoteNumberToRest(note)
          return convertNoteNumberToNoteSymbol(note, state.curKeySignature, priority)
        })

        applyMeasureKeySignatureBack(state, measure)
        ensureDefaultClef(measure)
      }
    }
  }

  return out
}
