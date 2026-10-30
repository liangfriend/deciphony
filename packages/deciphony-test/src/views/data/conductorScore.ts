/**
 * 总谱示例：一个连谱复谱表里同时有五线、简谱、吉他、鼓。
 * 各单谱表节奏相同，用来看不同谱种的时值是否对齐。
 * 鼓谱上下声部各算一条时间线：上声部跟旋律，下声部只在正拍上给底鼓。
 */
import {
  BracketTypeEnum,
  ClefTypeEnum,
  DrumHeadTypeEnum,
  KeySignatureTypeEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
  type Chronaxie,
  type Measure,
  type MeasureNoteSlot,
  type MusicScore,
} from '@deciphony/renderer'
import {
  createBracket,
  createGrandStaff,
  createMeasure,
  createMusicScore,
  createNoteNumber,
  createNoteSymbol,
  createSingleStaff,
} from '@deciphony/extensions/dr-edit/score-builder/factories'
import {createDrumNote, createDrumRest} from '@deciphony/extensions/dr-edit/score-builder/drumNote'
import {createTabNote} from '@deciphony/extensions/dr-edit/score-builder/tabNote'

const RHYTHM: Chronaxie[][] = [
  [64, 64, 32, 32, 64],
  [32, 32, 64, 16, 16, 16, 16, 64],
]

const PITCHES = [2, 4, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2]

function onsetOf(rhythm: Chronaxie[]): number[] {
  let onset = 0
  return rhythm.map((chronaxie) => {
    const at = onset
    onset += chronaxie
    return at
  })
}

function pitchedSlots(
  rhythm: Chronaxie[],
  make: (chronaxie: Chronaxie, onset: number, index: number) => MeasureNoteSlot,
): MeasureNoteSlot[] {
  const onsets = onsetOf(rhythm)
  return rhythm.map((chronaxie, index) => make(chronaxie, onsets[index]!, index))
}

function standardMeasure(rhythm: Chronaxie[], head: boolean, from: number): Measure {
  const measure = createMeasure(head
    ? {clef: ClefTypeEnum.Treble, timeSignature: TimeSignatureTypeEnum['4_4'], keySignature: KeySignatureTypeEnum.C}
    : {})
  measure.notes = pitchedSlots(rhythm, (chronaxie, onset, index) => createNoteSymbol({
    region: PITCHES[(from + index) % PITCHES.length]!,
    chronaxie,
    beamOnset: onset,
  }))
  return measure
}

function numberMeasure(rhythm: Chronaxie[], head: boolean, from: number): Measure {
  const measure = createMeasure(head ? {timeSignature: TimeSignatureTypeEnum['4_4']} : {})
  const syllables = [1, 2, 3, 5, 6, 5, 3, 2, 1, 6, 5, 3, 1] as const
  measure.notes = pitchedSlots(rhythm, (chronaxie, onset, index) => createNoteNumber({
    syllable: syllables[(from + index) % syllables.length]!,
    chronaxie,
    beamOnset: onset,
  }))
  return measure
}

function tabMeasure(rhythm: Chronaxie[], head: boolean, from: number): Measure {
  const measure = createMeasure(head
    ? {clef: ClefTypeEnum.Tab, timeSignature: TimeSignatureTypeEnum['4_4']}
    : {})
  measure.notes = pitchedSlots(rhythm, (chronaxie, onset, index) => createTabNote({
    region: (from + index) % 6,
    value: [0, 2, 3, 0, 1, 3][(from + index) % 6],
    chronaxie,
    beamOnset: onset,
    stringCount: 6,
  }))
  return measure
}

/** 下声部：每拍一个事件。正拍底鼓，反拍休止。时值不超过四分音符。 */
function drumDown(rhythm: Chronaxie[]): MeasureNoteSlot[] {
  const total = rhythm.reduce((sum, chronaxie) => sum + chronaxie, 0)
  const slots: MeasureNoteSlot[] = []
  for (let onset = 0; onset < total; onset += 64) {
    const onBeat = onset % 128 === 0
    slots.push(onBeat
      ? createDrumNote({region: 1, chronaxie: 64, beamOnset: onset})
      : createDrumRest({chronaxie: 64, voice: 'down'}))
  }
  return slots
}

function drumMeasure(rhythm: Chronaxie[], head: boolean): Measure {
  const measure = createMeasure({
    voices: true,
    ...(head ? {clef: ClefTypeEnum.Percussion, timeSignature: TimeSignatureTypeEnum['4_4']} : {}),
  })
  measure.notes = {
    up: pitchedSlots(rhythm, (chronaxie, onset) => createDrumNote({
      region: 9,
      headType: DrumHeadTypeEnum.Cross,
      chronaxie,
      beamOnset: onset,
    })),
    down: drumDown(rhythm),
  }
  return measure
}

function loosen(staff: {uSpaceI: number; dSpaceI: number; uSpaceO: number; dSpaceO: number}): void {
  staff.uSpaceI = 24
  staff.dSpaceI = 28
  staff.uSpaceO = 12
  staff.dSpaceO = 12
}

export function buildConductorScore(): MusicScore {
  const score = createMusicScore({
    title: '总谱',
    description: '五线 / 简谱 / 吉他 / 鼓，连谱按时值对齐',
    width: 1400,
    height: 1600,
    bpm: 96,
    beatUnit: 4,
    keySignature: KeySignatureTypeEnum.C,
    timeSignature: TimeSignatureTypeEnum['4_4'],
  })

  const standard = createSingleStaff({withDefaultMeasure: false, notationType: MusicScoreTypeEnum.StandardStaff})
  const number = createSingleStaff({withDefaultMeasure: false, notationType: MusicScoreTypeEnum.NumberNotation})
  const guitar = createSingleStaff({withDefaultMeasure: false, notationType: MusicScoreTypeEnum.Guitar})
  const drum = createSingleStaff({withDefaultMeasure: false, notationType: MusicScoreTypeEnum.DrumNotation})
  for (const staff of [standard, number, guitar, drum]) loosen(staff)

  let from = 0
  for (let i = 0; i < RHYTHM.length; i++) {
    const rhythm = RHYTHM[i]!
    const head = i === 0
    standard.measures.push(standardMeasure(rhythm, head, from))
    number.measures.push(numberMeasure(rhythm, head, from))
    guitar.measures.push(tabMeasure(rhythm, head, from))
    drum.measures.push(drumMeasure(rhythm, head))
    from += rhythm.length
  }

  const grandStaff = createGrandStaff({
    withDefaultStaff: false,
    linkedStaff: true,
    bracket: createBracket(BracketTypeEnum.Brace, 0),
  })
  grandStaff.staves.push(standard, number, guitar, drum)
  score.grandStaffs.push(grandStaff)
  return score
}
