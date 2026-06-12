import {enginePinia} from '../store/pinia'
import {useNodeManagerStore} from '../store/useNodeManagerStore'
import {useGameStore} from '../store/useGameStore'

export function runCode(code: string) {
  try {
    const nodeManagerStore = useNodeManagerStore(enginePinia)
    const gameStore = useGameStore(enginePinia)
    const fn = new Function(
      'nodeMap,gameData,extraData',
      `
      try {
        ${code}
      } catch(e) {
        return { error: e.message };
      }
    `
    )
    const gameDataObj = parseJS(gameStore.gameData)
    const extraDataObj = parseJS(gameStore.extraData)
    return fn(nodeManagerStore.nodeMap, gameDataObj, extraDataObj)
  } catch (e: any) {
    return e
  }
}

export function parseJS(str: string) {
  if (!str?.trim()) return {}
  const trimmed = str.trim()
  try {
    return new Function(`return (${trimmed})`)()
  } catch {
    try {
      // 兼容未包裹花括号的对象字面量片段，如 captionTextStyle
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return new Function(`return ({${trimmed}})`)()
      }
    } catch (e) {
      console.error('解析js失败', e)
    }
    return {}
  }
}
