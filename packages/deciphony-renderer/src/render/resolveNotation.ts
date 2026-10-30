import {MusicScoreTypeEnum, tabSkinPackKeyForType} from '@/enums/musicScoreEnum'
import {musicScoreToVDom} from '@/render/layout/scoreToVDom'
import {defaultSkin} from '@/skins/defaultSkin'
import {appendMeasureNumbers} from '@/render/measureNumber'
import {mergeAdjacentBarlines} from '@/render/mergeAdjacentBarlines'
import {hasExtraSymbols, withExtraSymbols} from '@/render/extraSymbols'
import type {
  DrumNotationSkinPack,
  NumberNotationSkinPack,
  SkinPack,
  StandardStaffSkinPack,
  Tab6SkinPack,
} from '@/types/common'

export type MusicScoreToVDomFn = typeof musicScoreToVDom

export type NotationSkinPack =
  | StandardStaffSkinPack
  | NumberNotationSkinPack
  | Tab6SkinPack
  | DrumNotationSkinPack

/**
 * 排版不再按整份曲谱的类型分发。参数保留是为了旧调用点；谱种在单谱表上。
 * 紧贴的重复小节线在此合并。
 */
export function resolveNotationToVDom(_type?: MusicScoreTypeEnum): MusicScoreToVDomFn {
  return (musicScore, slotConfig, options) =>
    mergeAdjacentBarlines(musicScoreToVDom(musicScore, slotConfig, options), musicScore)
}

/**
 * 谱种无关的符号（小节号）在此统一追加。
 * 不经 musicScore 组件直接排版时，曲谱自定义符号在这里注入皮肤。
 */
export function resolveMusicScoreToVDom(type?: MusicScoreTypeEnum): MusicScoreToVDomFn {
  const toVDom = resolveNotationToVDom(type)
  return (musicScore, slotConfig, options) => {
    const opts = hasExtraSymbols(musicScore)
      ? {...options, skin: withExtraSymbols(options?.skin ?? {default: defaultSkin}, musicScore)}
      : options
    return appendMeasureNumbers(toVDom(musicScore, slotConfig, opts), musicScore)
  }
}

/** 按单谱表谱种取 SkinPack 中对应符号表（吉他/贝斯6→tab6，尤克/贝斯4→tab4，贝斯5→tab5） */
export function resolveNotationPack(
  pack: SkinPack,
  type: MusicScoreTypeEnum,
): NotationSkinPack | undefined {
  if (type === MusicScoreTypeEnum.NumberNotation) return pack.numberNotation
  if (type === MusicScoreTypeEnum.DrumNotation) return pack.drumNotation ?? defaultSkin.drumNotation
  const key = tabSkinPackKeyForType(type)
  if (key) return pack[key]
  return pack.standardStaff
}

/** 排版用谱种符号表：皮肤包缺这一套时回落内置默认 */
export function resolveLayoutNotationPack(pack: SkinPack, type: MusicScoreTypeEnum): NotationSkinPack {
  return (resolveNotationPack(pack, type) ?? resolveNotationPack(defaultSkin, type)) as NotationSkinPack
}
