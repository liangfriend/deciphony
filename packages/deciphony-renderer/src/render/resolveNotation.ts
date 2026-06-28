import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import {musicScoreToVDom as musicScoreToVDomTab6} from '@/tab6/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomTab4} from '@/tab4/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomNumber} from '@/numberNotation/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomStandard} from '@/standardStaff/render/musicScoreToVDom'
import type {Tab6SkinPack, NumberNotationSkinPack, SkinPack, StandardStaffSkinPack} from '@/types/common'

export type MusicScoreToVDomFn = typeof musicScoreToVDomStandard

export type NotationSkinPack =
  | StandardStaffSkinPack
  | NumberNotationSkinPack
  | Tab6SkinPack

const MUSIC_SCORE_TO_VDOM: Partial<Record<MusicScoreTypeEnum, MusicScoreToVDomFn>> = {
  [MusicScoreTypeEnum.StandardStaff]: musicScoreToVDomStandard,
  [MusicScoreTypeEnum.NumberNotation]: musicScoreToVDomNumber,
  [MusicScoreTypeEnum.Tab6]: musicScoreToVDomTab6,
  [MusicScoreTypeEnum.Tab4]: musicScoreToVDomTab4,
}

/** ??????? musicScoreToVDom ????????????? */
export function resolveMusicScoreToVDom(type: MusicScoreTypeEnum): MusicScoreToVDomFn {
  return MUSIC_SCORE_TO_VDOM[type] ?? musicScoreToVDomStandard
}

/** ? SkinPack ????????????? */
export function resolveNotationPack(
  pack: SkinPack,
  type: MusicScoreTypeEnum,
): NotationSkinPack | undefined {
  switch (type) {
    case MusicScoreTypeEnum.NumberNotation:
      return pack.numberNotation
    case MusicScoreTypeEnum.Tab6:
      return pack.tab6
    case MusicScoreTypeEnum.Tab4:
      return pack.tab4

    default:
      return pack.standardStaff
  }
}
