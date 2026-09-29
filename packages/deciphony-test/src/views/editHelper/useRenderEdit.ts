import {MusicScoreTypeEnum} from '@deciphony/renderer'
import type {MusicScore} from '@deciphony/renderer'
import type {Ref} from 'vue'
import {ref} from 'vue'
import {useNumberNotationRenderEdit, type MusicScoreComponentExpose} from './numberNotation/useRenderEdit'
import {useStandardStaffRenderEdit} from './standardStaff/useRenderEdit'
import {useTabRenderEdit} from './tab/useRenderEdit'
import {useDrumRenderEdit} from './drumNotation/useRenderEdit'
import {DEFAULT_ADD_TAB_STATE} from './tab/renderEditTabAddState'
import {DEFAULT_ADD_DRUM_STATE, type AddDrumState} from './drumNotation/renderEditDrumAddState'

export type {MusicScoreComponentExpose}

function unusedTabState() {
  return ref({...DEFAULT_ADD_TAB_STATE})
}

function unusedDrumState() {
  return ref<AddDrumState>({...DEFAULT_ADD_DRUM_STATE})
}

export type RenderEditController = ReturnType<typeof useTabRenderEdit> & {addDrumState: Ref<AddDrumState>}

/** 按曲谱类型分发到五线谱、简谱、吉他/尤克里里或鼓谱编辑控制器 */
export function useRenderEdit(
  musicScore: MusicScore,
  options?: {musicScoreRef?: Ref<MusicScoreComponentExpose | null>},
): RenderEditController {
  if (musicScore.type === MusicScoreTypeEnum.Tab4 || musicScore.type === MusicScoreTypeEnum.Tab6) {
    return Object.assign(useTabRenderEdit(musicScore, options), {addDrumState: unusedDrumState()})
  }
  if (musicScore.type === MusicScoreTypeEnum.DrumNotation) {
    const api = useDrumRenderEdit(musicScore, options)
    return Object.assign(api, {addTabState: unusedTabState(), stringCount: 0}) as unknown as RenderEditController
  }
  const api = musicScore.type === MusicScoreTypeEnum.NumberNotation
    ? useNumberNotationRenderEdit(musicScore, options)
    : useStandardStaffRenderEdit(musicScore, options)
  return Object.assign(api, {addTabState: unusedTabState(), addDrumState: unusedDrumState()}) as RenderEditController
}
