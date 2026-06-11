import { ref } from 'vue'
import { defineStore } from 'pinia'
import { AudioNodePlayer } from '../types'
import { NodeEnum } from '../enum'
import { useAudioNodePlayer } from '../composables/useAudioNodePlayer'
import { enginePinia } from './pinia'
import { useNodeManagerStore } from './useNodeManagerStore'

export const useAudioManagerStore = defineStore('audioManager', () => {
  const audioNodePlayerMap = ref(new Map<number, AudioNodePlayer>())

  function initAudioNodePlayers() {
    audioNodePlayerMap.value.clear()
    const nodeManagerStore = useNodeManagerStore(enginePinia)
    nodeManagerStore.nodeMap.forEach((node) => {
      if (node.nodeType === NodeEnum.Audio) {
        const player = useAudioNodePlayer(node)
        audioNodePlayerMap.value.set(node.id, player)
      }
    })
  }

  function play(nodeId: number, delay: number = 0) {
    const player = audioNodePlayerMap.value.get(nodeId)
    setTimeout(() => {
      player?.play()
    }, delay)
  }

  function stop(nodeId: number) {
    const player = audioNodePlayerMap.value.get(nodeId)
    player?.stop()
  }

  function destory(nodeId: number) {
    const player = audioNodePlayerMap.value.get(nodeId)
    // TODO 后续更新deciphony-player destory方法
    player?.stop()
  }

  return {
    audioNodePlayerMap,
    initAudioNodePlayers,
    play,
    stop,
    destory
  }
})
