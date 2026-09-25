import {
  AccidentalTypeEnum,
  BeamTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  Lyrics,
  Measure,
  MusicScore,
  MusicScoreTypeEnum,
  NoteNumber,
  NoteRest,
  NoteSymbol,
  NoteSymbolTypeEnum,
  NotesInfo,
  NotesNumberInfo,
  TimeSignatureTypeEnum,
} from '@deciphony/renderer'
import {isNoteRest, isNoteSymbol} from '@deciphony/renderer'
import {
  createAccidental,
  createClef,
  createKeySignature,
  createNoteNumber,
  createTimeSignature,
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
  /**
   * 转换后的调。默认 C。
   * 线谱→简谱：写入 MusicScore.keySignature（首调），小节上去掉调号。
   * 简谱→线谱：写入第一小节 keySignature_f（固定调），去掉顶层 keySignature。
   */
  keySignature?: KeySignatureTypeEnum
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

/** 深拷贝槽位自定义字段（data / lyrics） */
function cloneSlotUserData(slot: {
  data?: Object
  lyrics?: Lyrics[]
}): {data: Object; lyrics: Lyrics[]} {
  return {
    data: structuredClone(slot.data ?? {}),
    lyrics: structuredClone(slot.lyrics ?? []),
  }
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

function stripMeasureKeyTimeClef(measure: Measure): void {
  delete measure.clef_f
  delete measure.clef_b
  delete measure.keySignature_f
  delete measure.keySignature_b
  delete measure.timeSignature_f
  delete measure.timeSignature_b
}

function findFirstTimeSignature(score: MusicScore): TimeSignatureTypeEnum | undefined {
  if (score.timeSignature) return score.timeSignature
  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        if (measure.timeSignature_f) return measure.timeSignature_f.type
        if (measure.timeSignature_b) return measure.timeSignature_b.type
      }
    }
  }
  return undefined
}

/** 简谱源调：顶层优先，否则第一个小节调号，再否则 C */
function resolveNumberNotationSourceKey(score: MusicScore): KeySignatureTypeEnum {
  if (score.keySignature) return score.keySignature
  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        if (measure.keySignature_f) return measure.keySignature_f.type
        if (measure.keySignature_b) return measure.keySignature_b.type
      }
    }
  }
  return DEFAULT_KEY
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
  targetKey: KeySignatureTypeEnum,
): NotesNumberInfo {
  const effectiveAcc = resolveAccidentalInMeasure(
    info.accidental?.type,
    scope,
    state.curClef,
    state.curKeySignature,
    info.region,
  )
  const midi = getNoteMidi(state.curClef, info.region, effectiveAcc)
  const {octave, syllable, accidental} = getOctaveAndSyllable(midi, priority, targetKey)

  const out: NotesNumberInfo = {
    id: info.id,
    syllable: syllable as NotesNumberInfo['syllable'],
    octaveDot: octave as NotesNumberInfo['octaveDot'],
    chronaxie: info.chronaxie,
    beamType: info.beamType ?? BeamTypeEnum.None,
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
  targetKey: KeySignatureTypeEnum,
): NoteNumber {
  applySlotClef(state, note.clef)
  const notesInfo = note.notesInfo.map((ni) =>
    staffNotesInfoToNumberInfo(ni, state, scope, priority, targetKey),
  )

  return {
    id: note.id,
    relativeX: note.relativeX,
    relativeY: note.relativeY,
    relativeW: note.relativeW,
    relativeH: note.relativeH,
    notesInfo,
    graceNotes: note.graceNotes?.map((g) =>
      staffNotesInfoToNumberInfo(g, state, scope, priority, targetKey),
    ),
    graceNotesAfter: note.graceNotesAfter?.map((g) =>
      staffNotesInfoToNumberInfo(g, state, scope, priority, targetKey),
    ),
    affiliatedSymbols: note.notesInfo.flatMap((ni) => ni.affiliatedSymbols ?? []),
    widthRatio: note.widthRatio,
    widthRatioForMeasure: note.widthRatioForMeasure,
    ...cloneSlotUserData(note),
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
  const extras = cloneSlotUserData(rest)
  note.data = extras.data
  note.lyrics = extras.lyrics
  return note
}

function numberInfoToStaffInfo(
  info: NotesNumberInfo,
  affiliatedSymbols: NotesInfo['affiliatedSymbols'],
  sourceKey: KeySignatureTypeEnum,
  targetKey: KeySignatureTypeEnum,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
  graceChronaxie?: NotesInfo['chronaxie'],
): NotesInfo {
  if (info.syllable === 0 || info.syllable === 'X') {
    throw new Error('休止符或节奏音符无法转为线谱音符头')
  }

  const midi = getNoteNumberMidi(info, sourceKey)
  const {region, accidental} = getNoteRegionAndAccidental(DEFAULT_CLEF, midi, targetKey, priority)
  const staffInfo: NotesInfo = {
    id: info.id,
    relativeX: 0,
    relativeY: 0,
    relativeW: 0,
    relativeH: 0,
    region,
    chronaxie: graceChronaxie ?? info.chronaxie,
    direction: region > 4 ? 'down' : 'up',
    beamType: info.beamType ?? BeamTypeEnum.None,
    affiliatedSymbols,
  }
  if (info.augmentationDot) staffInfo.augmentationDot = info.augmentationDot
  if (accidental) staffInfo.accidental = createAccidental(accidental)
  return staffInfo
}

function convertNoteNumberToNoteSymbol(
  note: NoteNumber,
  sourceKey: KeySignatureTypeEnum,
  targetKey: KeySignatureTypeEnum,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): NoteSymbol {
  const affiliated = note.affiliatedSymbols ?? []
  const notesInfo = note.notesInfo.map((ni, index) =>
    numberInfoToStaffInfo(
      ni,
      index === 0 ? affiliated : [],
      sourceKey,
      targetKey,
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
    graceNotes: note.graceNotes?.map((g) =>
      numberInfoToStaffInfo(g, [], sourceKey, targetKey, priority, GRACE_CHRONAXIE),
    ),
    graceNotesAfter: note.graceNotesAfter?.map((g) =>
      numberInfoToStaffInfo(g, [], sourceKey, targetKey, priority, GRACE_CHRONAXIE),
    ),
    widthRatio: note.widthRatio,
    widthRatioForMeasure: note.widthRatioForMeasure,
    ...cloneSlotUserData(note),
  }

  return symbol
}

function convertNoteNumberToRest(note: NoteNumber): NoteRest {
  const lead = note.notesInfo[0]
  const rest: NoteRest = {
    id: note.id,
    relativeX: note.relativeX,
    relativeY: note.relativeY,
    relativeW: note.relativeW,
    relativeH: note.relativeH,
    type: NoteSymbolTypeEnum.Rest,
    chronaxie: lead?.chronaxie ?? 64,
    affiliatedSymbols: note.affiliatedSymbols,
    widthRatio: note.widthRatio,
    widthRatioForMeasure: note.widthRatioForMeasure,
    ...cloneSlotUserData(note),
  }
  if (lead?.augmentationDot) rest.augmentationDot = lead.augmentationDot
  return rest
}

function applyStaffHeader(
  measure: Measure,
  targetKey: KeySignatureTypeEnum,
  timeSignature: TimeSignatureTypeEnum | undefined,
  includeTime: boolean,
): void {
  measure.clef_f = createClef(DEFAULT_CLEF)
  measure.keySignature_f = createKeySignature(targetKey)
  if (includeTime && timeSignature) {
    measure.timeSignature_f = createTimeSignature(timeSignature)
  }
}

/**
 * 五线谱 → 简谱
 * - 校验同音符位多声部（chronaxie 不一致）
 * - 按谱号/调号/小节变音记忆换算 concert midi
 * - 再按目标调（默认 C）做首调唱名
 * - 目标调与拍号写入顶层；小节去掉调号/拍号/谱号
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
  const targetKey = options.keySignature ?? DEFAULT_KEY
  const resolvedTime = findFirstTimeSignature(score)

  for (const grandStaff of out.grandStaffs) {
    for (const staff of grandStaff.staves) {
      const state: StaffTransferState = {
        curKeySignature: score.keySignature ?? DEFAULT_KEY,
        curClef: DEFAULT_CLEF,
      }

      for (const measure of staff.measures) {
        const scope: MeasureAccidentalScope = new Map()
        applyMeasureKeySignatureFront(state, measure)
        applyMeasureClefFront(state, measure)

        measure.notes = measure.notes.map((slot) => {
          if (isNoteSymbol(slot)) {
            return convertNoteSymbolToNoteNumber(slot, state, scope, priority, targetKey)
          }
          if (isNoteRest(slot)) {
            return convertRestToNoteNumber(slot)
          }
          return slot
        })

        applyMeasureClefBack(state, measure)
        applyMeasureKeySignatureBack(state, measure)
        stripMeasureKeyTimeClef(measure)
      }
    }
  }

  out.keySignature = targetKey
  if (resolvedTime) out.timeSignature = resolvedTime
  else delete out.timeSignature
  if (out.beatUnit == null) out.beatUnit = 4
  if (out.bpm == null) out.bpm = 120

  return out
}

/**
 * 简谱 → 五线谱
 * - 按简谱源调（顶层 keySignature，否则小节调号）把唱名换成 concert midi
 * - 再按目标调（默认 C）写成线谱位置；目标调与拍号放到第一小节
 * - 去掉顶层 keySignature / timeSignature
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
  const targetKey = options.keySignature ?? DEFAULT_KEY
  const sourceKeyFallback = resolveNumberNotationSourceKey(score)
  const resolvedTime = findFirstTimeSignature(score)

  delete out.keySignature
  delete out.timeSignature

  for (let grandStaffIndex = 0; grandStaffIndex < out.grandStaffs.length; grandStaffIndex++) {
    const grandStaff = out.grandStaffs[grandStaffIndex]!
    for (const staff of grandStaff.staves) {
      const state: NumberTransferState = {curKeySignature: sourceKeyFallback}

      for (let measureIndex = 0; measureIndex < staff.measures.length; measureIndex++) {
        const measure = staff.measures[measureIndex]!
        applyMeasureKeySignatureFront(state, measure)

        measure.notes = measure.notes.map((slot) => {
          const note = slot as NoteNumber
          if (isNumberRest(note)) return convertNoteNumberToRest(note)
          return convertNoteNumberToNoteSymbol(note, state.curKeySignature, targetKey, priority)
        })

        applyMeasureKeySignatureBack(state, measure)
        stripMeasureKeyTimeClef(measure)

        if (measureIndex === 0) {
          applyStaffHeader(
            measure,
            targetKey,
            resolvedTime,
            grandStaffIndex === 0,
          )
        }
      }
    }
  }

  return out
}
