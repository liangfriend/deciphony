import type {DoubleMeasureAffiliatedSymbol, MusicScore, SlotData} from 'deciphony-renderer'

export type VoltaEditSlot = SlotData & {
  musicScore: MusicScore
  self: DoubleMeasureAffiliatedSymbol
}

export function setVoltaText(volta: DoubleMeasureAffiliatedSymbol, text: string): void {
  if (!volta.data.volta) return
  volta.data.volta.text = text
}

export function setVoltaValue(volta: DoubleMeasureAffiliatedSymbol, value: number[]): void {
  if (!volta.data.volta) return
  volta.data.volta.value = value.length > 0 ? value : [0]
}
