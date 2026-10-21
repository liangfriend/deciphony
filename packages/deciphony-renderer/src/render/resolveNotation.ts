import {
  MusicScoreTypeEnum,
  fretboardStringCount,
  isFretboardScoreType,
  tabSkinPackKeyForType,
} from '@/enums/musicScoreEnum'
import {musicScoreToVDom as musicScoreToVDomTab6} from '@/tab6/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomTab4} from '@/tab4/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomTab5} from '@/tab5/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomNumber} from '@/numberNotation/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomStandard} from '@/standardStaff/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomDrum} from '@/drumNotation/render/musicScoreToVDom'
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

export type MusicScoreToVDomFn = typeof musicScoreToVDomStandard

export type NotationSkinPack =
  | StandardStaffSkinPack
  | NumberNotationSkinPack
  | Tab6SkinPack
  | DrumNotationSkinPack

function pickNotationToVDom(type: MusicScoreTypeEnum): MusicScoreToVDomFn {
  if (type === MusicScoreTypeEnum.NumberNotation) return musicScoreToVDomNumber
  if (type === MusicScoreTypeEnum.DrumNotation) return musicScoreToVDomDrum
  if (isFretboardScoreType(type)) {
    const n = fretboardStringCount(type)
    if (n === 4) return musicScoreToVDomTab4
    if (n === 5) return musicScoreToVDomTab5
    return musicScoreToVDomTab6
  }
  return musicScoreToVDomStandard
}

/** 各谱种自身的排版（不含小节号等谱种无关的追加）；紧贴的重复小节线在此合并 */
export function resolveNotationToVDom(type: MusicScoreTypeEnum): MusicScoreToVDomFn {
  const toVDom = pickNotationToVDom(type)
  return (musicScore, slotConfig, options) =>
    mergeAdjacentBarlines(toVDom(musicScore, slotConfig, options), musicScore)
}

/**
 * 每次按 type 取当前 import 绑定，避免 HMR 后仍钉死旧 musicScoreToVDom 引用；谱种无关的符号（小节号）在此统一追加。
 * 不经 musicScore 组件直接排版时，曲谱自定义符号在这里注入皮肤。
 */
export function resolveMusicScoreToVDom(type: MusicScoreTypeEnum): MusicScoreToVDomFn {
  const toVDom = resolveNotationToVDom(type)
  return (musicScore, slotConfig, options) => {
    const opts = hasExtraSymbols(musicScore)
      ? {...options, skin: withExtraSymbols(options?.skin ?? {default: defaultSkin}, musicScore)}
      : options
    return appendMeasureNumbers(toVDom(musicScore, slotConfig, opts), musicScore)
  }
}

/** 按曲谱类型取 SkinPack 中对应谱种符号表（吉他/贝斯6→tab6，尤克/贝斯4→tab4，贝斯5→tab5） */
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

/** 排版用谱种符号表：皮肤包缺这一套时回落内置默认（与各谱种 musicScoreToVDom 一致） */
export function resolveLayoutNotationPack(pack: SkinPack, type: MusicScoreTypeEnum): NotationSkinPack {
  return (resolveNotationPack(pack, type) ?? resolveNotationPack(defaultSkin, type)) as NotationSkinPack
}
