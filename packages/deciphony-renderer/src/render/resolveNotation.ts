import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import {musicScoreToVDom as musicScoreToVDomTab6} from '@/tab6/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomTab4} from '@/tab4/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomNumber} from '@/numberNotation/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomStandard} from '@/standardStaff/render/musicScoreToVDom'
import {musicScoreToVDom as musicScoreToVDomDrum} from '@/drumNotation/render/musicScoreToVDom'
import {defaultSkin} from '@/skins/defaultSkin'
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

/** 每次按 type 取当前 import 绑定，避免 HMR 后仍钉死旧 musicScoreToVDom 引用 */
export function resolveMusicScoreToVDom(type: MusicScoreTypeEnum): MusicScoreToVDomFn {
  switch (type) {
    case MusicScoreTypeEnum.NumberNotation:
      return musicScoreToVDomNumber
    case MusicScoreTypeEnum.Tab6:
      return musicScoreToVDomTab6
    case MusicScoreTypeEnum.Tab4:
      return musicScoreToVDomTab4
    case MusicScoreTypeEnum.DrumNotation:
      return musicScoreToVDomDrum
    case MusicScoreTypeEnum.StandardStaff:
    default:
      return musicScoreToVDomStandard
  }
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
    case MusicScoreTypeEnum.DrumNotation:
      return pack.drumNotation ?? defaultSkin.drumNotation
    default:
      return pack.standardStaff
  }
}
