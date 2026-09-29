import {DrumHeadTypeEnum} from '@deciphony/renderer'

/** 映射表 key：`${region}-${headType}`，region 与渲染一致（0 底线、1 第一间 … 8 顶线、10 上加一线） */
export type DrumPlayMapKey = `${number}-${DrumHeadTypeEnum}`

export type DrumPlayMapEntry = {
  /** 音色中的音频 key（NPlayer 按 midi 取 buffer） */
  midi: number
  /** 音量倍数（乘在当前音量上），默认 1 */
  volume?: number
}

export type DrumPlayMap = Partial<Record<DrumPlayMapKey, DrumPlayMapEntry>>

export function drumPlayMapKey(region: number, headType: DrumHeadTypeEnum): DrumPlayMapKey {
  return `${region}-${headType}`
}

/** 鬼音（ghost）音量倍数 */
export const DRUM_GHOST_VOLUME = 0.5
/** 重音（accent / marcato）音量倍数 */
export const DRUM_ACCENT_VOLUME = 1.3

const {Normal, Cross, CircledCross, CircledSlash, Triangle, Diamond} = DrumHeadTypeEnum

/**
 * 内置映射表，对应 `@deciphony/test/src/assets/toneColor/da-ji-yue.json`（音频 key 1–83）。
 * 线位参照常见架子鼓记谱：
 * - 上加一线 ×：强音镲；上加一线上方的间 ×：强音镲 2，⊗：中国镲
 * - 上方间：× 闭合踩镲 / ⊗ 开音踩镲 / ⊘ 半开踩镲 / ● 高音通鼓 / ▲ 牛铃
 * - 顶线：× 叮叮镲 / ◆ 叮叮镲帽
 * - 第四间 ● 通鼓 1；第四线 ● 通鼓 2；第三间 ● 军鼓、× 鼓边侧击、⊘ 军鼓边；第二间 ● 通鼓 3（落地通鼓）
 * - 第一间 ● 底鼓；下加一间 × / ● 脚踩踩镲
 */
export const DEFAULT_DRUM_PLAY_MAP: DrumPlayMap = {
  [drumPlayMapKey(11, Cross)]: {midi: 2}, // 强音镲 2
  [drumPlayMapKey(11, CircledCross)]: {midi: 30}, // 中国镲
  [drumPlayMapKey(10, Cross)]: {midi: 21}, // 强音镲 1（吊镲）
  [drumPlayMapKey(9, CircledCross)]: {midi: 32}, // 踩镲（开）
  [drumPlayMapKey(9, CircledSlash)]: {midi: 32, volume: 0.5}, // 踩镲半开：音色无半开，用开音减半
  [drumPlayMapKey(9, Cross)]: {midi: 31}, // 踩镲（合）
  [drumPlayMapKey(9, Normal)]: {midi: 45}, // 高音通鼓
  [drumPlayMapKey(9, Triangle)]: {midi: 57}, // 牛铃
  [drumPlayMapKey(8, Cross)]: {midi: 23}, // 叮叮镲
  [drumPlayMapKey(8, Diamond)]: {midi: 41}, // 叮叮镲帽
  [drumPlayMapKey(7, Normal)]: {midi: 20}, // 通鼓 1（中高通鼓）
  [drumPlayMapKey(6, Normal)]: {midi: 72}, // 通鼓 2（中筒鼓）
  [drumPlayMapKey(5, Normal)]: {midi: 52}, // 军鼓
  [drumPlayMapKey(5, Cross)]: {midi: 22}, // 鼓边侧击（cross stick）
  [drumPlayMapKey(5, CircledSlash)]: {midi: 51}, // 军鼓边（rim shot）
  [drumPlayMapKey(3, Normal)]: {midi: 40}, // 通鼓 3（落地 / 低筒鼓）
  [drumPlayMapKey(1, Normal)]: {midi: 39}, // 底鼓
  [drumPlayMapKey(-1, Cross)]: {midi: 8}, // 脚踩踩镲
  [drumPlayMapKey(-1, Normal)]: {midi: 8}, // 脚踩踩镲
}
