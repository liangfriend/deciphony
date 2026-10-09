import type {FluteFingering, FluteKey, FluteMarkOptions} from '../types'

/** 各调笛子的筒音（筒音作 5，即该调的 sol） */
export const FLUTE_TUBE_MIDI: Record<FluteKey, number> = {
  G: 62, // D4
  A: 64, // E4
  bB: 65, // F4
  C: 67, // G4
  D: 69, // A4
  E: 71, // B4
  F: 72, // C5
  highG: 74, // D5
}

/** 指法文档写法：6 位从左到右 = 离吹口近 → 远，0 闭 / 1 开 / 2 半开 */
const d = (digits: string, register: 0 | 1 | 2): FluteFingering => ({
  holes: [...digits].map((c) => (c === '0' ? 'x' : c === '1' ? 'o' : 'h')).join(''),
  register,
})

/**
 * 六孔笛指法表（键 = 相对筒音的半音数，以筒音作 5 记唱名），有替代指法的取第一种。
 * 资料：dr-mark/doc/笛指法.md（https://www.kbasm.com/apps/cn/music-flute-fingering-chart）。
 * 指法只和实际音高与筒音的距离有关，换成筒音作 2 / 作 1 只是唱名不同，不影响按孔。
 * register：低音缓吹 0 / 中音急吹 1 / 高音超吹 2。
 */
export const FLUTE_FINGERINGS: Record<number, FluteFingering> = {
  0: d('000000', 0), // 低音 5
  1: d('000002', 0), // 低音 #5
  2: d('000001', 0), // 低音 6
  3: d('000010', 0), // 低音 #6
  4: d('000011', 0), // 低音 7
  5: d('000111', 0), // 中音 1
  6: d('001011', 0), // 中音 #1
  7: d('001111', 0), // 中音 2
  8: d('010011', 0), // 中音 #2
  9: d('011111', 0), // 中音 3
  10: d('100111', 0), // 中音 4
  11: d('110101', 0), // 中音 #4
  12: d('100000', 1), // 中音 5
  13: d('000002', 1), // 中音 #5
  14: d('000001', 1), // 中音 6
  15: d('000010', 1), // 中音 #6
  16: d('000011', 1), // 中音 7
  17: d('000111', 1), // 高音 1
  18: d('001011', 1), // 高音 #1
  19: d('001111', 1), // 高音 2
  20: d('010111', 1), // 高音 #2
  21: d('011111', 1), // 高音 3
  22: d('100001', 1), // 高音 4
  23: d('111111', 1), // 高音 #4
  24: d('100000', 2), // 高音 5
  25: d('002002', 2), // 高音 #5
  26: d('001001', 2), // 高音 6
  27: d('021101', 2), // 高音 #6
  28: d('010010', 2), // 高音 7
  29: d('010110', 2), // 倍高音 1
  30: d('110111', 2), // 倍高音 #1
  31: d('100001', 2), // 倍高音 2
}

export const FLUTE_KEYS = Object.keys(FLUTE_TUBE_MIDI) as FluteKey[]

/** midi → 指法；超出音域返回 null */
export function resolveFluteFingering(midi: number, options: FluteMarkOptions): FluteFingering | null {
  const offset = Math.round(midi) - FLUTE_TUBE_MIDI[options.key]
  return options.fingerings?.[offset] ?? FLUTE_FINGERINGS[offset] ?? null
}
