/** 歌词行与行之间的垂直间距（像素，相对 g-d 插槽） */
export const LYRICS_ROW_GAP = 22

/** 歌词区顶部内边距 */
export const LYRICS_PAD_TOP = 6

/** 歌词区底部内边距 */
export const LYRICS_PAD_BOTTOM = 8

/** 编辑态最少展示行数（无歌词时也能输入） */
export const LYRICS_EDIT_MIN_ROWS = 1

/** 单行输入框大致高度，用于 foreignObject */
export const LYRICS_INPUT_H = 18

/** 行号（1. 2.）相对 g-d 左缘的 x */
export const LYRICS_ROW_INDEX_X = 8

/** 用于对齐的音符类 vDom tag */
export const LYRICS_NOTE_TAGS = new Set([
  'noteHead',
  'noteNumber',
  'rest',
  'tabNoteNumber',
])
