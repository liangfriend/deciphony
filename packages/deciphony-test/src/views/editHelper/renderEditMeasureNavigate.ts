import type {GrandStaff, Measure, MusicScore, SingleStaff, SlotData} from '@deciphony/renderer'
import {isMeasureAddMode} from './standardStaff/renderEditSymbolAddAction'

export type MeasureNavDirection = 'up' | 'down' | 'left' | 'right'

type MeasurePath = {
  grandStaffIndex: number
  staffIndex: number
  measureIndex: number
  grandStaff: GrandStaff
  singleStaff: SingleStaff
  measure: Measure
}

function locateSelectedMeasure(selected: SlotData): MeasurePath | null {
  if (!isMeasureAddMode(selected)) return null
  const measure = selected.measure
  const musicScore = selected.musicScore
  for (let gi = 0; gi < musicScore.grandStaffs.length; gi++) {
    const grandStaff = musicScore.grandStaffs[gi]!
    for (let si = 0; si < grandStaff.staves.length; si++) {
      const singleStaff = grandStaff.staves[si]!
      const measureIndex = singleStaff.measures.findIndex((m) => m.id === measure.id)
      if (measureIndex < 0) continue
      return {
        grandStaffIndex: gi,
        staffIndex: si,
        measureIndex,
        grandStaff,
        singleStaff,
        measure,
      }
    }
  }
  return null
}

function slotFromPath(musicScore: MusicScore, path: MeasurePath): SlotData {
  return {
    musicScore,
    grandStaff: path.grandStaff,
    singleStaff: path.singleStaff,
    measure: path.measure,
    note: null,
    info: null,
    self: path.measure,
  }
}

/** 固定声部索引：按复谱表顺序展开该声部全部小节 */
function staffMeasureChain(musicScore: MusicScore, staffIndex: number): MeasurePath[] {
  const chain: MeasurePath[] = []
  for (let gi = 0; gi < musicScore.grandStaffs.length; gi++) {
    const grandStaff = musicScore.grandStaffs[gi]!
    const singleStaff = grandStaff.staves[staffIndex]
    if (!singleStaff) continue
    for (let mi = 0; mi < singleStaff.measures.length; mi++) {
      const measure = singleStaff.measures[mi]!
      chain.push({
        grandStaffIndex: gi,
        staffIndex,
        measureIndex: mi,
        grandStaff,
        singleStaff,
        measure,
      })
    }
  }
  return chain
}

/**
 * 解析小节选中态的邻接目标。
 * - up/down：同一复谱表内换声部，小节下标不变；越界或目标无该小节 → null
 * - left/right：同声部索引下跨复谱表串成链再前后移；无邻接 → null
 */
export function resolveNeighborMeasureSlot(
  selected: SlotData | null,
  direction: MeasureNavDirection,
): SlotData | null {
  if (!selected) return null
  const cur = locateSelectedMeasure(selected)
  if (!cur) return null
  const musicScore = selected.musicScore

  if (direction === 'up' || direction === 'down') {
    const nextStaffIndex = direction === 'up' ? cur.staffIndex - 1 : cur.staffIndex + 1
    const singleStaff = cur.grandStaff.staves[nextStaffIndex]
    const measure = singleStaff?.measures[cur.measureIndex]
    if (!singleStaff || !measure) return null
    return slotFromPath(musicScore, {
      grandStaffIndex: cur.grandStaffIndex,
      staffIndex: nextStaffIndex,
      measureIndex: cur.measureIndex,
      grandStaff: cur.grandStaff,
      singleStaff,
      measure,
    })
  }

  const chain = staffMeasureChain(musicScore, cur.staffIndex)
  const idx = chain.findIndex((p) => p.measure.id === cur.measure.id)
  if (idx < 0) return null
  const next = chain[direction === 'left' ? idx - 1 : idx + 1]
  if (!next) return null
  return slotFromPath(musicScore, next)
}
