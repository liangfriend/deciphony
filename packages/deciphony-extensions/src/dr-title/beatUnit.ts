/** bpm 基准拍：1=全音符 … 16=十六分（与 MusicScore.beatUnit 一致） */
export const BEAT_UNIT_OPTIONS = [
  {value: 1, label: '全音符', chronaxie: 256},
  {value: 2, label: '二分', chronaxie: 128},
  {value: 4, label: '四分', chronaxie: 64},
  {value: 8, label: '八分', chronaxie: 32},
  {value: 16, label: '十六分', chronaxie: 16},
] as const

export type BeatUnitValue = (typeof BEAT_UNIT_OPTIONS)[number]['value']

export function beatUnitToChronaxie(beatUnit: number): number {
  const hit = BEAT_UNIT_OPTIONS.find((o) => o.value === beatUnit)
  return hit?.chronaxie ?? 64
}

export function normalizeBeatUnit(raw: number | undefined): BeatUnitValue {
  const n = raw ?? 4
  if (n === 1 || n === 2 || n === 4 || n === 8 || n === 16) return n
  return 4
}

export function beatUnitLabel(beatUnit: number): string {
  return BEAT_UNIT_OPTIONS.find((o) => o.value === beatUnit)?.label ?? '四分'
}
