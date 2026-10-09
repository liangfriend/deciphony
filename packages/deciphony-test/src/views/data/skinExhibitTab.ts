/**
 * 皮肤对照用吉他谱：覆盖品格、泛音、琶音、扫弦、拍弦、休止、连音。
 */
import {
  BeamTypeEnum,
  DoubleNoteAffiliatedSymbolNameEnum,
  MusicScoreTypeEnum,
  NoteName,
  NoteSymbolTypeEnum,
  SlurTypeEnum,
  TabNoteInfoTypeEnum,
  type MusicScore,
  type TabNote,
  type TabRest,
} from '@deciphony/renderer'
import {createGrandStaff, createMeasureNoteSlot, createMusicScore, newId} from './scoreBuilder'
import {getMeasureNoteList} from '@deciphony/renderer'

const ZERO = {relativeX: 0, relativeY: 0, relativeW: 1, relativeH: 1} as const

function emptyChord(stringCount: number): TabNote['chord'] {
  return {
    id: newId(),
    width: 50,
    height: 60,
    stringCount,
    name: '',
    fretCount: 5,
    baseFret: 0,
    barres: [],
    tuning:
      stringCount === 4
        ? [NoteName.A, NoteName.E, NoteName.C, NoteName.G]
        : [NoteName.E, NoteName.A, NoteName.D, NoteName.G, NoteName.B, NoteName.E],
    stringStates: [],
    ...ZERO,
  }
}

function buildTabExhibit(type: MusicScoreTypeEnum.Guitar | MusicScoreTypeEnum.Ukulele): MusicScore {
  const stringCount = type === MusicScoreTypeEnum.Ukulele ? 4 : 6
  const data = createMusicScore({
    height: 420,
    width: 720,
    type,
    title: type === MusicScoreTypeEnum.Ukulele ? '尤克里里皮肤展' : '吉他皮肤展',
  })
  const gs = createGrandStaff()
  data.grandStaffs.push(gs)
  const measure = gs.staves[0]!.measures[0]!
  const chord = emptyChord(stringCount)

  const idNormal = newId()
  const idHarmonic = newId()
  const idArpeggio = newId()
  const idStrum = newId()
  const idSlapA = newId()
  const idSlapB = newId()

  const noteNormal: TabNote = {
    id: newId(),
    type: NoteSymbolTypeEnum.Note,
    isSlap: false,
    chord,
    notesInfo: [
      {
        id: idNormal,
        type: TabNoteInfoTypeEnum.Normal,
        chronaxie: 64,
        region: 0,
        value: 3,
        beamType: BeamTypeEnum.None,
        affiliatedSymbols: [],
        ...ZERO,
      },
      {
        id: idHarmonic,
        type: TabNoteInfoTypeEnum.Harmonic,
        chronaxie: 64,
        region: Math.min(2, stringCount - 1),
        value: 12,
        beamType: BeamTypeEnum.None,
        affiliatedSymbols: [],
        ...ZERO,
      },
    ],
    ...ZERO,
  }

  const noteGeom: TabNote = {
    id: newId(),
    type: NoteSymbolTypeEnum.Note,
    isSlap: false,
    chord: emptyChord(stringCount),
    notesInfo: [
      {
        id: idArpeggio,
        type: TabNoteInfoTypeEnum.Arpeggio,
        chronaxie: 64,
        regionRange: {start: 0, end: stringCount - 1},
        value: 0,
        beamType: BeamTypeEnum.None,
        affiliatedSymbols: [],
        ...ZERO,
      },
      {
        id: idStrum,
        type: TabNoteInfoTypeEnum.Strumming,
        chronaxie: 64,
        regionRange: {start: 0, end: stringCount - 1},
        value: 0,
        beamType: BeamTypeEnum.None,
        affiliatedSymbols: [],
        ...ZERO,
      },
    ],
    ...ZERO,
  }

  const noteSlap: TabNote = {
    id: newId(),
    type: NoteSymbolTypeEnum.Note,
    isSlap: true,
    chord: emptyChord(stringCount),
    notesInfo: [
      {
        id: idSlapA,
        type: TabNoteInfoTypeEnum.Normal,
        chronaxie: 64,
        region: stringCount - 1,
        value: -1,
        beamType: BeamTypeEnum.None,
        affiliatedSymbols: [],
        ...ZERO,
      },
      {
        id: idSlapB,
        type: TabNoteInfoTypeEnum.Normal,
        chronaxie: 64,
        region: 0,
        value: 5,
        beamType: BeamTypeEnum.None,
        affiliatedSymbols: [],
        ...ZERO,
      },
    ],
    ...ZERO,
  }

  const rest: TabRest = {
    id: newId(),
    type: NoteSymbolTypeEnum.Rest,
    chronaxie: 64,
    ...ZERO,
  }
  getMeasureNoteList(measure).push(
    ...[noteNormal, noteGeom, noteSlap, rest].map((symbol) => createMeasureNoteSlot({symbol})),
  )

  data.affiliatedSymbols.push({
    id: newId(),
    name: DoubleNoteAffiliatedSymbolNameEnum.Slur,
    startId: idNormal,
    endId: idSlapB,
    ...ZERO,
    relativeW: 0,
    relativeH: 0,
    data: {
      slur: {
        relativeStartPoint: {x: 0, y: 0},
        relativeEndPoint: {x: 0, y: 0},
        relativeControlPoint: {x: 0, y: 0},
        thickness: 6,
        type: SlurTypeEnum.H,
        relativeTextPoint: {x: 0, y: 24},
      },
    },
  })

  return data
}

export const skinExhibitTab6 = buildTabExhibit(MusicScoreTypeEnum.Guitar)
export const skinExhibitTab4 = buildTabExhibit(MusicScoreTypeEnum.Ukulele)

export default skinExhibitTab6
