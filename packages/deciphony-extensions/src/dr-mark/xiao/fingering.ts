import type {XiaoFingering, XiaoKey, XiaoMarkOptions, XiaoModel} from '../types'

/**
 * 各调箫的筒音（筒音作 5）：第三孔标调名，筒音在其下方纯四度。
 * 以 G 调（筒音 D4）为基准，其它调整体平移，取 G3–#F4 内；指法表按相对筒音的半音数通用于所有调。
 */
export const XIAO_TUBE_MIDI: Record<XiaoKey, number> = {
  C: 55, // G3
  bD: 56, // bA3
  D: 57, // A3
  bE: 58, // bB3
  E: 59, // B3
  F: 60, // C4
  bG: 61, // bD4
  G: 62, // D4
  bA: 63, // bE4
  A: 64, // E4
  bB: 65, // F4
  B: 66, // #F4
}

export const XIAO_KEYS = Object.keys(XIAO_TUBE_MIDI) as XiaoKey[]

/** holes 第 1 位 = 背孔，之后正面从上到下；register：低音缓吹 0 / 中音急吹 1 / 高音超吹 2 */
const f = (back: string, front: string, register: 0 | 1 | 2): XiaoFingering => ({holes: back + front, register})

/** 指法文档写法：8 位从左到右 = 第 8 孔（背）→ 第 1 孔，0 闭 / 1 开 / 2 半开 */
const d = (digits: string, register: 0 | 1 | 2): XiaoFingering => ({
  holes: [...digits].map((c) => (c === '0' ? 'x' : c === '1' ? 'o' : 'h')).join(''),
  register,
})

/**
 * 八孔箫（筒音作 5，键 = 相对筒音的半音数，G 调筒音 D4）。
 * 资料：dr-mark/doc/萧指法.md（G 调标准指法），有替代指法的取第一种。
 */
const HOLE8: Record<number, XiaoFingering> = {
  0: d('00000000', 0), // 低音 5
  1: d('00000002', 0), // 低音 #5
  2: d('00000001', 0), // 低音 6
  3: d('00000011', 0), // 低音 b7
  4: d('00000101', 0), // 低音 7
  5: d('00001101', 0), // 中音 1
  6: d('00021101', 0), // 中音 #1
  7: d('00011101', 0), // 中音 2
  8: d('00111101', 0), // 中音 #2
  9: d('01011101', 0), // 中音 3
  10: d('10001101', 0), // 中音 4
  11: d('11011101', 0), // 中音 #4
  12: d('00000000', 1), // 中音 5
  13: d('00000002', 1), // 中音 #5
  14: d('00000001', 1), // 中音 6
  15: d('00000011', 1), // 中音 b7
  16: d('00000101', 1), // 中音 7
  17: d('00001101', 1), // 高音 1
  18: d('00021101', 1), // 高音 #1
  19: d('00011101', 1), // 高音 2
  20: d('00111101', 1), // 高音 #2
  21: d('01011101', 1), // 高音 3
  22: d('21011101', 1), // 高音 4
  23: d('11011101', 1), // 高音 #4
  24: d('10001101', 2), // 高音 5
  25: d('00021100', 2), // 高音 #5
  26: d('00010001', 2), // 高音 6
  27: d('00111100', 2), // 高音 b7
  28: d('00100000', 2), // 高音 7
  29: d('01000100', 2), // 超高音 1
  30: d('11001000', 2), // 超高音 #1
  31: d('10000001', 2), // 超高音 2
  33: d('00110111', 2), // 超高音 3
  34: d('01001001', 2), // 超高音 4
}

/**
 * 六孔箫（筒音作 5）。正面串 = 从上到下 5 孔。资料只有自然音，有多种指法的取第一种。
 * 资料：http://donsiau.net/notedr.htm
 */
const HOLE6: Record<number, XiaoFingering> = {
  0: f('x', 'xxxxx', 0), // 低音 5
  2: f('x', 'xxxxo', 0), // 低音 6
  4: f('x', 'xxxoo', 0), // 低音 7
  5: f('x', 'xxooo', 0), // 中音 1
  7: f('x', 'xoooo', 0), // 中音 2
  9: f('x', 'ooooo', 0), // 中音 3
  10: f('o', 'xxooo', 0), // 中音 4
  12: f('o', 'xxxxx', 1), // 中音 5
  14: f('x', 'xxxxo', 1), // 中音 6
  16: f('x', 'xxxoo', 1), // 中音 7
  17: f('x', 'xxooo', 1), // 高音 1
  19: f('x', 'xoooo', 1), // 高音 2
  21: f('x', 'ooooo', 1), // 高音 3
  22: f('o', 'xoxxx', 1), // 高音 4
  24: f('o', 'xxxxx', 2), // 高音 5
  26: f('x', 'xooox', 2), // 高音 6
  28: f('x', 'xxxox', 2), // 高音 7
  29: f('x', 'oxxox', 2), // 超高音 1
  31: f('o', 'oxooo', 2), // 超高音 2
}

export const XIAO_FINGERINGS: Record<XiaoModel, Record<number, XiaoFingering>> = {
  hole8: HOLE8,
  hole6: HOLE6,
}

/** midi → 指法；超出音域或资料里没有的音返回 null */
export function resolveXiaoFingering(midi: number, options: XiaoMarkOptions): XiaoFingering | null {
  const offset = Math.round(midi) - XIAO_TUBE_MIDI[options.key]
  return options.fingerings?.[offset] ?? XIAO_FINGERINGS[options.model][offset] ?? null
}
