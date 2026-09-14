/** 谱音同步：时间轴最长 10 分钟 */
export const MAX_SYNC_SECONDS = 600

/** 默认每秒像素 */
export const DEFAULT_PX_PER_SECOND = 80

/** 默认写入/读取的 slot.data 属性名 */
export const DEFAULT_TIME_PROP = 'banZouTime'

/** 展平谱表线间距（与 defaultSkin Measure.h=45 的四分间距一致） */
export const FLATTEN_LINE_GAP = 11.25

/** 符干固定长度（向上） */
export const FLATTEN_STEM_LENGTH = 32

/** 符头近似宽高 */
export const FLATTEN_HEAD_W = 12
export const FLATTEN_HEAD_H = 10

/** 单行谱表上下留白 */
export const FLATTEN_STAFF_PAD_Y = 28

/** 波形高度 */
export const WAVEFORM_HEIGHT = 80

/** 默认拍号分母对应的 beatUnit（四分音符为 1 拍） */
export const DEFAULT_BEAT_UNIT = 4
