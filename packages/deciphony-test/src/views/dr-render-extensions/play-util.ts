import {
  AccidentalTypeEnum,
  Chronaxie,
  ClefTypeEnum,
  KeySignatureTypeEnum,
  MusicScore,
  NoteSymbolTypeEnum,
  StaffSlot
} from "deciphony-renderer";

export type Unit256 = number; // 区分普通number, 这个表示 256=全音符 128=二分 64=四分 32=八分 16=十六分 ...这种形式的单位
type DR_playSequence_item = {
  note_id: string;
  midi: number;
  duration: Unit256; // 持续时值（256=全音符 128=二分 64=四分 32=八分 …）
  playTime: Unit256; // 开始播放位置（同 duration 单位）
}
type DR_playSequence = Array<DR_playSequence_item>

// 各谱号锚点：startRegion 对应某个 C（do），startMidi 为该 C 的 midi
const CLEF_ANCHOR: Record<ClefTypeEnum, { startRegion: number; startMidi: number }> = {
  [ClefTypeEnum.Treble]: {startRegion: -2, startMidi: 60}, // 第一线下方 C4
  [ClefTypeEnum.Bass]: {startRegion: -4, startMidi: 36},   // 第一线下方 C2
  [ClefTypeEnum.Alto]: {startRegion: -3, startMidi: 48},   // 第一线下方 C3
  [ClefTypeEnum.Tenor]: {startRegion: -1, startMidi: 48},  // 第一线下方 C3
}

// 以 C=do 为 0 的七个自然音级字母
const DIATONIC_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

/** clef + region → 自然音级（0=C,1=D,…6=B），region 是按线/间逐级递增的“级进”，7 级 = 1 个八度 */
function getDiatonicDegreeFromC(clef: ClefTypeEnum, region: number): number {
  const {startRegion} = CLEF_ANCHOR[clef]
  const steps = region - startRegion
  return ((steps % 7) + 7) % 7
}

/**
 * musicScore转可播放序列
 * - 复谱表（系统）在时间轴上顺序衔接；同一复谱表内各单谱表（声部）同时起奏
 * - 休止符也记录，midi = 0
 * - 音符无显式变音符号时，按当前调号推导
 */
export function getDrPlaySequence(musicScoreData: MusicScore): DR_playSequence {
  const seq: DR_playSequence = []
  // 当前调号 / 谱号（随小节更新，未变更时沿用到后续小节）
  let curKeySignature = KeySignatureTypeEnum.C
  let curClef = ClefTypeEnum.Treble
  // 各复谱表在全局时间轴上的起点
  let grandStaffStart: Unit256 = 0

  for (const grandStaff of musicScoreData.grandStaffs) {
    let grandStaffDuration: Unit256 = 0
    for (const stave of grandStaff.staves) {
      // 同一复谱表内的各单谱表（声部）同时起奏
      let playTime: Unit256 = grandStaffStart
      for (const measure of stave.measures) {
        if (measure.keySignature_f) {
          curKeySignature = measure.keySignature_f.type
        }
        if (measure.clef_f) {
          curClef = measure.clef_f.type
        }
        for (const slot of measure.notes) {
          const s = slot as StaffSlot
          if (s.type === NoteSymbolTypeEnum.Rest) {
            const duration = getDuration(s.chronaxie, s.augmentationDot?.count ?? 0)
            seq.push({note_id: s.id, midi: 0, duration, playTime})
            playTime += duration
          } else if (s.type === NoteSymbolTypeEnum.Note) {
            // 和弦：各音同时起奏，时值取首音
            const lead = s.notesInfo[0]
            const duration = lead ? getDuration(lead.chronaxie, lead.augmentationDot?.count ?? 0) : 0
            for (const noteInfo of s.notesInfo) {
              const accidental = resolveAccidental(noteInfo.accidental?.type, curClef, curKeySignature, noteInfo.region)
              const midi = getNoteMidi(curClef, noteInfo.region, accidental)
              seq.push({note_id: noteInfo.id, midi, duration, playTime})
            }
            playTime += duration
          }
        }
      }
      grandStaffDuration = Math.max(grandStaffDuration, playTime - grandStaffStart)
    }
    grandStaffStart += grandStaffDuration
  }
  return seq.sort((a, b) => a.playTime - b.playTime)
}

/** 时值 + 附点 → 实际持续时值（1 附点 ×1.5，2 附点 ×1.75，3 附点 ×1.875） */
function getDuration(chronaxie: Chronaxie, dotCount: number): Unit256 {
  let total: number = chronaxie
  let add: number = chronaxie
  for (let i = 0; i < dotCount; i++) {
    add = add / 2
    total += add
  }
  return total
}

/** 解析音符最终生效的变音符号：显式优先（natural 视为无变音），否则按调号推导 */
function resolveAccidental(
  explicitType: AccidentalTypeEnum | undefined,
  clef: ClefTypeEnum,
  keySignature: KeySignatureTypeEnum,
  region: number,
): Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null {
  if (explicitType != null) {
    return explicitType === AccidentalTypeEnum.Natural
      ? null
      : (explicitType as Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural>)
  }
  return getKeySignatureAccidental(clef, keySignature, region)
}

// 升号添加顺序 / 降号添加顺序
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const

// 各调号的变音种类与数量
const KEY_ALTERATION: Record<KeySignatureTypeEnum, { kind: 'sharp' | 'flat'; count: number }> = {
  [KeySignatureTypeEnum.C]: {kind: 'sharp', count: 0},
  [KeySignatureTypeEnum.G]: {kind: 'sharp', count: 1},
  [KeySignatureTypeEnum.D]: {kind: 'sharp', count: 2},
  [KeySignatureTypeEnum.A]: {kind: 'sharp', count: 3},
  [KeySignatureTypeEnum.E]: {kind: 'sharp', count: 4},
  [KeySignatureTypeEnum.B]: {kind: 'sharp', count: 5},
  [KeySignatureTypeEnum.F_sharp]: {kind: 'sharp', count: 6},
  [KeySignatureTypeEnum.C_sharp]: {kind: 'sharp', count: 7},
  [KeySignatureTypeEnum.F]: {kind: 'flat', count: 1},
  [KeySignatureTypeEnum.B_flat]: {kind: 'flat', count: 2},
  [KeySignatureTypeEnum.E_flat]: {kind: 'flat', count: 3},
  [KeySignatureTypeEnum.A_flat]: {kind: 'flat', count: 4},
  [KeySignatureTypeEnum.D_flat]: {kind: 'flat', count: 5},
  [KeySignatureTypeEnum.G_flat]: {kind: 'flat', count: 6},
  [KeySignatureTypeEnum.C_flat]: {kind: 'flat', count: 7},
}

/**
 * 根据 clef + 调号 + region 推导该音的调号变音符号。
 * 命中调号中被升/降的音级时返回 Sharp / Flat，否则返回 null（自然音）。
 */
export function getKeySignatureAccidental(
  clef: ClefTypeEnum,
  keySignature: KeySignatureTypeEnum,
  region: number,
): Exclude<AccidentalTypeEnum, AccidentalTypeEnum.Natural> | null {
  const alteration = KEY_ALTERATION[keySignature]
  if (!alteration || alteration.count === 0) return null
  const letter = DIATONIC_LETTERS[getDiatonicDegreeFromC(clef, region)]
  const order = alteration.kind === 'sharp' ? SHARP_ORDER : FLAT_ORDER
  const altered = order.slice(0, alteration.count) as readonly string[]
  if (!altered.includes(letter)) return null
  return alteration.kind === 'sharp' ? AccidentalTypeEnum.Sharp : AccidentalTypeEnum.Flat
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
  const {startRegion, startMidi} = CLEF_ANCHOR[clef]
  // region 是按线/间逐级递增的“级进”，7 级 = 1 个八度 = 12 个半音
  const steps = region - startRegion
  const multiple = Math.floor(steps / 7)
  const remain = ((steps % 7) + 7) % 7 // 归一化，兼容 region 低于 startRegion 的情况
  const accOffset = accidental ? acc_offset_map[accidental] : 0
  return multiple * 12 + rule[remain] + accOffset + startMidi
}
