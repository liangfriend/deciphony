import {
  AccidentalTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScore,
  MusicScoreTypeEnum,
  NoteNumber,
  NotesInfo,
  NotesNumberInfo,
} from '@deciphony/renderer'
import {isNoteNumberSymbol, isNoteRest, isNoteSymbol, slotSymbol, getMeasureSlots} from '@deciphony/renderer'
import {createAccidental, createKeySignature} from './dr-edit/score-builder'
import {
  getKeySignatureAccidental,
  getNoteMidi,
  getNoteNumberMidi,
  getNoteRegionAndAccidental,
  getOctaveAndSyllable,
  type AlteredAccidental,
} from './scoreUtil'

export type TransposeOptions = {
  /** 认为全谱音符当前都按此调书写（不读取各小节调号） */
  fromKey: KeySignatureTypeEnum
  /** 重写后的调 */
  toKey: KeySignatureTypeEnum
  priority?: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat
}

type MeasureAccidentalScope = Map<number, AlteredAccidental | null>

const DEFAULT_CLEF = ClefTypeEnum.Treble
const DEFAULT_KEY = KeySignatureTypeEnum.C

function cloneScore(score: MusicScore): MusicScore {
  return JSON.parse(JSON.stringify(score)) as MusicScore
}

function firstMeasureKey(score: MusicScore): KeySignatureTypeEnum | undefined {
  const measure = score.grandStaffs[0]?.staves[0]?.measures[0]
  return measure?.keySignature_f?.type ?? measure?.keySignature_b?.type
}

/** 简谱：顶层 keySignature；线谱：第一小节调号。都没有则 C */
export function resolveScoreKeySignature(
  score: MusicScore,
  fallback: KeySignatureTypeEnum = DEFAULT_KEY,
): KeySignatureTypeEnum {
  if (score.type === MusicScoreTypeEnum.NumberNotation) {
    return score.keySignature ?? firstMeasureKey(score) ?? fallback
  }
  return firstMeasureKey(score) ?? score.keySignature ?? fallback
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

function writeAccidental<T extends {accidental?: {type: AccidentalTypeEnum}}>(
  info: T,
  accidental: AccidentalTypeEnum | null,
): void {
  if (accidental == null) {
    delete info.accidental
    return
  }
  if (info.accidental) info.accidental.type = accidental
  else info.accidental = createAccidental(accidental)
}

function hasNumberPitch(info: NotesNumberInfo): boolean {
  return info.syllable !== 0 && info.syllable !== 'X'
}

function transposeNumberInfo(
  info: NotesNumberInfo,
  fromKey: KeySignatureTypeEnum,
  toKey: KeySignatureTypeEnum,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  if (!hasNumberPitch(info)) return
  const midi = getNoteNumberMidi(info, fromKey)
  const {octave, syllable, accidental} = getOctaveAndSyllable(midi, priority, toKey)
  info.syllable = syllable as NotesNumberInfo['syllable']
  info.octaveDot = octave as NotesNumberInfo['octaveDot']
  writeAccidental(info, accidental)
}

function transposeStaffInfo(
  info: NotesInfo,
  clef: ClefTypeEnum,
  fromKey: KeySignatureTypeEnum,
  toKey: KeySignatureTypeEnum,
  scope: MeasureAccidentalScope,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  const effectiveAcc = resolveAccidentalInMeasure(
    info.accidental?.type,
    scope,
    clef,
    fromKey,
    info.region,
  )
  const midi = getNoteMidi(clef, info.region, effectiveAcc)
  const {region, accidental} = getNoteRegionAndAccidental(clef, midi, toKey, priority)
  info.region = region
  writeAccidental(info, accidental)
}

function rewriteKeyLabels(score: MusicScore, toKey: KeySignatureTypeEnum): void {
  if (score.type === MusicScoreTypeEnum.NumberNotation) {
    score.keySignature = toKey
  } else {
    delete score.keySignature
  }

  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        if (measure.keySignature_f) measure.keySignature_f.type = toKey
        if (measure.keySignature_b) measure.keySignature_b.type = toKey
      }
    }
  }

  const first = score.grandStaffs[0]?.staves[0]?.measures[0]
  if (score.type === MusicScoreTypeEnum.StandardStaff && first && !first.keySignature_f) {
    first.keySignature_f = createKeySignature(toKey)
  }
}

function transposeNumberNotation(
  score: MusicScore,
  fromKey: KeySignatureTypeEnum,
  toKey: KeySignatureTypeEnum,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      for (const measure of staff.measures) {
        for (const measureSlot of getMeasureSlots(measure)) {
          const note = slotSymbol(measureSlot)
          if (!isNoteNumberSymbol(note)) continue
          for (const info of note.notesInfo) transposeNumberInfo(info, fromKey, toKey, priority)
          for (const g of note.graceNotes ?? []) transposeNumberInfo(g, fromKey, toKey, priority)
          for (const g of note.graceNotesAfter ?? []) transposeNumberInfo(g, fromKey, toKey, priority)
        }
      }
    }
  }
}

function transposeStandardStaff(
  score: MusicScore,
  fromKey: KeySignatureTypeEnum,
  toKey: KeySignatureTypeEnum,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      let curClef = DEFAULT_CLEF
      for (const measure of staff.measures) {
        const scope: MeasureAccidentalScope = new Map()
        if (measure.clef_f) curClef = measure.clef_f.type

        for (const measureSlot of getMeasureSlots(measure)) {
          const slot = slotSymbol(measureSlot)
          if ((isNoteSymbol(slot) || isNoteRest(slot)) && slot.clef) {
            curClef = slot.clef.type
          }
          if (!isNoteSymbol(slot)) continue
          for (const info of slot.notesInfo) {
            transposeStaffInfo(info, curClef, fromKey, toKey, scope, priority)
          }
          for (const g of slot.graceNotes ?? []) {
            transposeStaffInfo(g, curClef, fromKey, toKey, scope, priority)
          }
          for (const g of slot.graceNotesAfter ?? []) {
            transposeStaffInfo(g, curClef, fromKey, toKey, scope, priority)
          }
        }

        if (measure.clef_b) curClef = measure.clef_b.type
      }
    }
  }
}

/**
 * 同谱种转调：保持 concert 音高，按 fromKey 解释、按 toKey 重写。
 * 不读取各小节调号，一律把 fromKey 当作音符正在使用的调。
 * 线谱仍按当前谱号换算 region；简谱改唱名 / 变音 / 八度点。
 */
export function transposeMusicScore(
  score: MusicScore,
  options: TransposeOptions,
): MusicScore {
  const {fromKey, toKey} = options
  const priority = options.priority ?? AccidentalTypeEnum.Sharp
  const out = cloneScore(score)

  if (fromKey !== toKey) {
    if (out.type === MusicScoreTypeEnum.NumberNotation) {
      transposeNumberNotation(out, fromKey, toKey, priority)
    } else if (out.type === MusicScoreTypeEnum.StandardStaff) {
      transposeStandardStaff(out, fromKey, toKey, priority)
    } else {
      throw new Error('仅支持五线谱或简谱转调')
    }
  }

  rewriteKeyLabels(out, toKey)
  return out
}

export type ShiftSemitoneOptions = {
  priority?: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat
}

function shiftNumberInfoBySemitones(
  info: NotesNumberInfo,
  key: KeySignatureTypeEnum,
  semitones: number,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  if (!hasNumberPitch(info)) return
  const midi = getNoteNumberMidi(info, key) + semitones
  const {octave, syllable, accidental} = getOctaveAndSyllable(midi, priority, key)
  info.syllable = syllable as NotesNumberInfo['syllable']
  info.octaveDot = octave as NotesNumberInfo['octaveDot']
  writeAccidental(info, accidental)
}

function shiftStaffInfoBySemitones(
  info: NotesInfo,
  clef: ClefTypeEnum,
  key: KeySignatureTypeEnum,
  scope: MeasureAccidentalScope,
  semitones: number,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  const effectiveAcc = resolveAccidentalInMeasure(
    info.accidental?.type,
    scope,
    clef,
    key,
    info.region,
  )
  const midi = getNoteMidi(clef, info.region, effectiveAcc) + semitones
  const {region, accidental} = getNoteRegionAndAccidental(clef, midi, key, priority)
  info.region = region
  writeAccidental(info, accidental)
}

function shiftNumberNotationBySemitones(
  score: MusicScore,
  semitones: number,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      let curKey = score.keySignature ?? DEFAULT_KEY
      for (const measure of staff.measures) {
        if (measure.keySignature_f) curKey = measure.keySignature_f.type
        for (const measureSlot of getMeasureSlots(measure)) {
          const note = slotSymbol(measureSlot)
          if (!isNoteNumberSymbol(note)) continue
          for (const info of note.notesInfo) {
            shiftNumberInfoBySemitones(info, curKey, semitones, priority)
          }
          for (const g of note.graceNotes ?? []) {
            shiftNumberInfoBySemitones(g, curKey, semitones, priority)
          }
          for (const g of note.graceNotesAfter ?? []) {
            shiftNumberInfoBySemitones(g, curKey, semitones, priority)
          }
        }
        if (measure.keySignature_b) curKey = measure.keySignature_b.type
      }
    }
  }
}

function shiftStandardStaffBySemitones(
  score: MusicScore,
  semitones: number,
  priority: AccidentalTypeEnum.Sharp | AccidentalTypeEnum.Flat,
): void {
  for (const grandStaff of score.grandStaffs) {
    for (const staff of grandStaff.staves) {
      let curClef = DEFAULT_CLEF
      let curKey = score.keySignature ?? DEFAULT_KEY
      for (const measure of staff.measures) {
        const scope: MeasureAccidentalScope = new Map()
        if (measure.clef_f) curClef = measure.clef_f.type
        if (measure.keySignature_f) curKey = measure.keySignature_f.type

        for (const measureSlot of getMeasureSlots(measure)) {
          const slot = slotSymbol(measureSlot)
          if ((isNoteSymbol(slot) || isNoteRest(slot)) && slot.clef) {
            curClef = slot.clef.type
          }
          if (!isNoteSymbol(slot)) continue
          for (const info of slot.notesInfo) {
            shiftStaffInfoBySemitones(info, curClef, curKey, scope, semitones, priority)
          }
          for (const g of slot.graceNotes ?? []) {
            shiftStaffInfoBySemitones(g, curClef, curKey, scope, semitones, priority)
          }
          for (const g of slot.graceNotesAfter ?? []) {
            shiftStaffInfoBySemitones(g, curClef, curKey, scope, semitones, priority)
          }
        }

        if (measure.clef_b) curClef = measure.clef_b.type
        if (measure.keySignature_b) curKey = measure.keySignature_b.type
      }
    }
  }
}

/**
 * 升降调：全体有音高音符按半音平移，调号不变。
 * - semitones = 0：不变（仍返回深拷贝）
 * - semitones = 1：升高半音；负数则降低
 */
export function shiftMusicScoreBySemitones(
  score: MusicScore,
  semitones: number,
  options: ShiftSemitoneOptions = {},
): MusicScore {
  const steps = Math.trunc(semitones)
  const out = cloneScore(score)
  if (steps === 0) return out

  const priority = options.priority ?? AccidentalTypeEnum.Sharp
  if (out.type === MusicScoreTypeEnum.NumberNotation) {
    shiftNumberNotationBySemitones(out, steps, priority)
  } else if (out.type === MusicScoreTypeEnum.StandardStaff) {
    shiftStandardStaffBySemitones(out, steps, priority)
  } else {
    throw new Error('仅支持五线谱或简谱升降调')
  }
  return out
}
