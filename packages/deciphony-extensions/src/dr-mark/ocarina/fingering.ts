import type {OcarinaHolePattern, OcarinaKey, OcarinaMarkOptions, OcarinaModel} from '../types'

/** 各调陶笛 do 的音高 */
export const OCARINA_TONIC_MIDI: Record<OcarinaKey, number> = {
  AC: 72, // C5
  AF: 65, // F4
  AG: 67, // G4
  SC: 84, // C6
  SF: 77, // F5
  SG: 79, // G5
  BC: 60, // C4
}

/** 12 孔串 = 左手 4（食中无小）+ 右手 4（食中无小）+ 副孔 2（右食旁、右中旁）+ 拇指 2（左、右） */
const t = (left: string, right: string, subs: string, thumbs: string): OcarinaHolePattern => left + right + subs + thumbs

/**
 * 12 孔日式（键 = 相对 do 的半音数）。do = 8 主孔 + 双拇指全按、副孔开；
 * 依次抬右小 → 右无名 → 右中 → 右食 → 左无名 → 左中 → 左食 → 左拇 → 右拇，最后全开；
 * 两个副孔都按 = 低 la，只按右食副孔 = 低 #la，只按右中副孔 = 低 si。
 * 资料：https://sound.jp/suimin/fingering_e.htm，与 https://playsoloist.com/ocarina/finger-chart 一致。
 */
const TRANSVERSE12: Record<number, OcarinaHolePattern> = {
  [-3]: t('xxxx', 'xxxx', 'xx', 'xx'), // 低 la
  [-2]: t('xxxx', 'xxxx', 'xo', 'xx'), // 低 #la
  [-1]: t('xxxx', 'xxxx', 'ox', 'xx'), // 低 si
  0: t('xxxx', 'xxxx', 'oo', 'xx'), // do
  1: t('xxxx', 'xxxo', 'ox', 'xx'), // #do
  2: t('xxxx', 'xxxo', 'oo', 'xx'), // re
  3: t('xxxx', 'xxox', 'oo', 'xx'), // #re
  4: t('xxxx', 'xxoo', 'oo', 'xx'), // mi
  5: t('xxxx', 'xooo', 'oo', 'xx'), // fa
  6: t('xxxx', 'ooxo', 'oo', 'xx'), // #fa
  7: t('xxxx', 'oooo', 'oo', 'xx'), // sol
  8: t('xxox', 'ooxo', 'oo', 'xx'), // #sol
  9: t('xxox', 'oooo', 'oo', 'xx'), // la
  10: t('xoox', 'ooxo', 'oo', 'xx'), // #la
  11: t('xoox', 'oooo', 'oo', 'xx'), // si
  12: t('ooox', 'oooo', 'oo', 'xx'), // 高 do
  13: t('ooox', 'ooxo', 'oo', 'ox'), // 高 #do
  14: t('ooox', 'oooo', 'oo', 'ox'), // 高 re
  15: t('oooo', 'oooo', 'oo', 'ox'), // 高 #re
  16: t('ooox', 'oooo', 'oo', 'oo'), // 高 mi
  17: t('oooo', 'oooo', 'oo', 'oo'), // 高 fa
}

/**
 * 4 孔英式吊坠，孔序：左食 左中 右食 右中。#fa / #sol / #la 资料只有图，暂缺。
 * 资料：https://folkfluteworld.com/Ocarina_Course_Pendants.pdf（do–fa、#do / #re 半孔），
 * https://www.reddit.com/r/Ocarina/comments/1i2i8ng/（完整开孔顺序）。
 */
const PENDANT4: Record<number, OcarinaHolePattern> = {
  0: 'xxxx', // do
  1: 'xxxh', // #do
  2: 'xxxo', // re
  3: 'xxhx', // #re
  4: 'xxox', // mi
  5: 'xxoo', // fa
  7: 'xoxo', // sol
  9: 'xooo', // la
  11: 'ooox', // si
  12: 'oooo', // 高 do
}

export const OCARINA_FINGERINGS: Record<OcarinaModel, Record<number, OcarinaHolePattern>> = {
  transverse12: TRANSVERSE12,
  pendant4: PENDANT4,
}

/** midi → 指法孔型；超出音域或资料里没有的音返回 null */
export function resolveOcarinaFingering(midi: number, options: OcarinaMarkOptions): OcarinaHolePattern | null {
  const offset = Math.round(midi) - OCARINA_TONIC_MIDI[options.key]
  return options.fingerings?.[offset] ?? OCARINA_FINGERINGS[options.model][offset] ?? null
}
