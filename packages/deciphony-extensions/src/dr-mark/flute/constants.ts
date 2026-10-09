export const FLUTE_HOLE_R = 3.4
export const FLUTE_HOLE_GAP = 9
/** 指法图顶部留给超吹圆点的高度 */
export const FLUTE_REGISTER_H = 7
/** 圆角矩形外框内边距 / 圆角 */
export const FLUTE_FRAME_PAD = 3
export const FLUTE_FRAME_RADIUS = 4
export const FLUTE_FRAME_W = 2 * FLUTE_HOLE_R + 2 * FLUTE_FRAME_PAD + 2
/** 单个指法图高度（含外框，未缩放） */
export const FLUTE_FINGERING_H = FLUTE_REGISTER_H + 5 * FLUTE_HOLE_GAP + 2 * FLUTE_HOLE_R + 2 * FLUTE_FRAME_PAD
/** m-d 内上下留白 */
export const FLUTE_PAD_TOP = 6
export const FLUTE_PAD_BOTTOM = 4
export const FLUTE_SLOT_H = FLUTE_PAD_TOP + FLUTE_FINGERING_H + FLUTE_PAD_BOTTOM
