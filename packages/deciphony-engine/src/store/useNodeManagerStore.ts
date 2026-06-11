import { ref } from 'vue'
import { defineStore } from 'pinia'
import { EngineNode } from '../types'

export const useNodeManagerStore = defineStore('nodeManager', () => {
  const nodeMap = ref(new Map<number, EngineNode>())

  function loadNodes(nodes: EngineNode[]) {
    nodeMap.value.clear()
    nodes.forEach((node) => {
      nodeMap.value.set(node.id, node)
    })
  }

  function clearNodes() {
    nodeMap.value.clear()
  }

  return {
    nodeMap,
    loadNodes,
    clearNodes
  }
})
