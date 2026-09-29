import {
  DoubleNoteAffiliatedSymbolNameEnum,
  mirrorSlurData,
  MusicScoreTypeEnum,
  numberNotationSlurGeom,
  slurVDomPatch,
} from '@deciphony/renderer'
import type {DoubleNoteAffiliatedSymbol, MusicScore, SlurMirror, SlotData, VDom} from '@deciphony/renderer'
import {scoreWriteGateFor, type UpdateVDomFn} from './scoreWriteGate'

export type SlurHandleKind = 'start' | 'control' | 'end'

export type SlurHandlePoints = {
  start: { x: number; y: number }
  control: { x: number; y: number }
  end: { x: number; y: number }
}

export type SlurDragSession = {
  pointerId: number
  slurId: string
  handle: SlurHandleKind
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
}

export function isSlurVDom(vdom: VDom | null | undefined): boolean {
  return vdom?.tag === 'affiliation' && vdom.special?.slur != null
}

/** 选中项是否为连音线编辑模式 */
export function isSlurSelected(
  selected: SlotData | null,
): selected is SlotData & { self: DoubleNoteAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && self.name === DoubleNoteAffiliatedSymbolNameEnum.Slur
    && 'startId' in self
  )
}

export function findSlurSymbol(
  musicScore: MusicScore,
  slurId: string,
): DoubleNoteAffiliatedSymbol | null {
  const sym = musicScore.affiliatedSymbols.find((item) => item.id === slurId)
  if (!sym || sym.name !== DoubleNoteAffiliatedSymbolNameEnum.Slur) return null
  return sym
}

function pt(p?: { x: number, y: number }): { x: number, y: number } {
  return {x: p?.x ?? 0, y: p?.y ?? 0}
}

function cloneSlur(slur: NonNullable<VDom['special']['slur']>): SlurMirror {
  return {
    ...slur,
    relativeStartPoint: pt(slur.relativeStartPoint),
    relativeEndPoint: pt(slur.relativeEndPoint),
    relativeControlPoint: pt(slur.relativeControlPoint),
    relativeTextPoint: slur.relativeTextPoint ? pt(slur.relativeTextPoint) : undefined,
  }
}

function samePoint(a?: { x: number, y: number }, b?: { x: number, y: number }): boolean {
  return (a?.x ?? 0) === (b?.x ?? 0) && (a?.y ?? 0) === (b?.y ?? 0)
}

function sameSlur(a: SlurMirror, b: SlurMirror): boolean {
  return samePoint(a.relativeStartPoint, b.relativeStartPoint)
    && samePoint(a.relativeEndPoint, b.relativeEndPoint)
    && samePoint(a.relativeControlPoint, b.relativeControlPoint)
    && a.thickness === b.thickness
    && a.type === b.type
    && samePoint(a.relativeTextPoint, b.relativeTextPoint)
}

/** 与 slur.vue 一致：五线谱控制点在中点上方；简谱只有左右端 x */
export function computeSlurHandlePoints(
  vdom: VDom,
  notationType?: MusicScoreTypeEnum,
): SlurHandlePoints | null {
  if (!isSlurVDom(vdom)) return null
  if (notationType === MusicScoreTypeEnum.NumberNotation) {
    const g = numberNotationSlurGeom(vdom)
    const midX = (g.x0 + g.x1) / 2
    return {
      start: {x: vdom.startPoint.x, y: g.yFoot},
      end: {x: vdom.endPoint.x, y: g.yFoot},
      control: {x: midX, y: g.yTop},
    }
  }
  const s = vdom.startPoint
  const e = vdom.endPoint
  const relCtrl = vdom.special?.slur?.relativeControlPoint ?? {x: 0, y: 0}
  const defaultCx = (s.x + e.x) / 2
  const defaultCy = Math.min(s.y, e.y) - Math.max(8, Math.abs(e.x - s.x) * 0.2)
  return {
    start: {x: s.x, y: s.y},
    end: {x: e.x, y: e.y},
    control: {x: defaultCx + relCtrl.x, y: defaultCy + relCtrl.y},
  }
}

function computeBaseAnchors(vdom: VDom): { baseStart: { x: number; y: number }; baseEnd: { x: number; y: number } } {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const slur = vdom.special?.slur
  const relStart = slur?.relativeStartPoint ?? {x: 0, y: 0}
  const relEnd = slur?.relativeEndPoint ?? {x: 0, y: 0}
  return {
    baseStart: {x: s.x - relStart.x, y: s.y - relStart.y},
    baseEnd: {x: e.x - relEnd.x, y: e.y - relEnd.y},
  }
}

export function createSlurDragSession(
  event: PointerEvent,
  slurId: string,
  handle: SlurHandleKind,
  vdom: VDom,
): SlurDragSession {
  const {baseStart, baseEnd} = computeBaseAnchors(vdom)
  return {
    pointerId: event.pointerId,
    slurId,
    handle,
    baseStart,
    baseEnd,
  }
}

/** 由当前 vDom（含尚未落盘的预览）和指针算出下一帧连音线，不写 musicScore */
export function nextSlurGeomFromPointer(
  session: SlurDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
  notationType?: MusicScoreTypeEnum,
): SlurMirror | null {
  const prev = vdom.special?.slur
  if (!prev) return null
  const jianpu = notationType === MusicScoreTypeEnum.NumberNotation
  const next = cloneSlur(prev)

  if (session.handle === 'start') {
    next.relativeStartPoint = {
      x: svgX - session.baseStart.x,
      y: jianpu ? 0 : svgY - session.baseStart.y,
    }
    return next
  }

  if (session.handle === 'end') {
    next.relativeEndPoint = {
      x: svgX - session.baseEnd.x,
      y: jianpu ? 0 : svgY - session.baseEnd.y,
    }
    return next
  }

  if (jianpu) return null

  const s = vdom.startPoint
  const e = vdom.endPoint
  const defaultCx = (s.x + e.x) / 2
  const defaultCy = Math.min(s.y, e.y) - Math.max(8, Math.abs(e.x - s.x) * 0.2)
  next.relativeControlPoint = {
    x: svgX - defaultCx,
    y: svgY - defaultCy,
  }
  return next
}

function commitSlurGeom(musicScore: MusicScore, slurId: string, geom: SlurMirror) {
  const sym = findSlurSymbol(musicScore, slurId)
  if (!sym) return
  const current = sym.data.slur
  if (current && sameSlur(cloneSlur(current), geom)) return
  sym.data.slur = {
    relativeStartPoint: pt(geom.relativeStartPoint),
    relativeEndPoint: pt(geom.relativeEndPoint),
    relativeControlPoint: pt(geom.relativeControlPoint),
    thickness: geom.thickness,
    ...(geom.type != null ? {type: geom.type} : {}),
    ...(geom.relativeTextPoint ? {relativeTextPoint: pt(geom.relativeTextPoint)} : {}),
  } as NonNullable<DoubleNoteAffiliatedSymbol['data']['slur']>
}

/**
 * 拖连音线：立刻 updateVDom(id, patch) 原地改弧线；把手位置由返回值交给编辑器覆盖。
 * 不改编辑器的 vDomList。musicScore 上的 data.slur 等 100ms，只写最后一次。
 */
export function previewSlurDrag(
  musicScore: MusicScore,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  session: SlurDragSession,
  vdom: VDom,
  svgX: number,
  svgY: number,
  notationType?: MusicScoreTypeEnum,
): SlurHandlePoints | null {
  const geom = nextSlurGeomFromPointer(session, vdom, svgX, svgY, notationType)
  if (!geom) return null
  const patch = slurVDomPatch(vdom, geom)
  if (!patch) return null
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `slur:${session.slurId}:geom`,
    mirror: {targetId: session.slurId, patch},
    commit: () => commitSlurGeom(musicScore, session.slurId, geom),
  })
  const previewed = mirrorSlurData([vdom], session.slurId, geom)[0]
  return previewed ? computeSlurHandlePoints(previewed, notationType) : null
}
