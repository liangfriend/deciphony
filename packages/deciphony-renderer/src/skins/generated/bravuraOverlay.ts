import type {SkinItem} from '@/types/common'
import {bravuraGlyphsByKey} from './bravuraStandardStaff'

export type OverlayBravuraOptions = {
  /** 符干恒朝下的谱（tab）：`noteTail_N` 取 Bravura 的朝下符尾 `noteTail_N_r` */
  stemDownTails?: boolean
}

const NOTE_TAIL_KEY = /^noteTail_\d+$/

/**
 * 用 Bravura 覆盖 pack 中同名 skinKey 的项（谱号/变音/符尾/休止/力度等）。
 * 简谱数字、tab 品号等没有对应 Bravura key 的保持原样。
 */
export function overlayBravuraGlyphs<T extends Record<string, SkinItem | undefined>>(
  pack: T,
  options?: OverlayBravuraOptions,
): T {
  const out = {...pack}
  for (const key of Object.keys(pack) as (keyof T & string)[]) {
    const sourceKey = options?.stemDownTails && NOTE_TAIL_KEY.test(key) ? `${key}_r` : key
    const hit = bravuraGlyphsByKey[sourceKey]
    if (!hit) continue
    out[key] = {...hit, skinKey: key} as T[keyof T & string]
  }
  return out
}
