/** 不参与 dr 点击/hover 的 vDom 标签 */
export const EXCLUDED_INTERACTION_TAGS = new Set(['slot', 'space', 'noteStem', 'noteTail'])

export const HIGHLIGHT_CLASS = {
    hover: 'dr-hover-highlight',
    selected: 'dr-selected-highlight',
    /** 选中附属符号时，关联的小节 / 音符头等 DOM */
    related: 'dr-related-highlight',
} as const
