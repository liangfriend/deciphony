import { storeToRefs } from 'pinia'
import { enginePinia } from '@/store/pinia'
import { useVideoManagerStore } from '@/store/useVideoManagerStore'

export function useVideoManager() {
  const store = useVideoManagerStore(enginePinia)
  const { videoNodePLayerMap } = storeToRefs(store)
  return {
    videoNodePLayerMap,
    addVideoNodePlayer: store.addVideoNodePlayer,
    removeVideoNodePlayer: store.removeVideoNodePlayer
  }
}
