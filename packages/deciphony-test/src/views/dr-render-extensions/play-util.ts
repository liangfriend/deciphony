import {AccidentalTypeEnum, ClefTypeEnum, KeySignatureTypeEnum, MusicScore} from "deciphony-renderer";

export type Unit256 = number; // 区分普通number, 这个表示 256=全音符 128=二分 64=四分 32=八分 16=十六分 ...这种形式的单位
type DR_playSequence_item = {
  note_id: string;
  midi: number;
  duration: Unit256; // 持续时值（256=全音符 128=二分 64=四分 32=八分 …）
  playTime: Unit256; // 开始播放位置（同 duration 单位）
}
type DR_playSequence = Array<DR_playSequence_item>

/**
 * musicScore转可播放序列
 */
export function getDrPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  // 当前调号
  let curKeySignature = KeySignatureTypeEnum.C
  // 当前谱号
  let curClef = ClefTypeEnum.Treble
  for (let gi in musicScoreData.grandStaffs) {
    const grandStaff = musicScoreData.grandStaffs[gi];
    for (let si in grandStaff.staves) {
      const stave = grandStaff.staves[si];
      for (let mi in stave.measures) {
        const measure = stave.measures[mi];
        if (measure.keySignature_f) {
          curKeySignature = measure.keySignature_f.type
        }
        if (measure.clef_f) {
          curClef = measure.clef_f.type
        }

      }
    }
  }
  return []
}

/**
 * 计算midi
 * 计算要使用最终的变音符号，natural就等于没有变音符号
 */
function getNoteMidi(clef: ClefTypeEnum, region: number, accidental: Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null = null): number {
  // region 偏移表：一个八度内 do-re-mi-fa-sol-la-si（以 C=do 为 0）的半音偏移
  const rule = [0, 2, 4, 5, 7, 9, 11]
  // 变音偏移表
  const acc_offset_map: Record<Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural>, number> = {
    [AccidentalTypeEnum.Flat]: -1,
    [AccidentalTypeEnum.Sharp]: 1,
    [AccidentalTypeEnum.Double_flat]: -2,
    [AccidentalTypeEnum.Double_sharp]: 2,
  }
  // 各谱号锚点：startRegion 对应某个 C（do），startMidi 为该 C 的 midi
  const map: Record<ClefTypeEnum, { startRegion: number; startMidi: number }> = {
    [ClefTypeEnum.Treble]: {startRegion: -2, startMidi: 60}, // 第一线下方 C4
    [ClefTypeEnum.Bass]: {startRegion: -4, startMidi: 36},   // 第一线下方 C2
    [ClefTypeEnum.Alto]: {startRegion: -3, startMidi: 48},   // 第一线下方 C3
    [ClefTypeEnum.Tenor]: {startRegion: -1, startMidi: 48},  // 第一线下方 C3
  }
  const {startRegion, startMidi} = map[clef]
  // region 是按线/间逐级递增的“级进”，7 级 = 1 个八度 = 12 个半音
  const steps = region - startRegion
  const multiple = Math.floor(steps / 7)
  const remain = ((steps % 7) + 7) % 7 // 归一化，兼容 region 低于 startRegion 的情况
  const accOffset = accidental ? acc_offset_map[accidental] : 0
  return multiple * 12 + rule[remain] + accOffset + startMidi
}