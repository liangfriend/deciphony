import { storeToRefs } from 'pinia'
import { enginePinia } from '@/store/pinia'
import { useAnimateionStore } from '@/store/useAnimateionStore'

export function useAnimateion() {
  const store = useAnimateionStore(enginePinia)
  const { animationMap } = storeToRefs(store)
  return {
    animationMap,
    executeAnimation: store.executeAnimation
  }
}
