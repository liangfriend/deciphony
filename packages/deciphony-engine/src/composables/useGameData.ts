// 游戏数据

import { Ref, ref, watch } from 'vue'

export interface GameDataManager {
  gameData: Ref<string>
}

// 因为gameData要直接放进monacoEditor,所以这里直接保存字符串
function setup(data: string): GameDataManager {
  // 因为要保持游戏预览和编辑器两个页面的游戏数据是一样的，使用localStorage
  const gameData = ref(data)
  return { gameData }
}

// 用于编辑器
let res: GameDataManager | null = null

// 更新当前载入的游戏数据
export function updateLoadedGameData(gameData: string) {
  if (!res) {
    res = setup(gameData)
  } else {
    res.gameData.value = gameData
  }
}

export function useGameData(): GameDataManager {
  if (!res) {
    updateLoadedGameData('{}')
  }
  return res!
}
