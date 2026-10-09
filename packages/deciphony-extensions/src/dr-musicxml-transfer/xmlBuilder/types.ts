import type {
  AccidentalTypeEnum,
  ClefTypeEnum,
  Chronaxie,
  KeySignatureTypeEnum,
  TimeSignatureTypeEnum
} from '@deciphony/renderer'

/** 导出目标：决定 MusicXML version 等兼容字段；记谱规则（beam 等）不变 */
export type MusicXmlExportTarget = 'ms4' | 'ms3'

export type MusicXmlBuilderOptions = {
  title?: string
  composer?: string
  partId?: string
  partName?: string
  divisions?: number
  bpm?: number
  /** 默认 ms4（MusicXML 4.0）；ms3 → MusicXML 3.1，给 MuseScore 3 用 */
  target?: MusicXmlExportTarget
}

/** score-partwise/@version */
export function musicXmlVersionForTarget(target: MusicXmlExportTarget = 'ms4'): string {
  return target === 'ms3' ? '3.1' : '4.0'
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
  /** MusicXML `<beam number="n">begin|continue|end|…`；和弦只写在主音上 */
  beams?: Array<{number: number; value: string}>
}
