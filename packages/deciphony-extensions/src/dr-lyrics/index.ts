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

/** 扩展内默认 s-d 高度（约 4 行）；宿主可用页面 slotConfig 覆盖，不随歌词行数变化 */
function initialLyricsSlotHeight() {
  return LYRICS_PAD_TOP + 4 * LYRICS_ROW_GAP + LYRICS_PAD_BOTTOM
}

/**
 * 歌词扩展：挂 s-d，每个单谱表下方画自己槽位的歌词，按音符 x 对齐。
 * 展示行数 = 该单谱表 max(各槽 lyrics.length)；编辑写入时自动补齐中间空项。
 * s-d 高度所有单谱表共用，不随行数同步，由 slotConfig / 宿主常量控制。
 */
export function drLyrics(options: DrLyricsOptions = {}): DrExtension {
  const vDomList = shallowRef<VDom[]>([])
  const slotConfig = reactive({
    's-d': {h: initialLyricsSlotHeight()},
  })

  return {
    name: 'dr-lyrics',
    slotConfig,
    slots: {'s-d': LyricsSlot},
    props: () => ({
      mode: options.mode ?? 'show',
      showRowIndex: options.showRowIndex ?? false,
      fontSize: options.fontSize ?? LYRICS_FONT_SIZE,
      fontFamily: options.fontFamily,
      activeLyrics: options.activeLyrics,
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
  clearLyricTexts,
  collectStaffSlots,
  emptyLyrics,
  getLyricsStaff,
  hasLyricText,
  lyricKey,
  maxLyricsRowCount,
  readSlotLyricLine,
  removeLyricRow,
  writeSlotLyricLine,
} from './lyricsFields'
export type {DrLyricsOptions, LyricsMode} from './types'
