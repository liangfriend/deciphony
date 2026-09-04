import type {DrExtension, VDom} from 'deciphony-renderer'
import {reactive, ref, type MaybeRef} from 'vue'
import LyricsSlot from './components/LyricsSlot.vue'
import {
  LYRICS_EDIT_MIN_ROWS,
  LYRICS_PAD_BOTTOM,
  LYRICS_PAD_TOP,
  LYRICS_ROW_GAP,
} from './constants'
import type {LyricsMode} from './types'

function initialGdHeight() {
  return LYRICS_PAD_TOP + LYRICS_EDIT_MIN_ROWS * LYRICS_ROW_GAP + LYRICS_PAD_BOTTOM
}

/**
 * 歌词扩展：挂 g-d，按首个单谱表槽位对齐音符 x。
 * 展示行数 = max(各槽 lyrics.length)；编辑写入时自动补齐中间空项。
 */
export function drLyrics(options: {
  mode?: MaybeRef<LyricsMode>
  /** 最前方是否显示行号（1. 2.），默认 false */
  showRowIndex?: MaybeRef<boolean>
} = {}): DrExtension {
  const vDomList = ref<VDom[]>([])
  const slotConfig = reactive({
    'g-d': {h: initialGdHeight()},
  })

  function syncSlotHeight(h: number) {
    slotConfig['g-d'].h = h
  }

  return {
    name: 'dr-lyrics',
    slotConfig,
    slots: {'g-d': LyricsSlot},
    props: () => ({
      mode: options.mode ?? 'show',
      showRowIndex: options.showRowIndex ?? false,
      vDomList,
      syncSlotHeight,
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
  LYRICS_PAD_BOTTOM,
  LYRICS_PAD_TOP,
  LYRICS_ROW_GAP,
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
export type {LyricsMode} from './types'
