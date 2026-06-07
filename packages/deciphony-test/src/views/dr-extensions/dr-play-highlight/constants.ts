/** 播放高亮 CSS 类（通过 filter 着色，不直接改 SVG 内部 fill，换肤兼容） */
export const PLAY_HIGHLIGHT_CLASS = 'dr-play-highlight'

/** 同一音符 id 可能对应多个顶层 vDom（符头 / 符干 / 符尾 / 休止符） */
export const NOTE_PART_TAGS = new Set(['noteHead', 'noteStem', 'noteTail', 'rest'])
