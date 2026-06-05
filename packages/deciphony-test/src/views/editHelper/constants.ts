/** 不参与 dr 点击/hover 的 vDom 标签 */
export const EXCLUDED_INTERACTION_TAGS = new Set(['slot', 'space'])

export const HIGHLIGHT_CLASS = {
  hover: 'dr-hover-highlight',
  selected: 'dr-selected-highlight',
} as const
