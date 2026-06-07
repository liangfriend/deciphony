import {AccidentalTypeEnum, ClefTypeEnum} from '@/index'

/** 与 play-util getNoteMidi 保持一致：自然音级（C..B）相对八度起点 C 的半音偏移 */
const DIATONIC_SEMITONES = [0, 2, 4, 5, 7, 9, 11]

/** 各谱号第一线下方锚点（startRegion 对应的自然音 = startMidi）。与 play-util CLEF_ANCHOR 一致 */
const CLEF_ANCHOR: Record<ClefTypeEnum, { startRegion: number; startMidi: number }> = {
    [ClefTypeEnum.Treble]: {startRegion: -2, startMidi: 60}, // 第一线下方 C4
    [ClefTypeEnum.Bass]: {startRegion: -4, startMidi: 36},   // 第一线下方 C2
    [ClefTypeEnum.Alto]: {startRegion: -3, startMidi: 48},   // 第一线下方 C3
    [ClefTypeEnum.Tenor]: {startRegion: -1, startMidi: 48},  // 第一线下方 C3
}

const ACC_OFFSET_MAP: Record<Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural>, number> = {
    [AccidentalTypeEnum.Flat]: -1,
    [AccidentalTypeEnum.Sharp]: 1,
    [AccidentalTypeEnum.Double_flat]: -2,
    [AccidentalTypeEnum.Double_sharp]: 2,
}

/**
 * 传入 midi、clef、accidental，返回 region（getNoteMidi 的反向）。
 *
 * 先扣除变音记号偏移得到自然音 midi，再按谱号锚点换算出五线谱位置 region。
 * 若扣除变音后不是自然音级（落在黑键上），说明 accidental 与 midi 不自洽，返回 null。
 */
export function getNoteRegion(
    clef: ClefTypeEnum,
    midi: number,
    accidental: Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null = null,
): number | null {
    const {startRegion, startMidi} = CLEF_ANCHOR[clef]
    const accOffset = accidental ? ACC_OFFSET_MAP[accidental] : 0
    // 自然音相对锚点 C 的半音数
    const baseMidi = midi - accOffset - startMidi
    const octave = Math.floor(baseMidi / 12)
    const semitone = baseMidi - octave * 12
    const remain = DIATONIC_SEMITONES.indexOf(semitone)
    if (remain < 0) return null
    return startRegion + octave * 7 + remain
}
