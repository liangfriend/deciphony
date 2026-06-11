import GameView from './game/game.vue'
import {Ref} from 'vue'
import {storeToRefs} from 'pinia'
import {enginePinia} from './store/pinia'
import {useGameStore} from './store/useGameStore'

export default GameView

export interface GameDataManager {
  gameData: Ref<string>
}

export function updateLoadedGameData(gameData: string) {
  useGameStore(enginePinia).updateLoadedGameData(gameData)
}

export function useGameData(): GameDataManager {
  const {gameData} = storeToRefs(useGameStore(enginePinia))
  return {gameData}
}

export * from './composables/useCaption'
export * from './composables/useVideoPlayer'
export * from './composables/useAudioNodePlayer'
// export * from './composables/useOperationHistory'
export * from './utils/execJS'
export * from './enum'
export type * from './types'
