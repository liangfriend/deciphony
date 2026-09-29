import {
  DoubleSlotAffiliatedSymbolNameEnum,
  mirrorPitchData,
  PitchTypeEnum,
  pitchVDomPatch,
  type DoubleSlotAffiliatedSymbol,
  type MusicScore,
  type PitchMirror,
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

const PITCH_NAMES = new Set<string>([
  DoubleSlotAffiliatedSymbolNameEnum.Pitch_up,
  DoubleSlotAffiliatedSymbolNameEnum.Pitch_down,
])

export type PitchDragSession = {
  pointerId: number
  symbolId: string
  handle: HorizontalHandleKind
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
  originSvgY: number
  initialRelStartY: number
  initialRelEndY: number
}

export function isPitchVDom(vdom: VDom | null | undefined): boolean {
  return vdom?.tag === 'affiliation' && vdom.special?.pitch != null
}

export function isPitchSelected(
  selected: SlotData | null,
): selected is SlotData & { self: DoubleSlotAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && PITCH_NAMES.has(String(self.name))
    && 'startId' in self
  )
}

export function findPitchSymbol(
  musicScore: MusicScore,
  symbolId: string,
): DoubleSlotAffiliatedSymbol | null {
  const sym = musicScore.affiliatedSymbols.find((item) => item.id === symbolId)
  if (!sym || !PITCH_NAMES.has(String(sym.name)) || !('startId' in sym)) return null
  return sym as DoubleSlotAffiliatedSymbol
}

function pt(p?: { x: number; y: number }): { x: number; y: number } {
  return {x: p?.x ?? 0, y: p?.y ?? 0}
}

function clonePitch(pitch: NonNullable<VDom['special']['pitch']>): PitchMirror {
  return {
    ...pitch,
    relativeStartPoint: pt(pitch.relativeStartPoint),
    relativeEndPoint: pt(pitch.relativeEndPoint),
  }
}

function samePoint(a?: { x: number; y: number }, b?: { x: number; y: number }): boolean {
  return (a?.x ?? 0) === (b?.x ?? 0) && (a?.y ?? 0) === (b?.y ?? 0)
}

function samePitch(a: PitchMirror, b: PitchMirror): boolean {
  return samePoint(a.relativeStartPoint, b.relativeStartPoint)
    && samePoint(a.relativeEndPoint, b.relativeEndPoint)
    && a.type === b.type
    && a.direction === b.direction
}

function computeBaseAnchors(vdom: VDom): {
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
} {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const pitch = vdom.special?.pitch
  const relStart = pt(pitch?.relativeStartPoint)
  const relEnd = pt(pitch?.relativeEndPoint)
  return {
    baseStart: {x: s.x - relStart.x, y: s.y - relStart.y},
    baseEnd: {x: e.x - relEnd.x, y: e.y - relEnd.y},
  }
}

export function createPitchDragSession(
  event: PointerEvent,
  symbolId: string,
  handle: HorizontalHandleKind,
  vdom: VDom,
  svgY: number,
): PitchDragSession {
  const {baseStart, baseEnd} = computeBaseAnchors(vdom)
  const pitch = vdom.special?.pitch
  return {
    pointerId: event.pointerId,
    symbolId,
    handle,
    baseStart,
    baseEnd,
    originSvgY: svgY,
    initialRelStartY: pitch?.relativeStartPoint?.y ?? 0,
    initialRelEndY: pitch?.relativeEndPoint?.y ?? 0,
  }
}

export function computePitchHandlePoints(vdom: VDom): HorizontalHandlePoints | null {
  if (!isPitchVDom(vdom)) return null
  return computeHorizontalHandlePoints(vdom)
}

export function nextPitchGeomFromPointer(
  session: PitchDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): PitchMirror | null {
  const prev = vdom.special?.pitch
  if (!prev) return null
  const next = clonePitch(prev)

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

function commitPitchGeom(musicScore: MusicScore, symbolId: string, geom: PitchMirror) {
  const sym = findPitchSymbol(musicScore, symbolId)
  if (!sym) return
  const current = sym.data.pitch
  if (current && samePitch(clonePitch(current), geom)) return
  sym.data.pitch = {
    relativeStartPoint: pt(geom.relativeStartPoint),
    relativeEndPoint: pt(geom.relativeEndPoint),
    type: geom.type ?? current?.type ?? PitchTypeEnum['8va'],
  }
}

/**
 * 拖八度记号：立刻 updateVDom；把手由返回值覆盖。
 * musicScore.data.pitch 防抖落盘。
 */
export function previewPitchDrag(
  musicScore: MusicScore,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  session: PitchDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
): HorizontalHandlePoints | null {
  const geom = nextPitchGeomFromPointer(session, vdom, svgX, svgY)
  if (!geom) return null
  const patch = pitchVDomPatch(vdom, geom)
  if (!patch) return null
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `pitch:${session.symbolId}:geom`,
    mirror: {targetId: session.symbolId, patch},
    commit: () => commitPitchGeom(musicScore, session.symbolId, geom),
  })
  const previewed = mirrorPitchData([vdom], session.symbolId, geom)[0]
  return previewed ? computePitchHandlePoints(previewed) : null
}
