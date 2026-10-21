/** 歌词默认字号（px）；行距、输入框高度按与它的比例缩放 */
export const LYRICS_FONT_SIZE = 13

/** 歌词行与行之间的垂直间距（像素，相对 s-d 插槽；默认字号下） */
export const LYRICS_ROW_GAP = 22

/** 歌词区顶部内边距 */
export const LYRICS_PAD_TOP = 6

/** 歌词区底部内边距 */
export const LYRICS_PAD_BOTTOM = 8

/** 编辑态最少展示行数（无歌词时也能输入） */
export const LYRICS_EDIT_MIN_ROWS = 1

/** 单行输入框大致高度，用于 foreignObject（默认字号下） */
export const LYRICS_INPUT_H = 18

/** 按字号换算行距与输入框高度；默认字号时与 LYRICS_ROW_GAP / LYRICS_INPUT_H 一致 */
export function resolveLyricsMetrics(fontSize = LYRICS_FONT_SIZE) {
  const scale = fontSize / LYRICS_FONT_SIZE
  return {
    fontSize,
    rowGap: Math.round(LYRICS_ROW_GAP * scale),
    inputH: Math.round(LYRICS_INPUT_H * scale),
  }
}

/**
 * 编辑框默认字体（未传 fontFamily 时）：中文字体放最前。
 * 浏览器按光标所在字的字体定光标高度，空框用首个字体、打了中文用回退字体，首个字体不是中文字体时两者高度不一样。
 */
export const LYRICS_INPUT_FONT_FAMILY =
  '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif'

/** 行号（1. 2.）相对 s-d 左缘的 x */
export const LYRICS_ROW_INDEX_X = 8

/** 用于对齐的音符类 vDom tag（含吉他 / 尤克里里品格、琶音、扫弦） */
export const LYRICS_NOTE_TAGS = new Set([
  'noteHead',
  'noteNumber',
  'rest',
  'tabNoteNumber',
  'arpeggio',
  'strumming',
])
