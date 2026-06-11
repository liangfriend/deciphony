import { useNodeManager } from '@/composables/useNodeManager'
import { CSSProperties } from 'vue'
import { useGameData } from '@/composables/useGameData'

const { editorNodeMap } = useNodeManager()
const { gameData } = useGameData()

export function runCode(code: string) {
  try {
    // 提供一个沙盒逻辑，避免污染全局
    const fn = new Function(
      'editorNodeMap,gameData',
      `
      try {
        ${code}
      } catch(e) {
        return { error: e.message };
      }
    `
    )
    const data = parseJS(gameData.value)
    return fn(editorNodeMap.value, data)
  } catch (e: any) {
    return e
  }
}

export function parseJS(str: string) {
  try {
    return new Function(`return (${str})`)()
  } catch (e) {
    console.error('解析js失败', e)
    return {}
  }
}
