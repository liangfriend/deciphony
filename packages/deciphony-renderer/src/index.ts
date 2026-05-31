import MusicScoreVue from './components/musicScore.vue'

export default MusicScoreVue

export type {
  MusicScore,
  NotesInfo,
  NotesNumberInfo,
  NoteNumber,
  GrandStaff,
  SingleStaff,
  Measure,
  NoteSymbol,
  MeasureStartRepeat,
  MeasureEndRepeat,
} from './types/MusicScoreType'
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
  DoubleNoteAffiliatedSymbolNameEnum,
  DoubleMeasureAffiliatedSymbolNameEnum,
  SingleNoteAffiliatedSymbolNameEnum,
  SingleMeasureAffiliatedSymbolNameEnum,
  MeasureStartRepeatEnum,
  MeasureEndRepeatEnum,
  AccidentalTypeEnum,
  BeamTypeEnum
} from './enums/musicScoreEnum'
