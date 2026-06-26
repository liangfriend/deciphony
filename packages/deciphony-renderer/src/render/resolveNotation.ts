import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import {musicScoreToVDom as musicScoreToVDomGuitarTab} from '@/guitarTab/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomNumber} from '@/numberNotation/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomStandard} from '@/standardStaff/render/musicScoreToVDom'
import type {GuitarTabSkinPack, NumberNotationSkinPack, SkinPack, StandardStaffSkinPack} from '@/types/common'

export type MusicScoreToVDomFn = typeof musicScoreToVDomStandard

export type NotationSkinPack =
  | StandardStaffSkinPack
  | NumberNotationSkinPack
  | GuitarTabSkinPack

const MUSIC_SCORE_TO_VDOM: Partial<Record<MusicScoreTypeEnum, MusicScoreToVDomFn>> = {
  [MusicScoreTypeEnum.StandardStaff]: musicScoreToVDomStandard,
  [MusicScoreTypeEnum.NumberNotation]: musicScoreToVDomNumber,
  [MusicScoreTypeEnum.GuitarTab]: musicScoreToVDomGuitarTab,
}

/** 按曲谱类型选择 musicScoreToVDom 实现；未注册类型回退五线谱 */
export function resolveMusicScoreToVDom(type: MusicScoreTypeEnum): MusicScoreToVDomFn {
  return MUSIC_SCORE_TO_VDOM[type] ?? musicScoreToVDomStandard
}

/** 从 SkinPack 取当前记谱法对应的皮肤子包 */
export function resolveNotationPack(
  pack: SkinPack,
  type: MusicScoreTypeEnum,
): NotationSkinPack | undefined {
  switch (type) {
    case MusicScoreTypeEnum.NumberNotation:
      return pack.numberNotation
    case MusicScoreTypeEnum.GuitarTab: {
      return pack.guitarTab
    }

    default:
      return pack.standardStaff
  }
}
