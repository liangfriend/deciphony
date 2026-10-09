import type {Chronaxie} from '@deciphony/renderer'

/** 256=whole, 128=half, 64=quarter, 32=eighth, 16=sixteenth */
export type Unit256 = number

export type DR_playSequence_item = {
  note_id: string
  midi: number
  duration: Unit256
  playTime: Unit256
  /** 延音线（同音高 slur）时：首音=整段时值之和，其余=0；未设置则与 duration 同义 */
  real_duration?: Unit256
  /** 音量倍数（鼓谱映射表 / ghost / 重音），未设置视为 1；对应 NPlayer 的 velocity */
  volume?: number
  /**
   * 音色名（由 applyStaffToneColor 写入）。
   * 普通：singleStaff / 曲谱 data.instrumentValue；
   * 有 toneVariant 时优先 data[`instrumentValue_${toneVariant}`]。
   */
  toneColor?: string
  /**
   * 技巧音色后缀（不含前缀）。如 `'harmonic'` → 查 `instrumentValue_harmonic`。
   * 未设置则只走基础 `instrumentValue`。
   */
  toneVariant?: string
}

export type DR_playSequence = DR_playSequence_item[]

export function getDuration(chronaxie: Chronaxie, dotCount: number): Unit256 {
  let total: number = chronaxie
  let add: number = chronaxie
  for (let i = 0; i < dotCount; i++) {
    add = add / 2
    total += add
  }
  return total
}
