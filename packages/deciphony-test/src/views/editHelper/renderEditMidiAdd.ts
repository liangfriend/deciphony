import {
  AccidentalTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  type Chronaxie,
  type Measure,
  type MusicScore,
  type NotesNumberInfo,
  type SingleStaff,
  type SlotData,
} from '@deciphony/renderer'
import {
  createNoteNumber,
  createNoteSymbol,
} from '@deciphony/extensions/dr-edit/score-builder/factories'
import {computeMeasureOnsetBefore} from '@deciphony/extensions/dr-edit/score-builder'
import {
  getNoteRegionAndAccidental,
  getOctaveAndSyllable,
} from '@deciphony/extensions/score-util'
import {isMeasureAddMode} from './standardStaff/renderEditSymbolAddAction'
import {getMeasureNoteList} from '@deciphony/renderer'

/** 走到目标小节「开头」时的谱号 / 调号（与 dr-play：遇目标只吃 _f） */
export function resolveClefAndKeyAtMeasure(
  musicScore: MusicScore,
  singleStaff: SingleStaff | null | undefined,
  measure: Measure,
): {clef: ClefTypeEnum; key: KeySignatureTypeEnum} {
  let clef = ClefTypeEnum.Treble
  let key = musicScore.keySignature ?? KeySignatureTypeEnum.C
  if (!singleStaff) return {clef, key}
  for (const m of singleStaff.measures) {
    if (m.clef_f) clef = m.clef_f.type
    if (m.keySignature_f) key = m.keySignature_f.type
    if (m.id === measure.id) break
    if (m.clef_b) clef = m.clef_b.type
    if (m.keySignature_b) key = m.keySignature_b.type
  }
  return {clef, key}
}

function defaultDirection(region: number): 'up' | 'down' {
  return region > 4 ? 'down' : 'up'
}

function clampOctaveDot(n: number): NotesNumberInfo['octaveDot'] {
  return Math.max(-5, Math.min(6, Math.round(n))) as NotesNumberInfo['octaveDot']
}

/**
 * MIDI note-on → 在选中小节末尾追加音符（时值取当前添加面板 chronaxie）。
 * 仅小节选中态生效。
 */
export function applyMidiNoteToSelectedMeasure(
  selected: SlotData | null,
  midi: number,
  chronaxie: Chronaxie,
): boolean {
  if (!isMeasureAddMode(selected)) return false
  if (!Number.isFinite(midi) || midi < 0 || midi > 127) return false

  const measure = selected.measure
  const musicScore = selected.musicScore
  const {clef, key} = resolveClefAndKeyAtMeasure(musicScore, selected.singleStaff, measure)

  const beamOnset = computeMeasureOnsetBefore(measure, getMeasureNoteList(measure).length)

  if (musicScore.type === MusicScoreTypeEnum.NumberNotation) {
    const {octave, syllable, accidental} = getOctaveAndSyllable(
      midi,
      AccidentalTypeEnum.Sharp,
      key,
    )
    if (syllable < 1 || syllable > 7) return false
    getMeasureNoteList(measure).push(
      createNoteNumber({
        syllable: syllable as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        chronaxie,
        octaveDot: clampOctaveDot(octave),
        accidental: accidental ?? undefined,
        beamOnset,
      }),
    )
    return true
  }

  const {region, accidental} = getNoteRegionAndAccidental(
    clef,
    midi,
    key,
    AccidentalTypeEnum.Sharp,
  )
  getMeasureNoteList(measure).push(
    createNoteSymbol({
      region,
      chronaxie,
      direction: defaultDirection(region),
      accidental: accidental ?? undefined,
      beamOnset,
    }),
  )
  return true
}
