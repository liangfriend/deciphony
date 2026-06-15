/**
 * 皮肤对照展示曲谱：一个复谱表、五个单谱表（结构见 skinExhibit 说明）。
 */
import {
  AccidentalTypeEnum,
  BarlineTypeEnum,
  BeamTypeEnum,
  BracketTypeEnum,
  ClefTypeEnum,
  DoubleMeasureAffiliatedSymbolNameEnum,
  DoubleNoteAffiliatedSymbolNameEnum,
  KeySignatureTypeEnum,
  MeasureEndRepeatEnum,
  MeasureStartRepeatEnum,
  MusicScoreTypeEnum,
  TimeSignatureTypeEnum,
} from '@/enums/musicScoreEnum'
import {TIME_SIGNATURE_TYPES_ORDERED} from '@/utils/timeSignature'
import type {Chronaxie} from '@/types/common'
import type {MusicScore, MeasurePath} from '@/types/MusicScoreType'
import {
  CHRONAXIES,
  createMusicScore,
  getNote,
  insertGrandStaff,
  insertMeasure,
  insertNote,
  insertRest,
  insertSingleStaff,
  newId,
  setMeasureBarline,
  setMeasureClef,
  setMeasureKeySignature,
  setMeasureTimeSignature,
  ZERO_FRAME,
} from './scoreBuilder'

const MEASURE_W = 72
const MEASURE_W_WIDE = 140

const CHRONAXIES_ALL = CHRONAXIES as readonly Chronaxie[]
const CHRONAXIES_FROM_32 = [256, 128, 64, 32] as const

type StaffPath = {grandStaffIndex: number; singleStaffIndex: number}

function staffPath(gsIndex: number, staffIndex: number): StaffPath {
  return {grandStaffIndex: gsIndex, singleStaffIndex: staffIndex}
}

function addMeasure(
  score: MusicScore,
  path: StaffPath,
  at: number,
  opts: Parameters<typeof insertMeasure>[2] = {},
): MeasurePath {
  const isFirst = at === 0
  return insertMeasure(score, path, {
    widthRatioForMeasure: MEASURE_W,
    inheritFromPrev: !isFirst,
    clef: isFirst ? ClefTypeEnum.Treble : undefined,
    timeSignature: isFirst ? TimeSignatureTypeEnum['4_4'] : undefined,
    ...opts,
    at,
  })
}

function addSlurInMeasure(
  score: MusicScore,
  measurePath: MeasurePath,
  noteIndexA: number,
  noteIndexB: number,
) {
  const measure =
    score.grandStaffs[measurePath.grandStaffIndex]!.staves[measurePath.singleStaffIndex]!
      .measures[measurePath.measureIndex]!
  const a = measure.notes[noteIndexA]
  const b = measure.notes[noteIndexB]
  if (!a || !b || !('notesInfo' in a) || !('notesInfo' in b)) return
  score.affiliatedSymbols.push({
    ...ZERO_FRAME,
    id: newId(),
    name: DoubleNoteAffiliatedSymbolNameEnum.Slur,
    startId: a.notesInfo[0]!.id,
    endId: b.notesInfo[0]!.id,
    data: {
      slur: {
        relativeStartPoint: {x: 0, y: 0},
        relativeEndPoint: {x: 0, y: 0},
        relativeControlPoint: {x: 28, y: -20},
        thickness: 2,
      },
    },
  })
}

function addVolta(
  score: MusicScore,
  measureStartId: string,
  measureEndId: string,
) {
  score.affiliatedSymbols.push({
    ...ZERO_FRAME,
    id: newId(),
    name: DoubleMeasureAffiliatedSymbolNameEnum.Volta,
    startId: measureStartId,
    endId: measureEndId,
    data: {
      volta: {
        text: '1.',
        value: [0],
        heightRatio: 0.5,
        openLeft: false,
        openRight: false,
      },
    },
  })
}

function setMeasureStartRepeat(
  score: MusicScore,
  path: MeasurePath,
  type: MeasureStartRepeatEnum,
) {
  const measure =
    score.grandStaffs[path.grandStaffIndex]!.staves[path.singleStaffIndex]!
      .measures[path.measureIndex]!
  measure.startRepeat = {...ZERO_FRAME, id: newId(), type}
}

function setMeasureEndRepeat(
  score: MusicScore,
  path: MeasurePath,
  type: MeasureEndRepeatEnum,
) {
  const measure =
    score.grandStaffs[path.grandStaffIndex]!.staves[path.singleStaffIndex]!
      .measures[path.measureIndex]!
  measure.endRepeat = {...ZERO_FRAME, id: newId(), type}
}

/** 单谱表 1：全时值音符(符干上) + 全时值休止符 + slur */
function buildStaff1(score: MusicScore, path: StaffPath) {
  const notePath = addMeasure(score, path, 0, {widthRatioForMeasure: MEASURE_W_WIDE})
  for (const ch of CHRONAXIES_ALL) {
    insertNote(score, notePath, {region: 4, chronaxie: ch, direction: 'up'})
  }

  const restPath = addMeasure(score, path, 1, {widthRatioForMeasure: MEASURE_W_WIDE})
  for (const ch of CHRONAXIES_ALL) {
    insertRest(score, restPath, {chronaxie: ch})
  }

  const slurPath = addMeasure(score, path, 2, {widthRatioForMeasure: 48})
  insertNote(score, slurPath, {region: 3, chronaxie: 64, direction: 'up', at: 0})
  insertNote(score, slurPath, {region: 5, chronaxie: 64, direction: 'up', at: 1})
  addSlurInMeasure(score, slurPath, 0, 1)
}

/** 单谱表 2：32–256 符干下、符杠、附点、变音号 */
function buildStaff2(score: MusicScore, path: StaffPath) {
  let mi = 0

  const downPath = addMeasure(score, path, mi++, {widthRatioForMeasure: MEASURE_W_WIDE})
  for (const ch of CHRONAXIES_FROM_32) {
    insertNote(score, downPath, {region: 6, chronaxie: ch, direction: 'down'})
  }

  const beamPath = addMeasure(score, path, mi++, {widthRatioForMeasure: 56})
  insertNote(score, beamPath, {
    region: 5,
    chronaxie: 32,
    direction: 'down',
    beamType: BeamTypeEnum.Combined,
    at: 0,
  })
  insertNote(score, beamPath, {
    region: 4,
    chronaxie: 32,
    direction: 'down',
    beamType: BeamTypeEnum.Combined,
    at: 1,
  })

  const dotPath = addMeasure(score, path, mi++, {widthRatioForMeasure: MEASURE_W_WIDE})
  for (let count = 1; count <= 3; count++) {
    const notePath = insertNote(score, dotPath, {
      region: 4,
      chronaxie: 64,
      direction: 'down',
    })
    const note = getNote(score, notePath)
    if (note.notesInfo[0]) {
      note.notesInfo[0].augmentationDot = {
        ...ZERO_FRAME,
        id: newId(),
        count: count as 1 | 2 | 3,
      }
    }
  }

  const accPath = addMeasure(score, path, mi++, {widthRatioForMeasure: MEASURE_W_WIDE})
  const accidentals = [
    AccidentalTypeEnum.Sharp,
    AccidentalTypeEnum.Flat,
    AccidentalTypeEnum.Double_sharp,
    AccidentalTypeEnum.Double_flat,
    AccidentalTypeEnum.Natural,
  ]
  for (const acc of accidentals) {
    insertNote(score, accPath, {
      region: 4,
      chronaxie: 64,
      direction: 'down',
      accidental: acc,
    })
  }
}

/** 单谱表 3：小节线(前+后)、volta、谱号、调号 */
function buildStaff3(score: MusicScore, path: StaffPath) {
  let mi = 0
  const barlineTypes = Object.values(BarlineTypeEnum)

  for (const barline of barlineTypes) {
    const mPath = addMeasure(score, path, mi++)
    setMeasureBarline(score, mPath, barline, 'f')
    setMeasureBarline(score, mPath, barline, 'b')
    insertRest(score, mPath, {chronaxie: 256})
  }

  const voltaPath0 = addMeasure(score, path, mi++)
  insertRest(score, voltaPath0, {chronaxie: 256})
  const voltaPath1 = addMeasure(score, path, mi++)
  insertRest(score, voltaPath1, {chronaxie: 256})
  const m0 =
    score.grandStaffs[path.grandStaffIndex]!.staves[path.singleStaffIndex]!.measures[
      voltaPath0.measureIndex
    ]!
  const m1 =
    score.grandStaffs[path.grandStaffIndex]!.staves[path.singleStaffIndex]!.measures[
      voltaPath1.measureIndex
    ]!
  addVolta(score, m0.id, m1.id)

  for (const clef of [
    ClefTypeEnum.Treble,
    ClefTypeEnum.Bass,
    ClefTypeEnum.Alto,
    ClefTypeEnum.Tenor,
  ]) {
    const mPath = addMeasure(score, path, mi++, {inheritFromPrev: false, clef})
    setMeasureClef(score, mPath, clef, 'f')
    insertRest(score, mPath, {chronaxie: 256})
  }

  for (const key of Object.values(KeySignatureTypeEnum)) {
    const mPath = addMeasure(score, path, mi++, {inheritFromPrev: false, keySignature: key})
    setMeasureKeySignature(score, mPath, key, 'f')
    insertRest(score, mPath, {chronaxie: 256})
  }
}

/** 单谱表 4：全部拍号（19 种） */
function buildStaff4(score: MusicScore, path: StaffPath) {
  let mi = 0
  for (const ts of TIME_SIGNATURE_TYPES_ORDERED) {
    const mPath = addMeasure(score, path, mi++, {
      inheritFromPrev: false,
      timeSignature: ts,
      widthRatioForMeasure: MEASURE_W,
    })
    setMeasureTimeSignature(score, mPath, ts, 'f')
    insertRest(score, mPath, {chronaxie: 256})
  }
}

/** 单谱表 5：全部反复符号（小节前 Coda/Segno + 小节末文字类） */
function buildStaff5(score: MusicScore, path: StaffPath) {
  let mi = 0

  for (const type of Object.values(MeasureStartRepeatEnum)) {
    const mPath = addMeasure(score, path, mi++, {widthRatioForMeasure: MEASURE_W_WIDE})
    setMeasureStartRepeat(score, mPath, type)
    insertRest(score, mPath, {chronaxie: 256})
  }

  for (const type of Object.values(MeasureEndRepeatEnum)) {
    const mPath = addMeasure(score, path, mi++, {widthRatioForMeasure: MEASURE_W_WIDE})
    setMeasureEndRepeat(score, mPath, type)
    insertRest(score, mPath, {chronaxie: 256})
  }
}

export function buildSkinExhibitStandardStaff(): MusicScore {
  const score = createMusicScore({
    title: 'Skin Exhibit · 五线谱',
    type: MusicScoreTypeEnum.StandardStaff,
    width: 3000,
    height: 850,
    topSpaceHeight: 40,
  })

  const gsPath = insertGrandStaff(score, {withDefaultStaff: false})
  const gsIndex = gsPath.grandStaffIndex
  const gs = score.grandStaffs[gsIndex]!
  gs.bracket = {
    ...ZERO_FRAME,
    id: newId(),
    type: BracketTypeEnum.Brace,
    startSingleStaffIndex: 0,
  }

  for (let i = 0; i < 5; i++) {
    insertSingleStaff(score, gsPath, {withDefaultMeasure: false})
  }

  buildStaff1(score, staffPath(gsIndex, 0))
  buildStaff2(score, staffPath(gsIndex, 1))
  buildStaff3(score, staffPath(gsIndex, 2))
  buildStaff4(score, staffPath(gsIndex, 3))
  buildStaff5(score, staffPath(gsIndex, 4))

  return score
}
