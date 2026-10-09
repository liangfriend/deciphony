/**
 * 渲染相关常量
 */

/** 变音符号与音符头之间的默认间距（与 measureHeight 的比值） */
export const ACCIDENTAL_NOTE_GAP = 0 / 8;
/** 音符前谱号与音符头的间距（与 measureHeight 的比值） */
export const CLEF_NOTE_GAP_RATIO = 0 / 16;
/** 附点符号与音符头之间的默认间距（与 measureHeight 的比值） */
export const AUGMENTATION_DOT_GAP = 1 / 16;
/** 一节高度（一线或一间的距离）比例 */
export const LINE_SPACING_RATIO = 1 / 8;
/** 符杠最大倾斜角度（度） */
export const BEAM_MAX_SLOPE_DEG = 15;
/** 最小符干高度相对小节高度的比例 */
export const MIN_STEM_HEIGHT_RATIO = 7 / 8;
/**
 * 带符尾时：在基础符干上，每多一层钩额外加长（单位：间高 = 2×LINE_SPACING）。
 * 八分=1 层不加；十六分起每层约 0.75 间高。
 */
export const STEM_EXTRA_PER_FLAG_SPACES = 0.75;
/** 符尾底端与符头之间的最小间隙（单位：间高） */
export const STEM_FLAG_HEAD_CLEARANCE_SPACES = 0.25;
/** 符杠单线粗细比例 */
export const BEAM_THICKNESS = 2 / 16;
/** 符杠多条线之间的空隙比例 */
export const BEAM_LINE_SPACING = 2 / 32;
/** 符杠非全连时从 centerX 向两侧的缩放值，0.5 表示左右各收缩一半 */
export const BEAM_PARTIAL_SCALE = 0.5;
/** 符干 y 值偏移量 */
export const STEM_Y_OFFSET = 0.05;
