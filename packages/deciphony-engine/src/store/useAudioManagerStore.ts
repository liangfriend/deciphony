import { ref } from 'vue'
import { defineStore } from 'pinia'
import { AudioNodePlayer } from '@/types'
import { NodeEnum } from '@/enum'
import { useAudioNodePlayer } from '@/composables/useAudioNodePlayer'
import { useNodeManager } from '@/composables/useNodeManager'

export const useAudioManagerStore = defineStore('audioManager', () => {
  const audioNodePlayerMap = ref(new Map<number, AudioNodePlayer>())

  function initAudioNodePlayers() {
    const { nodeMap } = useNodeManager()
    nodeMap.value.forEach((node) => {
      if (node.nodeType === NodeEnum.Audio) {
        const player = useAudioNodePlayer(node)
        audioNodePlayerMap.value.set(node.id, player)
      }
    })
  }

  initAudioNodePlayers()

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
