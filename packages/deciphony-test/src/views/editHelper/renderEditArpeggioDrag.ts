import {
  SingleSlotAffiliatedSymbolNameEnum,
  arpeggioVDomPatch,
  ArpeggioTypeEnum,
  mirrorArpeggioData,
  type ArpeggioMirror,
  type MusicScore,
  type SingleSlotAffiliatedSymbol,
  type SlotData,
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

export type ArpeggioDragSession = {
  pointerId: number
  symbolId: string
  handle: VerticalHandleKind
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
  /** middle 拖拽起点的 svg x，配合初始 relative x 算整体平移 */
  originSvgX: number
  initialRelStartX: number
  initialRelEndX: number
}

const ARPEGGIO_NAMES = new Set<string>([
  SingleSlotAffiliatedSymbolNameEnum.Arpeggio,
  SingleSlotAffiliatedSymbolNameEnum.arpeggio_straight,
])

export function isArpeggioVDom(vdom: VDom | null | undefined): boolean {
  return (
    (vdom?.tag === 'affiliation' || vdom?.tag === 'arpeggio')
    && vdom.special?.arpeggio != null
  )
}

/** 选中项是否为单 slot 附属琶音 */
export function isArpeggioSelected(
  selected: SlotData | null,
): selected is SlotData & { self: SingleSlotAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && ARPEGGIO_NAMES.has(String(self.name))
  )
}

export function findArpeggioSymbol(
  musicScore: MusicScore,
  symbolId: string,
): SingleSlotAffiliatedSymbol | null {
  const sym = locateSlotAffiliatedSymbolById(musicScore, symbolId)?.symbol
  return sym && ARPEGGIO_NAMES.has(String(sym.name)) ? sym : null
}

function pt(p?: { x: number; y: number }): { x: number; y: number } {
  return {x: p?.x ?? 0, y: p?.y ?? 0}
}

function cloneArpeggio(arp: NonNullable<VDom['special']['arpeggio']>): ArpeggioMirror {
  return {
    ...arp,
    relativeStartPoint: pt(arp.relativeStartPoint),
    relativeEndPoint: pt(arp.relativeEndPoint),
  }
}

function samePoint(a?: { x: number; y: number }, b?: { x: number; y: number }): boolean {
  return (a?.x ?? 0) === (b?.x ?? 0) && (a?.y ?? 0) === (b?.y ?? 0)
}

function sameArpeggio(a: ArpeggioMirror, b: ArpeggioMirror): boolean {
  return samePoint(a.relativeStartPoint, b.relativeStartPoint)
    && samePoint(a.relativeEndPoint, b.relativeEndPoint)
    && a.arrow === b.arrow
    && a.type === b.type
}

function computeBaseAnchors(vdom: VDom): {
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
} {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const arp = vdom.special?.arpeggio
  const relStart = pt(arp?.relativeStartPoint)
  const relEnd = pt(arp?.relativeEndPoint)
  return {
    baseStart: {x: s.x - relStart.x, y: s.y - relStart.y},
    baseEnd: {x: e.x - relEnd.x, y: e.y - relEnd.y},
  }
}

export function createArpeggioDragSession(
  event: PointerEvent,
  symbolId: string,
  handle: VerticalHandleKind,
  vdom: VDom,
  svgX: number,
): ArpeggioDragSession {
  const {baseStart, baseEnd} = computeBaseAnchors(vdom)
  const arp = vdom.special?.arpeggio
  return {
    pointerId: event.pointerId,
    symbolId,
    handle,
    baseStart,
    baseEnd,
    originSvgX: svgX,
    initialRelStartX: arp?.relativeStartPoint?.x ?? 0,
    initialRelEndX: arp?.relativeEndPoint?.x ?? 0,
  }
}

export function computeArpeggioHandlePoints(vdom: VDom): VerticalHandlePoints | null {
  if (!isArpeggioVDom(vdom)) return null
  return computeVerticalHandlePoints(vdom)
}

export function nextArpeggioGeomFromPointer(
  session: ArpeggioDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): ArpeggioMirror | null {
  const prev = vdom.special?.arpeggio
  if (!prev) return null
  const next = cloneArpeggio(prev)

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

function commitArpeggioGeom(musicScore: MusicScore, symbolId: string, geom: ArpeggioMirror) {
  const sym = findArpeggioSymbol(musicScore, symbolId)
  if (!sym) return
  const current = sym.data.arpeggio
  if (current && sameArpeggio(cloneArpeggio(current), geom)) return
  sym.data.arpeggio = {
    relativeStartPoint: pt(geom.relativeStartPoint),
    relativeEndPoint: pt(geom.relativeEndPoint),
    arrow: geom.arrow !== false,
    type: geom.type ?? current?.type ?? ArpeggioTypeEnum.Normal,
  }
}

/**
 * 拖琶音：立刻 updateVDom；把手由返回值覆盖。
 * musicScore.data.arpeggio 防抖落盘。
 */
export function previewArpeggioDrag(
  musicScore: MusicScore,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  session: ArpeggioDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): VerticalHandlePoints | null {
  const geom = nextArpeggioGeomFromPointer(session, vdom, svgX, svgY)
  if (!geom) return null
  const patch = arpeggioVDomPatch(vdom, geom)
  if (!patch) return null
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `arpeggio:${session.symbolId}:geom`,
    mirror: {targetId: session.symbolId, patch},
    commit: () => commitArpeggioGeom(musicScore, session.symbolId, geom),
  })
  const previewed = mirrorArpeggioData([vdom], session.symbolId, geom)[0]
  return previewed ? computeArpeggioHandlePoints(previewed) : null
}
