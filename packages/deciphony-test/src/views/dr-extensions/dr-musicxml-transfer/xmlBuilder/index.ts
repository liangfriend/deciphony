export {
  createXmlDocument,
  elem,
  text,
  attr,
  serializeXml,
  type XmlElement
} from './core'

export {
  midiToPitch,
  chronaxieToXmlType,
  chronaxieToDuration,
  keySignatureToFifths,
  timeSignatureToBeats,
  clefToXmlSignLine,
  accidentalToXml,
  pitchStepToSemitone
} from './musicXmlEncode'

export {
  MusicXmlBuilder,
  createMusicXmlBuilder,
  createEmptyMusicXmlDocument
} from './musicXmlBuilder'

export type {
  MusicXmlBuilderOptions,
  MusicXmlPitch,
  MusicXmlMeasureAttributes,
  MusicXmlNoteInput
} from './types'
