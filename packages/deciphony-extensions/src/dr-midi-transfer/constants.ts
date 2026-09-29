import {KeySignatureTypeEnum, MusicScoreTypeEnum} from '@deciphony/renderer'

export const DEFAULT_PPQ = 480
export const DEFAULT_VELOCITY = 80
export const DEFAULT_BPM = 120
export const DRUM_CHANNEL = 9

/** 1 个四分音符 = 64 unit256 */
export const UNITS_PER_QUARTER = 64

export const KEY_TO_FIFTHS: Record<KeySignatureTypeEnum, number> = {
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
  [KeySignatureTypeEnum.C_sharp]: 7,
}

export function fifthsToKey(sf: number): KeySignatureTypeEnum {
  const clamped = Math.max(-7, Math.min(7, Math.round(sf)))
  const entry = Object.entries(KEY_TO_FIFTHS).find(([, v]) => v === clamped)
  return (entry?.[0] as KeySignatureTypeEnum | undefined) ?? KeySignatureTypeEnum.C
}

export const DEFAULT_PROGRAM: Partial<Record<MusicScoreTypeEnum, number>> = {
  [MusicScoreTypeEnum.Tab6]: 25,
  [MusicScoreTypeEnum.Tab4]: 24,
}
