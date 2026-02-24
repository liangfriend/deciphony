import MusicScoreVue from './components/musicScore.vue'

export default MusicScoreVue

export type {MusicScore, NotesInfo, GrandStaff, SingleStaff, Measure, NoteSymbol} from './types/MusicScoreType'
export type {Chronaxie} from './types/common'

export {
  MusicScoreTypeEnum,
  BarlineTypeEnum,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  TimeSignatureTypeEnum,
  SpanSymbolTypeEnum,
  SpanSymbolNameEnum,
  NoteSymbolTypeEnum,
  DoubleAffiliatedSymbolNameEnum,
  SingleAffiliatedSymbolNameEnum,
  AccidentalTypeEnum,
} from './enums/musicScoreEnum'
export {BeamTypeEnum} from './standardStaff/enums/standardStaffEnum'
