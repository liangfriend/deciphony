import {
  SingleSlotAffiliatedSymbolNameEnum,
  mirrorStrummingData,
  strummingVDomPatch,
  type MusicScore,
  type SingleSlotAffiliatedSymbol,
  type SlotData,
  type StrummingMirror,
  type VDom,
} from '@deciphony/renderer'
import {locateSlotAffiliatedSymbolById} from '@deciphony/extensions/dr-edit/score-builder/locate'
import {scoreWriteGateFor, type UpdateVDomFn} from './scoreWriteGate'
import {
  computeVerticalHandlePoints,
  type VerticalHandleKind,
  type VerticalHandlePoints,
} from './renderEditVerticalDrag'

export type {VerticalHandleKind, VerticalHandlePoints}

export type StrummingDragSession = {
  pointerId: number
  symbolId: string
  handle: VerticalHandleKind
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
  originSvgX: number
  initialRelStartX: number
  initialRelEndX: number
}

export function isStrummingVDom(vdom: VDom | null | undefined): boolean {
  return (
    (vdom?.tag === 'affiliation' || vdom?.tag === 'strumming')
    && vdom.special?.strumming != null
  )
}

/** 选中项是否为单 slot 附属扫弦 */
export function isStrummingSelected(
  selected: SlotData | null,
): selected is SlotData & { self: SingleSlotAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && String(self.name) === SingleSlotAffiliatedSymbolNameEnum.Strumming
  )
}

export function findStrummingSymbol(
  musicScore: MusicScore,
  symbolId: string,
): SingleSlotAffiliatedSymbol | null {
  const sym = locateSlotAffiliatedSymbolById(musicScore, symbolId)?.symbol
  return sym?.name === SingleSlotAffiliatedSymbolNameEnum.Strumming ? sym : null
}

function pt(p?: { x: number; y: number }): { x: number; y: number } {
  return {x: p?.x ?? 0, y: p?.y ?? 0}
}

function cloneStrumming(strum: NonNullable<VDom['special']['strumming']>): StrummingMirror {
  return {
    ...strum,
    relativeStartPoint: pt(strum.relativeStartPoint),
    relativeEndPoint: pt(strum.relativeEndPoint),
  }
}

function samePoint(a?: { x: number; y: number }, b?: { x: number; y: number }): boolean {
  return (a?.x ?? 0) === (b?.x ?? 0) && (a?.y ?? 0) === (b?.y ?? 0)
}

function sameStrumming(a: StrummingMirror, b: StrummingMirror): boolean {
  return samePoint(a.relativeStartPoint, b.relativeStartPoint)
    && samePoint(a.relativeEndPoint, b.relativeEndPoint)
    && a.arrow === b.arrow
}

function computeBaseAnchors(vdom: VDom): {
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
} {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const strum = vdom.special?.strumming
  const relStart = pt(strum?.relativeStartPoint)
  const relEnd = pt(strum?.relativeEndPoint)
  return {
    baseStart: {x: s.x - relStart.x, y: s.y - relStart.y},
    baseEnd: {x: e.x - relEnd.x, y: e.y - relEnd.y},
  }
}

export function createStrummingDragSession(
  event: PointerEvent,
  symbolId: string,
  handle: VerticalHandleKind,
  vdom: VDom,
  svgX: number,
): StrummingDragSession {
  const {baseStart, baseEnd} = computeBaseAnchors(vdom)
  const strum = vdom.special?.strumming
  return {
    pointerId: event.pointerId,
    symbolId,
    handle,
    baseStart,
    baseEnd,
    originSvgX: svgX,
    initialRelStartX: strum?.relativeStartPoint?.x ?? 0,
    initialRelEndX: strum?.relativeEndPoint?.x ?? 0,
  }
}

export function computeStrummingHandlePoints(vdom: VDom): VerticalHandlePoints | null {
  if (!isStrummingVDom(vdom)) return null
  return computeVerticalHandlePoints(vdom)
}

export function nextStrummingGeomFromPointer(
  session: StrummingDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): StrummingMirror | null {
  const prev = vdom.special?.strumming
  if (!prev) return null
  const next = cloneStrumming(prev)

  if (session.handle === 'start') {
    next.relativeStartPoint = {
      x: next.relativeStartPoint.x,
      y: svgY - session.baseStart.y,
    }
    return next
  }

  if (session.handle === 'end') {
    next.relativeEndPoint = {
      x: next.relativeEndPoint.x,
      y: svgY - session.baseEnd.y,
    }
    return next
  }

  const dx = svgX - session.originSvgX
  next.relativeStartPoint = {
    x: session.initialRelStartX + dx,
    y: next.relativeStartPoint.y,
  }
  next.relativeEndPoint = {
    x: session.initialRelEndX + dx,
    y: next.relativeEndPoint.y,
  }
  return next
}

function commitStrummingGeom(musicScore: MusicScore, symbolId: string, geom: StrummingMirror) {
  const sym = findStrummingSymbol(musicScore, symbolId)
  if (!sym) return
  const current = sym.data.strumming
  if (current && sameStrumming(cloneStrumming(current), geom)) return
  sym.data.strumming = {
    relativeStartPoint: pt(geom.relativeStartPoint),
    relativeEndPoint: pt(geom.relativeEndPoint),
    arrow: geom.arrow !== false,
  }
}

/**
 * 拖扫弦：立刻 updateVDom；把手由返回值覆盖。
 * musicScore.data.strumming 防抖落盘。
 */
export function previewStrummingDrag(
  musicScore: MusicScore,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  session: StrummingDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): VerticalHandlePoints | null {
  const geom = nextStrummingGeomFromPointer(session, vdom, svgX, svgY)
  if (!geom) return null
  const patch = strummingVDomPatch(vdom, geom)
  if (!patch) return null
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `strumming:${session.symbolId}:geom`,
    mirror: {targetId: session.symbolId, patch},
    commit: () => commitStrummingGeom(musicScore, session.symbolId, geom),
  })
  const previewed = mirrorStrummingData([vdom], session.symbolId, geom)[0]
  return previewed ? computeStrummingHandlePoints(previewed) : null
}
