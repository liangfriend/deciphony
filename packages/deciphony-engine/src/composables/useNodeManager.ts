import {ref} from 'vue'
import {EngineNode} from '../types'

export function useNodeManager() {
  const nodeMap = ref < Map<number, EngineNode>(new Map())
  return {
    nodeMap,
  }
}