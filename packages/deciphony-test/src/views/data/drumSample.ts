import {
  BeamTypeEnum,
  ClefTypeEnum,
  DrumHeadTypeEnum,
  MusicScoreTypeEnum,
  NoteSymbolTypeEnum,
  TimeSignatureTypeEnum,
} from '@deciphony/renderer'
import type {Chronaxie, DrumNotesInfo, Measure, MeasureNoteSlot, MusicScore} from '@deciphony/renderer'
import {
  createAugmentationDot,
  createGrandStaff,
  createMeasure,
  createMusicScore,
  createSingleStaff,
  newId,
  ZERO_FRAME,
} from '@deciphony/extensions/dr-edit/score-builder'

/** 鼓谱示例用 region：底线 0，顶线 8 */
const KICK = 1
const SNARE = 5
const HI_HAT = 9
const CRASH = 10
const TOM = 7

type Head = {region: number; headType?: DrumHeadTypeEnum}

function slot(symbol: MeasureNoteSlot['symbol']): MeasureNoteSlot {
  return {...ZERO_FRAME, id: newId(), lyrics: [], data: {}, symbol}
}

function note(
  chronaxie: Chronaxie,
  heads: Head[],
  beamType: BeamTypeEnum = BeamTypeEnum.None,
  dot?: 1 | 2 | 3,
): MeasureNoteSlot {
  const notesInfo: DrumNotesInfo[] = heads.map((h) => ({
    ...ZERO_FRAME,
    id: newId(),
    region: h.region,
    headType: h.headType ?? DrumHeadTypeEnum.Normal,
    chronaxie,
    beamType,
    affiliatedSymbols: [],
    ...(dot ? {augmentationDot: createAugmentationDot(dot)} : {}),
  }))
  return slot({...ZERO_FRAME, id: newId(), type: NoteSymbolTypeEnum.Note, notesInfo})
}

function rest(chronaxie: Chronaxie, region: number): MeasureNoteSlot {
  return slot({...ZERO_FRAME, id: newId(), type: NoteSymbolTypeEnum.Rest, region, chronaxie, affiliatedSymbols: []})
}

function measure(
  up: MeasureNoteSlot[],
  down: MeasureNoteSlot[],
  opts: {head?: boolean; longRest?: boolean} = {},
): Measure {
  const m = createMeasure(opts.head ? {clef: ClefTypeEnum.Percussion, timeSignature: TimeSignatureTypeEnum['4_4']} : {})
  m.notes = {up, down}
  if (opts.longRest) m.longRest = true
  return m
}

const hh = (beam: BeamTypeEnum, withSnare = false) =>
  note(32, withSnare ? [{region: HI_HAT, headType: DrumHeadTypeEnum.Cross}, {region: SNARE}] : [{region: HI_HAT, headType: DrumHeadTypeEnum.Cross}], beam)

/** 八分踩镲 + 二四拍军鼓；下声部底鼓 */
function grooveMeasure(head = false): Measure {
  const up: MeasureNoteSlot[] = []
  for (let beat = 0; beat < 4; beat++) {
    up.push(hh(BeamTypeEnum.OnlyRight, beat % 2 === 1), hh(BeamTypeEnum.Combined))
  }
  const down = [note(64, [{region: KICK}]), rest(64, 3), note(64, [{region: KICK}]), rest(64, 3)]
  return measure(up, down, {head})
}

/** 各种音符头：上声部四分音符，下声部二分休止 */
function headsMeasure(): Measure {
  const up = [
    note(64, [{region: CRASH, headType: DrumHeadTypeEnum.CircledCross}]),
    note(64, [{region: HI_HAT, headType: DrumHeadTypeEnum.CircledSlash}]),
    note(64, [{region: TOM, headType: DrumHeadTypeEnum.Diamond}]),
    note(64, [{region: SNARE, headType: DrumHeadTypeEnum.Triangle}]),
  ]
  const down = [
    note(64, [{region: 2, headType: DrumHeadTypeEnum.Triangle}]),
    note(64, [{region: KICK, headType: DrumHeadTypeEnum.Cross}]),
    rest(64, 3),
    rest(64, 3),
  ]
  return measure(up, down)
}

/** 十六分 + 附点 */
function fillMeasure(): Measure {
  const s16 = (region: number, beam: BeamTypeEnum) => note(16, [{region}], beam)
  const up = [
    s16(SNARE, BeamTypeEnum.OnlyRight), s16(SNARE, BeamTypeEnum.Combined), s16(TOM, BeamTypeEnum.Combined), s16(TOM, BeamTypeEnum.Combined),
    note(32, [{region: SNARE}], BeamTypeEnum.OnlyRight, 1), note(16, [{region: TOM}], BeamTypeEnum.Combined),
    note(64, [{region: CRASH, headType: DrumHeadTypeEnum.Cross}]),
    rest(64, 6),
  ]
  const down = [note(64, [{region: KICK}]), note(64, [{region: KICK}]), rest(64, 3), rest(64, 3)]
  return measure(up, down)
}

const longRest = (head = false) => measure([], [], {head, longRest: true})

function staffLine(measures: Measure[]) {
  const staff = createSingleStaff({withDefaultMeasure: false, notationType: MusicScoreTypeEnum.DrumNotation})
  staff.measures = measures
  const grandStaff = createGrandStaff({withDefaultStaff: false, notationType: MusicScoreTypeEnum.DrumNotation})
  grandStaff.staves.push(staff)
  return grandStaff
}

export function buildDrumSample(): MusicScore {
  const score = createMusicScore({type: MusicScoreTypeEnum.DrumNotation, width: 1100, height: 520, title: '鼓谱示例'})
  score.grandStaffs.push(
    // 第一行：律动、音符头、5 小节长休止（头 / 内容×3 / 尾）
    staffLine([grooveMeasure(true), headsMeasure(), longRest(), longRest(), longRest(), longRest(), longRest()]),
    // 第二行：单小节长休止（完整）、加花、3 小节长休止
    staffLine([longRest(true), fillMeasure(), longRest(), longRest(), longRest()]),
  )
  return score
}
