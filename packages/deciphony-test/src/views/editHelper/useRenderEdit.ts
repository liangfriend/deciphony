import {isFretboardScoreType, MusicScoreTypeEnum, primaryStaffType} from '@deciphony/renderer'
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

/** 按第一个单谱表的谱种分发编辑控制器。总谱里谱种不同时，编辑仍跟第一条谱表。 */
export function useRenderEdit(
  musicScore: MusicScore,
  options?: {musicScoreRef?: Ref<MusicScoreComponentExpose | null>},
): RenderEditController {
  const notation = primaryStaffType(musicScore)
  if (isFretboardScoreType(notation)) {
    return Object.assign(useTabRenderEdit(musicScore, options), {addDrumState: unusedDrumState()})
  }
  if (notation === MusicScoreTypeEnum.DrumNotation) {
    const api = useDrumRenderEdit(musicScore, options)
    return Object.assign(api, {addTabState: unusedTabState(), stringCount: 0}) as unknown as RenderEditController
  }
  const api = notation === MusicScoreTypeEnum.NumberNotation
    ? useNumberNotationRenderEdit(musicScore, options)
    : useStandardStaffRenderEdit(musicScore, options)
  return Object.assign(api, {addTabState: unusedTabState(), addDrumState: unusedDrumState()}) as RenderEditController
}
