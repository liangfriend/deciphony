import { storeToRefs } from 'pinia'
import { enginePinia } from '@/store/pinia'
import { useGameStore } from '@/store/useGameStore'

export function useGame() {
  const store = useGameStore(enginePinia)
  const {
    curCaptionId,
    curSceneId,
    curDialogueId,
    viewerNodeMap,
    viewerNodeGroups,
    viewerKeys,
    viewerCurtainNodeMap
  } = storeToRefs(store)
  return {
    curCaptionId,
    curSceneId,
    curDialogueId,
    viewerNodeMap,
    viewerNodeGroups,
    viewerKeys,
    viewerCurtainNodeMap,
    doAction: store.doAction,
    startCaption: store.startCaption,
    startDialogue: store.startDialogue,
    startScene: store.startScene,
    addViewerNodeMap: store.addViewerNodeMap,
    removeViewerNodeMap: store.removeViewerNodeMap
  }
}
