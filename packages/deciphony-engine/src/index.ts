import GameView from './game/game.vue'
import {Ref} from 'vue'
import {storeToRefs} from 'pinia'
import {enginePinia} from './store/pinia'
import {useGameStore} from './store/useGameStore'

export default GameView

export interface ExtraDataManager {
  extraData: Ref<string>
}

export function updateExtraData(extraData: string) {
  useGameStore(enginePinia).updateExtraData(extraData)
}

export function useExtraData(): ExtraDataManager {
  const {extraData} = storeToRefs(useGameStore(enginePinia))
  return {extraData}
}

export * from './composables/useCaption'
export * from './composables/useVideoPlayer'
export * from './composables/useAudioNodePlayer'
export * from './utils/execJS'
export * from './enum'
export type * from './types'
