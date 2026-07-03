/** 与 chord.vue 默认 props 一致，曲谱内实际尺寸 */
export const CHORD_DEFAULTS = {
  width: 50,
  height: 60,
  textSize: 10,
  nameSize: 32,
  fretCount: 5,
  stringCount: 6,
} as const

/** 编辑页预览放大倍数（仅影响展示，不写入 JSON） */
export const CHORD_PREVIEW_SCALE_DEFAULT = 4
