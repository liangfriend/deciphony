import {MusicScoreTypeEnum} from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import type {Ref} from 'vue'
import {ref} from 'vue'
import {useNumberNotationRenderEdit, type MusicScoreComponentExpose} from './numberNotation/useRenderEdit'
import {useStandardStaffRenderEdit} from './standardStaff/useRenderEdit'
import {useTabRenderEdit} from './tab/useRenderEdit'
import {DEFAULT_ADD_TAB_STATE} from './tab/renderEditTabAddState'

export type {MusicScoreComponentExpose}

function unusedTabState() {
  return ref({...DEFAULT_ADD_TAB_STATE})
}

export type RenderEditController = ReturnType<typeof useTabRenderEdit>

/** 按曲谱类型分发到五线谱、简谱或吉他/尤克里里编辑控制器 */
export function useRenderEdit(
  musicScore: MusicScore,
  options?: {musicScoreRef?: Ref<MusicScoreComponentExpose | null>},
): RenderEditController {
  if (musicScore.type === MusicScoreTypeEnum.Tab4 || musicScore.type === MusicScoreTypeEnum.Tab6) {
    return useTabRenderEdit(musicScore, options)
  }
  const api = musicScore.type === MusicScoreTypeEnum.NumberNotation
    ? useNumberNotationRenderEdit(musicScore, options)
    : useStandardStaffRenderEdit(musicScore, options)
  return Object.assign(api, {addTabState: unusedTabState()}) as RenderEditController
}
