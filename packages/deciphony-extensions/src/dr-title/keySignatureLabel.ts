import {KeySignatureTypeEnum} from '@deciphony/renderer'

/** 简谱「1=」右侧展示用简写 */
export const KEY_SIGNATURE_LABEL: Record<KeySignatureTypeEnum, string> = {
  [KeySignatureTypeEnum.C]: 'C',
  [KeySignatureTypeEnum.C_sharp]: 'C♯',
  [KeySignatureTypeEnum.D_flat]: 'D♭',
  [KeySignatureTypeEnum.D]: 'D',
  [KeySignatureTypeEnum.E_flat]: 'E♭',
  [KeySignatureTypeEnum.E]: 'E',
  [KeySignatureTypeEnum.F]: 'F',
  [KeySignatureTypeEnum.F_sharp]: 'F♯',
  [KeySignatureTypeEnum.G_flat]: 'G♭',
  [KeySignatureTypeEnum.G]: 'G',
  [KeySignatureTypeEnum.A_flat]: 'A♭',
  [KeySignatureTypeEnum.A]: 'A',
  [KeySignatureTypeEnum.B_flat]: 'B♭',
  [KeySignatureTypeEnum.B]: 'B',
  [KeySignatureTypeEnum.C_flat]: 'C♭',
}

export function keySignatureLabel(type: KeySignatureTypeEnum | undefined): string {
  if (!type) return 'C'
  return KEY_SIGNATURE_LABEL[type] ?? String(type)
}
