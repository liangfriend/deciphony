/**
 * 渲染相关常量
 */

/** 附点符号与音符头之间的默认间距（与 measureHeight 的比值） */
export const AUGMENTATION_DOT_GAP = 1 / 16;
/** 一节高度（一线或一间的距离）比例 */
export const LINE_SPACING_RATIO = 1 / 8;
/** 符杠最大倾斜角度（度） */
export const BEAM_MAX_SLOPE_DEG = 15;
/** 最小符干高度相对小节高度的比例 */
export const MIN_STEM_HEIGHT_RATIO = 7 / 8;
/** 符杠单线粗细比例 */
export const BEAM_THICKNESS = 2 / 16;
/** 符杠多条线之间的空隙比例 */
export const BEAM_LINE_SPACING = 2 / 32;
/** 符杠非全连时从 centerX 向两侧的缩放值，0.5 表示左右各收缩一半 */
export const BEAM_PARTIAL_SCALE = 0.5;
/** Normal 音符头：符干端点相对音符头中心的 y 偏移（与 measureHeight 的比值） */
export const STEM_Y_OFFSET = 0.05;

/** 长休止符竖线高度（与 measureHeight 的比值）；横杠高度为竖线的一半 */
export const LONG_REST_HEIGHT_RATIO = 2 / 4;
/** 完整长休止符横杠长度（与 measureHeight 的比值） */
export const LONG_REST_COMPLETE_WIDTH_RATIO = 0.7;
/** 长休止符头：从音符区该比例处画到小节末尾 */
export const LONG_REST_HEAD_START_RATIO = 0.3;
/** 长休止符尾：从小节起点画到音符区该比例处 */
export const LONG_REST_TAIL_END_RATIO = 0.7;
/** 长休止符小节数：文字框高度（与 measureHeight 的比值） */
export const LONG_REST_NUMBER_HEIGHT_RATIO = 0.45;
/** 长休止符小节数：单个数字宽度（与文字框高度的比值） */
export const LONG_REST_NUMBER_DIGIT_WIDTH_RATIO = 0.6;
/** 长休止符小节数：文字框底边与小节顶部的间距（与 measureHeight 的比值） */
export const LONG_REST_NUMBER_GAP_RATIO = 0.2;
