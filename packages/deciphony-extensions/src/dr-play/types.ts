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
  /** 音色名（所在单谱表 data.instrumentValue，缺省为默认音色）；对应 NPlayer 的 toneColor。getDrPlaySequence 必填 */
  toneColor?: string
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
