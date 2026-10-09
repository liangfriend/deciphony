import {
  getMeasureSlots,
  SingleNoteAffiliatedSymbolNameEnum,
  type GrandStaff,
  type Measure,
  type MusicScore,
  type SingleNoteAffiliatedSymbol,
  type SingleStaff,
  type SlotData,
  type VDom,
} from '@deciphony/renderer'
import {scoreWriteGateFor, type UpdateVDomFn} from './scoreWriteGate'

/** 单音符附属（挂在 NotesInfo / NoteNumber / 休止符）：拖拽框整体平移，改自身 relativeX / relativeY */

export type FrameBox = { x: number; y: number; w: number; h: number }

const NOTE_AFFILIATED_NAMES = new Set<string>(Object.values(SingleNoteAffiliatedSymbolNameEnum))

type Host = { id: string; affiliatedSymbols?: SingleNoteAffiliatedSymbol[] }

export type LocatedNoteAffiliated = {
  grandStaff: GrandStaff
  singleStaff: SingleStaff
  measure: Measure
  /** 承载 slot 的主体（NoteSymbol / NoteNumber / 休止符等） */
  note: unknown
  /** 挂在 NotesInfo 上时为该 NotesInfo，否则 null */
  info: unknown
  symbol: SingleNoteAffiliatedSymbol
}

function findIn(host: Host | null | undefined, id: string): SingleNoteAffiliatedSymbol | null {
  return host?.affiliatedSymbols?.find((sym) => sym.id === id) ?? null
}

export function locateNoteAffiliatedById(musicScore: MusicScore, id: string): LocatedNoteAffiliated | null {
  for (const grandStaff of musicScore.grandStaffs) {
    for (const singleStaff of grandStaff.staves) {
      for (const measure of singleStaff.measures) {
        for (const slot of getMeasureSlots(measure)) {
          const body = slot.symbol as unknown as Host & { notesInfo?: Host[] }
          if (!body) continue
          for (const info of body.notesInfo ?? []) {
            const symbol = findIn(info, id)
            if (symbol) return {grandStaff, singleStaff, measure, note: body, info, symbol}
          }
          const symbol = findIn(body, id)
          if (symbol) return {grandStaff, singleStaff, measure, note: body, info: null, symbol}
        }
      }
    }
  }
  return null
}

export function isNoteAffiliatedSelected(
  selected: SlotData | null,
): selected is SlotData & { self: SingleNoteAffiliatedSymbol } {
  const self = selected?.self
  return (
    self != null
    && 'name' in self
    && NOTE_AFFILIATED_NAMES.has(String(self.name))
    && !('startId' in self)
  )
}

export function isNoteAffiliatedVDom(vdom: VDom | null | undefined, symbolId: string): boolean {
  return vdom?.tag === 'affiliation' && vdom.targetId === symbolId
}

export function computeNoteAffiliatedBox(vdom: VDom): FrameBox {
  return {x: vdom.x, y: vdom.y, w: vdom.w, h: vdom.h}
}

export type NoteAffiliatedDragSession = {
  pointerId: number
  symbolId: string
  pointerStartX: number
  pointerStartY: number
  baseBox: FrameBox
  baseRelativeX: number
  baseRelativeY: number
}

export function createNoteAffiliatedDragSession(
  event: PointerEvent,
  musicScore: MusicScore,
  vdom: VDom,
  svgX: number,
  svgY: number,
): NoteAffiliatedDragSession | null {
  const symbolId = vdom.targetId
  if (!symbolId) return null
  const located = locateNoteAffiliatedById(musicScore, symbolId)
  if (!located) return null
  return {
    pointerId: event.pointerId,
    symbolId,
    pointerStartX: svgX,
    pointerStartY: svgY,
    baseBox: computeNoteAffiliatedBox(vdom),
    baseRelativeX: located.symbol.relativeX ?? 0,
    baseRelativeY: located.symbol.relativeY ?? 0,
  }
}

/**
 * 拖单音符附属：立刻 updateVDom 平移节点；relativeX / relativeY 防抖落盘。
 * 返回拖拽框新位置。
 */
export function previewNoteAffiliatedDrag(
  musicScore: MusicScore,
  getUpdateVDom: () => UpdateVDomFn | undefined,
  session: NoteAffiliatedDragSession,
  svgX: number,
  svgY: number,
): FrameBox {
  const dx = svgX - session.pointerStartX
  const dy = svgY - session.pointerStartY
  const box = {...session.baseBox, x: session.baseBox.x + dx, y: session.baseBox.y + dy}
  scoreWriteGateFor(musicScore, getUpdateVDom).patch({
    key: `noteAffiliated:${session.symbolId}:frame`,
    mirror: {targetId: session.symbolId, patch: {x: box.x, y: box.y}},
    commit: () => {
      const sym = locateNoteAffiliatedById(musicScore, session.symbolId)?.symbol
      if (!sym) return
      sym.relativeX = session.baseRelativeX + dx
      sym.relativeY = session.baseRelativeY + dy
    },
  })
  return box
}
