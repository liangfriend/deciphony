import {MusicScoreTypeEnum} from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import type {Ref} from 'vue'
import {useNumberNotationRenderEdit, type MusicScoreComponentExpose} from './numberNotation/useRenderEdit'
import {useStandardStaffRenderEdit} from './standardStaff/useRenderEdit'

export type {MusicScoreComponentExpose}

/** 按曲谱类型分发到五线谱或简谱编辑控制器 */
export function useRenderEdit(
  musicScore: MusicScore,
  options?: {musicScoreRef?: Ref<MusicScoreComponentExpose | null>},
) {
  if (musicScore.type === MusicScoreTypeEnum.NumberNotation) {
    return useNumberNotationRenderEdit(musicScore, options)
  }
  return useStandardStaffRenderEdit(musicScore, options)
}
