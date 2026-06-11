import { storeToRefs } from 'pinia'
import { enginePinia } from '@/store/pinia'
import { useAudioManagerStore } from '@/store/useAudioManagerStore'

export function useAudioManager() {
  const store = useAudioManagerStore(enginePinia)
  const { audioNodePlayerMap } = storeToRefs(store)
  return {
    audioNodePlayerMap,
    play: store.play,
    stop: store.stop,
    destory: store.destory
  }
}
