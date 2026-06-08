import {
  AccidentalTypeEnum,
  ClefTypeEnum,
  type Chronaxie,
  KeySignatureTypeEnum,
  TimeSignatureTypeEnum
} from 'deciphony-renderer'
import type { MusicXmlPitch } from './types'

const STEP_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
}

const CHRONAXIE_TO_XML_TYPE: Partial<Record<Chronaxie, string>> = {
  256: 'whole',
  128: 'half',
  64: 'quarter',
  32: 'eighth',
  16: '16th',
  8: '32nd',
  4: '64th'
}

const KEY_TO_FIFTHS: Partial<Record<KeySignatureTypeEnum, number>> = {
  [KeySignatureTypeEnum.C_flat]: -7,
  [KeySignatureTypeEnum.G_flat]: -6,
  [KeySignatureTypeEnum.D_flat]: -5,
  [KeySignatureTypeEnum.A_flat]: -4,
  [KeySignatureTypeEnum.E_flat]: -3,
  [KeySignatureTypeEnum.B_flat]: -2,
  [KeySignatureTypeEnum.F]: -1,
  [KeySignatureTypeEnum.C]: 0,
  [KeySignatureTypeEnum.G]: 1,
  [KeySignatureTypeEnum.D]: 2,
  [KeySignatureTypeEnum.A]: 3,
  [KeySignatureTypeEnum.E]: 4,
  [KeySignatureTypeEnum.B]: 5,
  [KeySignatureTypeEnum.F_sharp]: 6,
  [KeySignatureTypeEnum.C_sharp]: 7
}

const MIDI_PITCH_TABLE: MusicXmlPitch[] = [
  { step: 'C', alter: 0, octave: 0 },
  { step: 'C', alter: 1, octave: 0 },
  { step: 'D', alter: 0, octave: 0 },
  { step: 'D', alter: 1, octave: 0 },
  { step: 'E', alter: 0, octave: 0 },
  { step: 'F', alter: 0, octave: 0 },
  { step: 'F', alter: 1, octave: 0 },
  { step: 'G', alter: 0, octave: 0 },
  { step: 'G', alter: 1, octave: 0 },
  { step: 'A', alter: 0, octave: 0 },
  { step: 'A', alter: 1, octave: 0 },
  { step: 'B', alter: 0, octave: 0 }
]

/** midi → MusicXML pitch（自然拼写 + alter） */
export function midiToPitch(midi: number): MusicXmlPitch | null {
  if (!Number.isFinite(midi)) return null
  const octave = Math.floor(midi / 12) - 1
  const semitone = ((midi % 12) + 12) % 12
  const base = MIDI_PITCH_TABLE[semitone]
  if (!base) return null
  if (base.alter) {
    return {step: base.step, alter: base.alter, octave}
  }
  return {step: base.step, octave}
}

/** chronaxie → MusicXML type */
export function chronaxieToXmlType(chronaxie: Chronaxie): string {
  return CHRONAXIE_TO_XML_TYPE[chronaxie] ?? 'quarter'
}

/** chronaxie + divisions → MusicXML duration */
export function chronaxieToDuration(chronaxie: Chronaxie, divisions: number): number {
  return Math.round((chronaxie / 64) * divisions)
}

/** 调号 → fifths */
export function keySignatureToFifths(key: KeySignatureTypeEnum): number {
  return KEY_TO_FIFTHS[key] ?? 0
}

/** 拍号 → beats / beat-type */
export function timeSignatureToBeats(time: TimeSignatureTypeEnum): {
  beats: number
  beatType: number
} {
  const [beatsRaw, beatTypeRaw] = String(time).split('_')
  return {
    beats: Number(beatsRaw) || 4,
    beatType: Number(beatTypeRaw) || 4
  }
}

/** 谱号 → sign / line */
export function clefToXmlSignLine(clef: ClefTypeEnum): { sign: string; line: number } {
  switch (clef) {
    case ClefTypeEnum.Bass:
      return { sign: 'F', line: 4 }
    case ClefTypeEnum.Alto:
      return { sign: 'C', line: 3 }
    case ClefTypeEnum.Tenor:
      return { sign: 'C', line: 4 }
    default:
      return { sign: 'G', line: 2 }
  }
}

/** 变音记号 → accidental 文本 */
export function accidentalToXml(accidental: AccidentalTypeEnum): string | null {
  switch (accidental) {
    case AccidentalTypeEnum.Sharp:
      return 'sharp'
    case AccidentalTypeEnum.Flat:
      return 'flat'
    case AccidentalTypeEnum.Natural:
      return 'natural'
    case AccidentalTypeEnum.Double_sharp:
      return 'double-sharp'
    case AccidentalTypeEnum.Double_flat:
      return 'flat-flat'
    default:
      return null
  }
}

/** pitch step 校验（导出时复用） */
export function pitchStepToSemitone(step: string): number | null {
  const semitone = STEP_SEMITONE[step.toUpperCase()]
  return semitone == null ? null : semitone
}
