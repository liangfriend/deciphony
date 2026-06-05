import {DoubleNoteAffiliatedSymbolNameEnum} from 'deciphony-renderer'
import type {DoubleNoteAffiliatedSymbol, MusicScore, SlotData, VDom} from 'deciphony-renderer'

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

function ensureSlurData(sym: DoubleNoteAffiliatedSymbol) {
  if (!sym.data.slur) {
    sym.data.slur = {
      relativeStartPoint: {x: 0, y: 0},
      relativeEndPoint: {x: 0, y: 0},
      relativeControlPoint: {x: 0, y: 0},
      thickness: 2,
    }
  }
  return sym.data.slur
}

/** 与 slur.vue 一致：控制点 = 默认中点上方 + relativeControlPoint */
export function computeSlurHandlePoints(vdom: VDom): SlurHandlePoints | null {
  if (!isSlurVDom(vdom)) return null
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

export function updateSlurDragFromPointer(
  session: SlurDragSession,
  musicScore: MusicScore,
  vdom: VDom,
  svgX: number,
  svgY: number,
): boolean {
  const sym = findSlurSymbol(musicScore, session.slurId)
  if (!sym) return false
  const slur = ensureSlurData(sym)

  if (session.handle === 'start') {
    slur.relativeStartPoint = {
      x: svgX - session.baseStart.x,
      y: svgY - session.baseStart.y,
    }
    return true
  }

  if (session.handle === 'end') {
    slur.relativeEndPoint = {
      x: svgX - session.baseEnd.x,
      y: svgY - session.baseEnd.y,
    }
    return true
  }

  const s = vdom.startPoint
  const e = vdom.endPoint
  const defaultCx = (s.x + e.x) / 2
  const defaultCy = Math.min(s.y, e.y) - Math.max(8, Math.abs(e.x - s.x) * 0.2)
  slur.relativeControlPoint = {
    x: svgX - defaultCx,
    y: svgY - defaultCy,
  }
  return true
}
