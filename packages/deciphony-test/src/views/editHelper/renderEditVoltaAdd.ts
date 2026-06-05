import type {Measure, MusicScore, SingleStaff} from 'deciphony-renderer'
import {DoubleMeasureAffiliatedSymbolNameEnum} from 'deciphony-renderer'
import {createVolta} from '../dr-extensions/dr-edit/score-builder'
import {resolveVoltaMeasureIds} from './renderEditVoltaDrag'
import type {MeasureEditSlot} from './renderEditMeasureProperties'

/** volta 跨越的连续小节数（含当前小节） */
export type VoltaSpan = 1 | 2 | 3 | 4 | 5

export const VOLTA_SPAN_OPTIONS: VoltaSpan[] = [1, 2, 3, 4, 5]

/** 查找覆盖指定小节的 volta */
export function findVoltaAtMeasure(
  musicScore: MusicScore,
  measureId: string,
) {
  return musicScore.affiliatedSymbols.find(
    (sym) =>
      sym.name === DoubleMeasureAffiliatedSymbolNameEnum.Volta
      && sym.data?.volta
      && resolveVoltaMeasureIds(musicScore, sym).includes(measureId),
  )
}

function resolveMeasureAnchor(
  editSlot: MeasureEditSlot,
): {singleStaff: SingleStaff; measureIndex: number; startMeasure: Measure} | null {
  const {singleStaff, measure} = editSlot
  if (!singleStaff || !measure) return null

  const measureIndex = singleStaff.measures.indexOf(measure)
  if (measureIndex < 0) return null

  return {singleStaff, measureIndex, startMeasure: measure}
}

/** 以当前小节为起点向右添加 volta；跨度不足则失败 */
export function tryAddVoltaFromMeasure(editSlot: MeasureEditSlot, span: VoltaSpan): boolean {
  const anchor = resolveMeasureAnchor(editSlot)
  if (!anchor) return false

  const {singleStaff, measureIndex, startMeasure} = anchor
  const endIndex = measureIndex + span - 1
  if (endIndex >= singleStaff.measures.length) return false

  const musicScore = editSlot.musicScore
  for (let i = measureIndex; i <= endIndex; i += 1) {
    const measureId = singleStaff.measures[i]!.id
    if (findVoltaAtMeasure(musicScore, measureId)) return false
  }

  const endMeasure = singleStaff.measures[endIndex]!
  musicScore.affiliatedSymbols.push(
    createVolta({
      startId: startMeasure.id,
      endId: endMeasure.id,
      text: '1.',
      value: [0],
    }),
  )
  return true
}
