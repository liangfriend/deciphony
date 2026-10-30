import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import type {MusicScore, SingleStaff} from '@/types/MusicScoreType'

/**
 * 单谱表谱种。旧曲谱只在曲谱上写了 type、单谱表还没有 type 时，回落到那份旧字段。
 */
export function resolveStaffType(staff: SingleStaff, score?: MusicScore): MusicScoreTypeEnum {
  if (staff.type != null) return staff.type
  const legacy = (score as {type?: MusicScoreTypeEnum} | undefined)?.type
  return legacy ?? MusicScoreTypeEnum.StandardStaff
}

/**
 * 编辑器等仍按「整份曲谱一种谱」分发时用的谱种：取第一个单谱表。
 * 总谱里各单谱表类型不同，渲染和播放不要用这个，用单谱表自己的 type。
 */
export function primaryStaffType(score: MusicScore): MusicScoreTypeEnum {
  for (const grandStaff of score.grandStaffs ?? []) {
    const staff = grandStaff.staves?.[0]
    if (staff) return resolveStaffType(staff, score)
  }
  return resolveStaffType({} as SingleStaff, score)
}
