import {
  primaryStaffType,
  resolveStaffType,
  type MusicScoreTypeEnum,
  type SlotData,
} from '@deciphony/renderer'

/** 选中落在某条单谱表上时用它的谱种，否则用曲谱里第一条单谱表。 */
export function selectionStaffType(selected: SlotData | null | undefined): MusicScoreTypeEnum | undefined {
  if (!selected) return undefined
  if (selected.singleStaff) return resolveStaffType(selected.singleStaff, selected.musicScore)
  return primaryStaffType(selected.musicScore)
}
