import {
  DoubleSlotAffiliatedSymbolNameEnum,
  mirrorPedalData,
  PedalTypeEnum,
  pedalVDomPatch,
  type DoubleSlotAffiliatedSymbol,
  type MusicScore,
  type PedalMirror,
  type SlotData,
  type VDom,
} from '@deciphony/renderer'
import {scoreWriteGateFor, type UpdateVDomFn} from './scoreWriteGate'
import {
  computeHorizontalHandlePoints,
  type HorizontalHandleKind,
  type HorizontalHandlePoints,
} from './renderEditHorizontalDrag'

export type {HorizontalHandleKind, HorizontalHandlePoints}

export type PedalDragSession = {
  pointerId: number
  symbolId: string
  handle: HorizontalHandleKind
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
  /** middle 拖拽起点的 svg y，配合初始 relative y 算整体平移 */
  originSvgY: number
  initialRelStartY: number
  initialRelEndY: number
}

export function isPedalVDom(vdom: VDom | null | undefined): boolean {
  return vdom?.tag === 'affiliation' && vdom.special?.pedal != null
}

export function isPedalSelected(
  selected: SlotData | null,
): selected is SlotData & { self: DoubleSlotAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && self.name === DoubleSlotAffiliatedSymbolNameEnum.Pedal
    && 'startId' in self
  )
}

export function findPedalSymbol(
  musicScore: MusicScore,
  symbolId: string,
): DoubleSlotAffiliatedSymbol | null {
  const sym = musicScore.affiliatedSymbols.find((item) => item.id === symbolId)
  if (!sym || sym.name !== DoubleSlotAffiliatedSymbolNameEnum.Pedal || !('startId' in sym)) {
    return null
  }
  return sym as DoubleSlotAffiliatedSymbol
}

function pt(p?: { x: number; y: number }): { x: number; y: number } {
  return {x: p?.x ?? 0, y: p?.y ?? 0}
}

function clonePedal(pedal: NonNullable<VDom['special']['pedal']>): PedalMirror {
  return {
    ...pedal,
    relativeStartPoint: pt(pedal.relativeStartPoint),
    relativeEndPoint: pt(pedal.relativeEndPoint),
  }
}

function samePoint(a?: { x: number; y: number }, b?: { x: number; y: number }): boolean {
  return (a?.x ?? 0) === (b?.x ?? 0) && (a?.y ?? 0) === (b?.y ?? 0)
}

function samePedal(a: PedalMirror, b: PedalMirror): boolean {
  return samePoint(a.relativeStartPoint, b.relativeStartPoint)
    && samePoint(a.relativeEndPoint, b.relativeEndPoint)
    && a.type === b.type
}

function computeBaseAnchors(vdom: VDom): {
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
} {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const pedal = vdom.special?.pedal
  const relStart = pt(pedal?.relativeStartPoint)
  const relEnd = pt(pedal?.relativeEndPoint)
  return {
    baseStart: {x: s.x - relStart.x, y: s.y - relStart.y},
    baseEnd: {x: e.x - relEnd.x, y: e.y - relEnd.y},
  }
}

export function createPedalDragSession(
  event: PointerEvent,
  symbolId: string,
  handle: HorizontalHandleKind,
  vdom: VDom,
  svgY: number,
): PedalDragSession {
  const {baseStart, baseEnd} = computeBaseAnchors(vdom)
  const pedal = vdom.special?.pedal
  return {
    pointerId: event.pointerId,
    symbolId,
    handle,
    baseStart,
    baseEnd,
    originSvgY: svgY,
    initialRelStartY: pedal?.relativeStartPoint?.y ?? 0,
    initialRelEndY: pedal?.relativeEndPoint?.y ?? 0,
  }
}

export function computePedalHandlePoints(vdom: VDom): HorizontalHandlePoints | null {
  if (!isPedalVDom(vdom)) return null
  return computeHorizontalHandlePoints(vdom)
}

export function nextPedalGeomFromPointer(
  session: PedalDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): PedalMirror | null {
  const prev = vdom.special?.pedal
  if (!prev) return null
  const next = clonePedal(prev)

  if (session.handle === 'start') {
    next.relativeStartPoint = {
      x: svgX - session.baseStart.x,
      y: next.relativeStartPoint.y,
    }
    return next
  }

  if (session.handle === 'end') {
    next.relativeEndPoint = {
      x: svgX - session.baseEnd.x,
      y: next.relativeEndPoint.y,
    }
    return next
  }

  const dy = svgY - session.originSvgY
  next.relativeStartPoint = {
    x: next.relativeStartPoint.x,
    y: session.initialRelStartY + dy,
  }
  next.relativeEndPoint = {
    x: next.relativeEndPoint.x,
    y: session.initialRelEndY + dy,
  }
  return next
}

function commitPedalGeom(musicScore: MusicScore, symbolId: string, geom: PedalMirror) {
  const sym = findPedalSymbol(musicScore, symbolId)
  if (!sym) return
  const current = sym.data.pedal
  if (current && samePedal(clonePedal(current), geom)) return
  sym.data.pedal = {
    relativeStartPoint: pt(geom.relativeStartPoint),
    relativeEndPoint: pt(geom.relativeEndPoint),
    type: geom.type ?? current?.type ?? PedalTypeEnum.Normal,
  }
}

/**
 * 拖踏板：立刻 updateVDom；把手由返回值覆盖。
 * musicScore.data.pedal 防抖落盘。
 */
export function previewPedalDrag(
  musicScore: MusicScore,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  session: PedalDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): HorizontalHandlePoints | null {
  const geom = nextPedalGeomFromPointer(session, vdom, svgX, svgY)
  if (!geom) return null
  const patch = pedalVDomPatch(vdom, geom)
  if (!patch) return null
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `pedal:${session.symbolId}:geom`,
    mirror: {targetId: session.symbolId, patch},
    commit: () => commitPedalGeom(musicScore, session.symbolId, geom),
  })
  const previewed = mirrorPedalData([vdom], session.symbolId, geom)[0]
  return previewed ? computePedalHandlePoints(previewed) : null
}
