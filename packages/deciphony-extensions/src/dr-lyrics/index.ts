import type {DrExtension, VDom} from '@deciphony/renderer'
import {reactive, shallowRef} from 'vue'
import LyricsSlot from './components/LyricsSlot.vue'
import {
  LYRICS_FONT_SIZE,
  LYRICS_PAD_BOTTOM,
  LYRICS_PAD_TOP,
  LYRICS_ROW_GAP,
} from './constants'
import type {DrLyricsOptions} from './types'

/** 扩展内默认 g-d 高度（约 4 行）；宿主可用页面 slotConfig 覆盖，不随歌词行数变化 */
function initialGdHeight() {
  return LYRICS_PAD_TOP + 4 * LYRICS_ROW_GAP + LYRICS_PAD_BOTTOM
}

/**
 * 歌词扩展：挂 g-d，按首个单谱表槽位对齐音符 x。
 * 展示行数 = max(各槽 lyrics.length)；编辑写入时自动补齐中间空项。
 * g-d 高度不随行数同步，由 slotConfig / 宿主常量控制。
 */
export function drLyrics(options: DrLyricsOptions = {}): DrExtension {
  const vDomList = shallowRef<VDom[]>([])
  const slotConfig = reactive({
    'g-d': {h: initialGdHeight()},
  })

  return {
    name: 'dr-lyrics',
    slotConfig,
    slots: {'g-d': LyricsSlot},
    props: () => ({
      mode: options.mode ?? 'show',
      showRowIndex: options.showRowIndex ?? false,
      fontSize: options.fontSize ?? LYRICS_FONT_SIZE,
      fontFamily: options.fontFamily,
      vDomList,
    }),
    on: {
      renderMusicScore(list) {
        vDomList.value = list
      },
    },
  }
}

export {default as LyricsSlot} from './components/LyricsSlot.vue'
export {
  LYRICS_EDIT_MIN_ROWS,
  LYRICS_FONT_SIZE,
  LYRICS_PAD_BOTTOM,
  LYRICS_PAD_TOP,
  LYRICS_ROW_GAP,
  resolveLyricsMetrics,
} from './constants'
export {
  addLyricRow,
  collectStaffSlots,
  emptyLyrics,
  getLyricsStaff,
  maxLyricsRowCount,
  readSlotLyricLine,
  removeLyricRow,
  writeSlotLyricLine,
} from './lyricsFields'
export type {DrLyricsOptions, LyricsMode} from './types'
