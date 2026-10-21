import {
  DoubleNoteAffiliatedSymbolNameEnum,
  isNumberNotationSlur,
  isSplitSlur,
  mirrorSlurData,
  MusicScoreTypeEnum,
  numberNotationSlurGeom,
  slurDefaultControlPoint,
  slurVDomPatch,
  splitSlurBreaks,
} from '@deciphony/renderer'
import type {DoubleNoteAffiliatedSymbol, MusicScore, SlurMirror, SlotData, VDom} from '@deciphony/renderer'
import {scoreWriteGateFor, type UpdateVDomFn} from './scoreWriteGate'

export type SlurHandleKind = 'start' | 'control' | 'end'

export type SlurHandlePoints = {
  start: { x: number; y: number }
  control: { x: number; y: number }
  end: { x: number; y: number }
  /** 分段连音线（起止不在同一单谱表）：只有两端把手，可上下左右拖，没有控制点 */
  split?: boolean
}

export type SlurDragSession = {
  pointerId: number
  slurId: string
  handle: SlurHandleKind
  baseStart: { x: number; y: number }
  baseEnd: { x: number; y: number }
  /** 简谱中间点拖拽起点的 svg y，配合初始 relative y 算整体上下平移 */
  originSvgY: number
  initialRelStartY: number
  initialRelEndY: number
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
    && a.style === b.style
    && samePoint(a.relativeTextPoint, b.relativeTextPoint)
}

/** 与 slur.vue 一致：五线谱控制点 = 默认控制点（按 direction 在上方 / 下方）+ relativeControlPoint；简谱左右端控 x，control 为横线中点（上下平移） */
export function computeSlurHandlePoints(
  vdom: VDom,
  notationType?: MusicScoreTypeEnum,
): SlurHandlePoints | null {
  if (!isSlurVDom(vdom)) return null
  if (isSplitSlur(vdom)) {
    return {
      start: {...vdom.startPoint},
      end: {...vdom.endPoint},
      control: splitSlurBreaks(vdom).start,
      split: true,
    }
  }
  if (isNumberNotationSlur(notationType, vdom.special?.slur?.style)) {
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
  const def = slurDefaultControlPoint(vdom)
  return {
    start: {x: s.x, y: s.y},
    end: {x: e.x, y: e.y},
    control: {x: def.x + relCtrl.x, y: def.y + relCtrl.y},
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
  svgY = 0,
): SlurDragSession {
  const {baseStart, baseEnd} = computeBaseAnchors(vdom)
  const slur = vdom.special?.slur
  return {
    pointerId: event.pointerId,
    slurId,
    handle,
    baseStart,
    baseEnd,
    originSvgY: svgY,
    initialRelStartY: slur?.relativeStartPoint?.y ?? 0,
    initialRelEndY: slur?.relativeEndPoint?.y ?? 0,
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
  const split = isSplitSlur(vdom)
  // 简谱整段：两端只改 x；分段时两端各管自己那段的高度，可上下拖
  const jianpu = isNumberNotationSlur(notationType, prev.style) && !split
  const next = cloneSlur(prev)

  if (split && session.handle === 'control') return null

  if (session.handle === 'start') {
    next.relativeStartPoint = {
      x: svgX - session.baseStart.x,
      y: jianpu ? next.relativeStartPoint.y : svgY - session.baseStart.y,
    }
    return next
  }

  if (session.handle === 'end') {
    next.relativeEndPoint = {
      x: svgX - session.baseEnd.x,
      y: jianpu ? next.relativeEndPoint.y : svgY - session.baseEnd.y,
    }
    return next
  }

  if (jianpu) {
    // 简谱高度 = 两端 relative y 的均值：同步平移两者
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

  const def = slurDefaultControlPoint(vdom)
  next.relativeControlPoint = {
    x: svgX - def.x,
    y: svgY - def.y,
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
    ...(geom.style != null ? {style: geom.style} : {}),
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

/**
 * 重置连音线 relative* 到 0：立刻 updateVDom（相对当前 live 节点算端点 delta），再落盘。
 * getLiveVDom 应返回屏上已被预览改过的 affiliation 节点。
 */
export function resetSlurRelativeOffset(
  musicScore: MusicScore,
  slurId: string,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  getLiveVDom: () => VDom | undefined,
): void {
  const sym = findSlurSymbol(musicScore, slurId)
  if (!sym) return
  const live = getLiveVDom()
  const shown = live?.special?.slur ?? sym.data.slur
  if (!shown) return
  const geom: SlurMirror = {
    ...cloneSlur(shown),
    relativeStartPoint: {x: 0, y: 0},
    relativeEndPoint: {x: 0, y: 0},
    relativeControlPoint: {x: 0, y: 0},
  }
  const patch = live && live.special?.slur ? slurVDomPatch(live, geom) : null
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `slur:${slurId}:resetAlign`,
    delay: 0,
    mirror: patch ? {targetId: slurId, patch} : undefined,
    commit: () => commitSlurGeom(musicScore, slurId, geom),
  })
}
