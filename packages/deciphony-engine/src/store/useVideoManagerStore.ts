import {ref} from 'vue'
import {defineStore} from 'pinia'
import {VideoNodePlayer} from '../types'

export const useVideoManagerStore = defineStore('videoManager', () => {
  const videoNodePLayerMap = ref<Map<number, VideoNodePlayer>>(new Map())

  function addVideoNodePlayer(id: number, player: VideoNodePlayer) {
    videoNodePLayerMap.value.set(id, player)
  }

  function removeVideoNodePlayer(id: number) {
    videoNodePLayerMap.value.delete(id)
  }

  return {
    videoNodePLayerMap,
    addVideoNodePlayer,
    removeVideoNodePlayer
  }
})
