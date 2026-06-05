import {DoubleMeasureAffiliatedSymbolNameEnum} from 'deciphony-renderer'
import type {DoubleMeasureAffiliatedSymbol, MusicScore, SlotData, VDom} from 'deciphony-renderer'

export type VoltaHandleKind = 'left' | 'right' | 'center'

export type VoltaHandlePoints = {
  left: { x: number; y: number }
  right: { x: number; y: number }
  center: { x: number; y: number }
}

export type VoltaDragSession = {
  pointerId: number
  voltaId: string
  handle: VoltaHandleKind
  pointerStartX: number
  pointerStartY: number
  baseRelativeX: number
  baseRelativeY: number
  baseRelativeW: number
}

export function isVoltaVDom(vdom: VDom | null | undefined): boolean {
  return vdom?.tag === 'affiliation' && vdom.special?.volta != null
}

export function isVoltaSelected(
  selected: SlotData | null,
): selected is SlotData & { self: DoubleMeasureAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && self.name === DoubleMeasureAffiliatedSymbolNameEnum.Volta
    && 'startId' in self
  )
}

export function findVoltaSymbol(
  musicScore: MusicScore,
  voltaId: string,
): DoubleMeasureAffiliatedSymbol | null {
  const sym = musicScore.affiliatedSymbols.find((item) => item.id === voltaId)
  if (!sym || sym.name !== DoubleMeasureAffiliatedSymbolNameEnum.Volta) return null
  return sym
}

/** volta 覆盖的小节 id（起止小节在同一单谱表内，含两端） */
export function resolveVoltaMeasureIds(
  musicScore: MusicScore,
  volta: DoubleMeasureAffiliatedSymbol,
): string[] {
  const {startId, endId} = volta
  for (const grandStaff of musicScore.grandStaffs) {
    for (const singleStaff of grandStaff.staves) {
      const startIdx = singleStaff.measures.findIndex((m) => m.id === startId)
      const endIdx = singleStaff.measures.findIndex((m) => m.id === endId)
      if (startIdx >= 0 && endIdx >= 0) {
        const lo = Math.min(startIdx, endIdx)
        const hi = Math.max(startIdx, endIdx)
        return singleStaff.measures.slice(lo, hi + 1).map((m) => m.id)
      }
    }
  }
  const ids = new Set<string>()
  if (startId) ids.add(startId)
  if (endId) ids.add(endId)
  return [...ids]
}

export function computeVoltaHandlePoints(vdom: VDom): VoltaHandlePoints | null {
  if (!isVoltaVDom(vdom)) return null
  return {
    left: {x: vdom.x, y: vdom.y},
    right: {x: vdom.x + vdom.w, y: vdom.y},
    center: {x: vdom.x + vdom.w / 2, y: vdom.y},
  }
}

function ensureVoltaData(sym: DoubleMeasureAffiliatedSymbol) {
  if (!sym.data.volta) {
    sym.data.volta = {text: '1.', value: [0]}
  }
  return sym.data.volta
}

export function createVoltaDragSession(
  event: PointerEvent,
  voltaId: string,
  handle: VoltaHandleKind,
  sym: DoubleMeasureAffiliatedSymbol,
  svgX: number,
  svgY: number,
): VoltaDragSession {
  const volta = ensureVoltaData(sym)
  return {
    pointerId: event.pointerId,
    voltaId,
    handle,
    pointerStartX: svgX,
    pointerStartY: svgY,
    baseRelativeX: volta.relativeX ?? 0,
    baseRelativeY: volta.relativeY ?? 0,
    baseRelativeW: volta.relativeW ?? 0,
  }
}

export function updateVoltaDragFromPointer(
  session: VoltaDragSession,
  musicScore: MusicScore,
  svgX: number,
  svgY: number,
): boolean {
  const sym = findVoltaSymbol(musicScore, session.voltaId)
  if (!sym) return false
  const volta = ensureVoltaData(sym)
  const deltaX = svgX - session.pointerStartX
  const deltaY = svgY - session.pointerStartY

  if (session.handle === 'left') {
    volta.relativeX = session.baseRelativeX + deltaX
    volta.relativeW = session.baseRelativeW - deltaX
    return true
  }

  if (session.handle === 'right') {
    volta.relativeW = session.baseRelativeW + deltaX
    return true
  }

  volta.relativeY = session.baseRelativeY + deltaY
  return true
}
