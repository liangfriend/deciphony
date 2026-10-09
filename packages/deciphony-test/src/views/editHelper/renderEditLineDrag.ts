import {
  DoubleSlotAffiliatedSymbolNameEnum,
  hairpinVDomPatch,
  HairpinTypeEnum,
  mirrorHairpinData,
  mirrorTrillData,
  trillVDomPatch,
  TrillTypeEnum,
  type DoubleSlotAffiliatedSymbol,
  type HairpinMirror,
  type MusicScore,
  type SlotData,
  type TrillMirror,
  type VDom,
} from '@deciphony/renderer'
import {scoreWriteGateFor, type UpdateVDomFn} from './scoreWriteGate'
import {
  computeHorizontalHandlePoints,
  type HorizontalHandleKind,
  type HorizontalHandlePoints,
} from './renderEditHorizontalDrag'

/** 颤音线 / 渐强渐弱：同为双 slot 横向线条，拖拽逻辑一致，只是 data 键不同 */
export type LineSymbolKey = 'trill' | 'hairpin'

type Point = { x: number; y: number }
type LineGeom = { relativeStartPoint: Point; relativeEndPoint: Point }

const KEY_BY_NAME: Partial<Record<string, LineSymbolKey>> = {
  [DoubleSlotAffiliatedSymbolNameEnum.Trill_line]: 'trill',
  [DoubleSlotAffiliatedSymbolNameEnum.Hairpin]: 'hairpin',
}

export type LineDragSession = {
  pointerId: number
  symbolId: string
  key: LineSymbolKey
  handle: HorizontalHandleKind
  baseStart: Point
  baseEnd: Point
  originSvgY: number
  initialRelStartY: number
  initialRelEndY: number
}

function lineKeyOfVDom(vdom: VDom | null | undefined): LineSymbolKey | null {
  if (vdom?.tag !== 'affiliation') return null
  if (vdom.special?.trill != null) return 'trill'
  if (vdom.special?.hairpin != null) return 'hairpin'
  return null
}

export function isLineVDom(vdom: VDom | null | undefined): boolean {
  return lineKeyOfVDom(vdom) != null
}

export function isLineSelected(
  selected: SlotData | null,
): selected is SlotData & { self: DoubleSlotAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && KEY_BY_NAME[String(self.name)] != null
    && 'startId' in self
  )
}

function findLineSymbol(musicScore: MusicScore, symbolId: string): DoubleSlotAffiliatedSymbol | null {
  const sym = musicScore.affiliatedSymbols.find((item) => item.id === symbolId)
  if (!sym || KEY_BY_NAME[String(sym.name)] == null || !('startId' in sym)) return null
  return sym as DoubleSlotAffiliatedSymbol
}

function pt(p?: Point): Point {
  return {x: p?.x ?? 0, y: p?.y ?? 0}
}

function lineSpecial(vdom: VDom, key: LineSymbolKey): (LineGeom & Record<string, unknown>) | null {
  const prev = vdom.special?.[key]
  if (!prev) return null
  return {
    ...prev,
    relativeStartPoint: pt(prev.relativeStartPoint),
    relativeEndPoint: pt(prev.relativeEndPoint),
  }
}

export function createLineDragSession(
  event: PointerEvent,
  symbolId: string,
  handle: HorizontalHandleKind,
  vdom: VDom,
  svgY: number,
): LineDragSession | null {
  const key = lineKeyOfVDom(vdom)
  const geom = key ? lineSpecial(vdom, key) : null
  if (!key || !geom) return null
  const s = vdom.startPoint
  const e = vdom.endPoint
  return {
    pointerId: event.pointerId,
    symbolId,
    key,
    handle,
    baseStart: {x: s.x - geom.relativeStartPoint.x, y: s.y - geom.relativeStartPoint.y},
    baseEnd: {x: e.x - geom.relativeEndPoint.x, y: e.y - geom.relativeEndPoint.y},
    originSvgY: svgY,
    initialRelStartY: geom.relativeStartPoint.y,
    initialRelEndY: geom.relativeEndPoint.y,
  }
}

export function computeLineHandlePoints(vdom: VDom): HorizontalHandlePoints | null {
  if (!isLineVDom(vdom)) return null
  return computeHorizontalHandlePoints(vdom)
}

/** 左/右把手改各自 x；中间把手整体上下平移 */
function nextLineGeom(
  session: LineDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): (LineGeom & Record<string, unknown>) | null {
  const next = lineSpecial(vdom, session.key)
  if (!next) return null
  if (session.handle === 'start') {
    next.relativeStartPoint = {x: svgX - session.baseStart.x, y: next.relativeStartPoint.y}
    return next
  }
  if (session.handle === 'end') {
    next.relativeEndPoint = {x: svgX - session.baseEnd.x, y: next.relativeEndPoint.y}
    return next
  }
  const dy = svgY - session.originSvgY
  next.relativeStartPoint = {x: next.relativeStartPoint.x, y: session.initialRelStartY + dy}
  next.relativeEndPoint = {x: next.relativeEndPoint.x, y: session.initialRelEndY + dy}
  return next
}

function commitLineGeom(musicScore: MusicScore, session: LineDragSession, geom: LineGeom) {
  const sym = findLineSymbol(musicScore, session.symbolId)
  if (!sym) return
  const relativeStartPoint = pt(geom.relativeStartPoint)
  const relativeEndPoint = pt(geom.relativeEndPoint)
  if (session.key === 'trill') {
    const current = sym.data.trill
    sym.data.trill = {
      relativeStartPoint,
      relativeEndPoint,
      type: current?.type ?? TrillTypeEnum.Trill,
    }
    return
  }
  const current = sym.data.hairpin
  sym.data.hairpin = {
    ...current,
    relativeStartPoint,
    relativeEndPoint,
    type: current?.type ?? HairpinTypeEnum.Crescendo_hairpin,
  }
}

/**
 * 拖颤音线 / 渐强渐弱：立刻 updateVDom；把手由返回值覆盖。
 * musicScore 的 data.trill / data.hairpin 防抖落盘。
 */
export function previewLineDrag(
  musicScore: MusicScore,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  session: LineDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): HorizontalHandlePoints | null {
  const geom = nextLineGeom(session, vdom, svgX, svgY)
  if (!geom) return null
  const patch = session.key === 'trill'
    ? trillVDomPatch(vdom, geom as TrillMirror)
    : hairpinVDomPatch(vdom, geom as HairpinMirror)
  if (!patch) return null
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `${session.key}:${session.symbolId}:geom`,
    mirror: {targetId: session.symbolId, patch},
    commit: () => commitLineGeom(musicScore, session, geom),
  })
  const previewed = session.key === 'trill'
    ? mirrorTrillData([vdom], session.symbolId, geom as TrillMirror)[0]
    : mirrorHairpinData([vdom], session.symbolId, geom as HairpinMirror)[0]
  return previewed ? computeLineHandlePoints(previewed) : null
}
