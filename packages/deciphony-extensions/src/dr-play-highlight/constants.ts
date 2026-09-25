/** 播放高亮 CSS 类（通过 filter 着色，不直接改 SVG 内部 fill，换肤兼容） */
export const PLAY_HIGHLIGHT_CLASS = 'dr-play-highlight'

/**
 * 同一音符 id 可能对应多个顶层 vDom：
 * - 五线：符头 / 符干 / 符尾 / 休止符
 * - 简谱：数字 / 加时线 / 休止符（减时线、八度点在渲染里 tag 为 accidental，一并纳入）
 * - 吉他 / 尤克里里：品格、琶音、扫弦；符干符尾与加时线沿用 noteStem / noteTail / addLine
 */
export const NOTE_PART_TAGS = new Set([
  'noteHead',
  'noteStem',
  'noteTail',
  'rest',
  'noteNumber',
  'addLine',
  'accidental',
  'tabNoteNumber',
  'arpeggio',
  'strumming',
])
