import type {
  AccidentalTypeEnum,
  ClefTypeEnum,
  Chronaxie,
  KeySignatureTypeEnum,
  TimeSignatureTypeEnum
} from 'deciphony-renderer'

export type MusicXmlBuilderOptions = {
  title?: string
  composer?: string
  partId?: string
  partName?: string
  divisions?: number
  bpm?: number
}

export type MusicXmlPitch = {
  step: string
  alter?: number
  octave: number
}

export type MusicXmlMeasureAttributes = {
  divisions?: number
  staves?: number
  key?: KeySignatureTypeEnum
  time?: TimeSignatureTypeEnum
  clefs?: Array<{ staff: number; clef: ClefTypeEnum }>
}

export type MusicXmlNoteInput = {
  staff?: number
  voice?: number
  duration: number
  chronaxie: Chronaxie
  chord?: boolean
  stem?: 'up' | 'down'
  dots?: number
  accidental?: AccidentalTypeEnum
  pitch?: MusicXmlPitch
  rest?: boolean
  beam?: boolean
}
