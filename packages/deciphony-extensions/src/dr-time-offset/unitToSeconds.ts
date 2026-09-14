import type {Chronaxie} from '@deciphony/renderer'
import {getDuration} from '../dr-play/types'
import {DEFAULT_BEAT_UNIT} from './constants'

/** Unit256 → 秒（与 play-highlight scheduler 一致） */
export function unit256ToSeconds(
  unit: number,
  bpm: number,
  beatUnit: number = DEFAULT_BEAT_UNIT,
): number {
  if (!bpm || bpm <= 0) return 0
  return (unit * beatUnit * 60) / (256 * bpm)
}

export function chronaxieToSeconds(
  chronaxie: Chronaxie,
  dotCount: number,
  bpm: number,
  beatUnit: number = DEFAULT_BEAT_UNIT,
): number {
  return unit256ToSeconds(getDuration(chronaxie, dotCount), bpm, beatUnit)
}
