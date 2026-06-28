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
/** 符杠单线粗细比例（线谱一半） */
export const BEAM_THICKNESS = 1 / 32;
/** 符杠多条线之间的空隙比例（线谱一半） */
export const BEAM_LINE_SPACING = 1 / 16;
/** 符杠非全连时从 centerX 向两侧的缩放值，0.5 表示左右各收缩一半 */
export const BEAM_PARTIAL_SCALE = 0.5;
/** 吉他谱符干起点：锚点符头中心 y + ratio × measureHeight */
export const TAB_6_STEM_START_OFFSET_RATIO = 0.2;
/** 吉他谱符干终点（无符尾 / 四分及以上）：measureY + measureHeight + ratio × measureHeight */
export const TAB_6_STEM_END_OFFSET_RATIO = 0.4;
/** 吉他谱符干终点（八分及更短、有符尾）：同上公式，ratio = 1 */
export const TAB_6_STEM_END_OFFSET_RATIO_WITH_TAIL = 1;
/** 吉他谱和弦图：y = measureY - chordH - measureHeight × 该比例（框体左上角，位于小节顶线上方） */
export const TAB_6_CHORD_Y_OFFSET_RATIO = 0.4;
/** 推弦阶段1 默认高度（× measureHeight） */
export const TAB_6_BEND_PERIOD_ONE_HEIGHT_RATIO = 1;
/** 推弦阶段2 默认高度（× measureHeight） */
export const TAB_6_BEND_PERIOD_TWO_HEIGHT_RATIO = 0.25;
/** 推弦标注与箭头端点的垂直间距（× measureHeight，向上为负 y） */
export const TAB_6_BEND_TEXT_OFFSET_RATIO = 0.12;
/** 推弦线宽（× measureHeight，最小 1px） */
export const TAB_6_BEND_THICKNESS_RATIO = 1 / 32;
