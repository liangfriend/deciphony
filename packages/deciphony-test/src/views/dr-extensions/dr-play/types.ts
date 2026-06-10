import type {Chronaxie} from 'deciphony-renderer'

/** 256=whole, 128=half, 64=quarter, 32=eighth, 16=sixteenth */
export type Unit256 = number

export type DR_playSequence_item = {
  note_id: string
  midi: number
  duration: Unit256
  playTime: Unit256
  /** 延音线（同音高 slur）时：首音=整段时值之和，其余=0；未设置则与 duration 同义 */
  real_duration?: Unit256
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
