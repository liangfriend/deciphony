import type {DrExtension, MusicScore, SlotConfig} from 'deciphony-renderer'
import type {Ref} from 'vue'
import {provide} from 'vue'
import type {MusicScoreComponentExpose} from './useRenderEdit'
import {useRenderEdit} from './useRenderEdit'
import {DR_EDIT_INJECTION_KEY} from './editInject'
import EditSlotGdButtons from './components/EditSlotGdButtons.vue'
import EditSlotSdButtons from './components/EditSlotSdButtons.vue'
import EditMeasureOverlay from './components/EditMeasureOverlay.vue'

export const EDIT_SLOT_CONFIG: SlotConfig = {
  'g-r': {w: 50},
  'g-l': {w: 50},
  'g-d': {h: 40},
  's-d': {h: 20},
}

export type {DrEditApi} from './editInject'
export {DR_EDIT_INJECTION_KEY} from './editInject'

/**
 * 编辑扩展：slotConfig / 插槽组件 / 事件都挂在 extension 上，随 :extensions 一次注入。
 * 侧栏、快捷键、连音线拖拽层仍用返回的 api。
 */
export function useDrEdit(
  musicScore: MusicScore,
  options?: {musicScoreRef?: Ref<MusicScoreComponentExpose | null>},
) {
  const api = useRenderEdit(musicScore, options)
  provide(DR_EDIT_INJECTION_KEY, api)

  const extension: DrExtension = {
    name: 'dr-edit',
    slotConfig: EDIT_SLOT_CONFIG,
    slots: {
      'g-d': EditSlotGdButtons,
      's-d': EditSlotSdButtons,
      m: EditMeasureOverlay,
    },
    on: {
      renderMusicScore: api.handleRenderMusicScore,
      'dr-click': api.handleDrClick,
      'dr-down': api.handleDrDown,
      'dr-enter': api.handleDrEnter,
      'dr-leave': api.handleDrLeave,
      'dr-up': api.handleDrUp,
      'top-move': api.handleTopMove,
      'top-up': api.handleTopUp,
    },
  }

  return {extension, ...api}
}
