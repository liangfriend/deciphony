import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Animateion } from '@/types'

export const useAnimateionStore = defineStore('animateion', () => {
  const animationMap = ref(new Map<number, Animateion>())

  function executeAnimation(id: number, animation: Animateion) {
    animationMap.value.set(id, animation)
  }

  return {
    animationMap,
    executeAnimation
  }
})
