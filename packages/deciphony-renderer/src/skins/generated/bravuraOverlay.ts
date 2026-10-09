import type {SkinItem} from '@/types/common'
import {bravuraGlyphsByKey} from './bravuraStandardStaff'

/**
 * 用 Bravura 覆盖 pack 中同名 skinKey 的项（谱号/变音/符尾/休止/力度等）。
 * 简谱数字、tab 品号等没有对应 Bravura key 的保持原样。
 */
export function overlayBravuraGlyphs<T extends Record<string, SkinItem | undefined>>(pack: T): T {
  const out = {...pack}
  for (const key of Object.keys(pack) as (keyof T & string)[]) {
    const hit = bravuraGlyphsByKey[key]
    if (!hit) continue
    out[key] = {...hit, skinKey: key} as T[keyof T & string]
  }
  return out
}
