import {
  SingleSlotAffiliatedSymbolNameEnum,
  type GrandStaff,
  type Measure,
  type MusicScore,
  type SingleMeasureAffiliatedSymbol,
  type SingleNoteAffiliatedSymbol,
  type SingleSlotAffiliatedSymbol,
  type SingleStaff,
  type SlotData,
  type VDom,
} from '@deciphony/renderer'
import {
  locateSingleAffiliatedSymbolById,
  setSingleAffiliatedSymbolFrame,
  type SingleAffiliatedSymbolKind,
} from '@deciphony/extensions/dr-edit/score-builder'
import {scoreWriteGateFor, type UpdateVDomFn} from './scoreWriteGate'

/**
 * 单宿主附属（音符 / slot / 小节，内置或曲谱自定义符号）：拖拽框整体平移，改自身 relativeX / relativeY。
 * 琶音 / 扫弦有自己的竖向拖拽（renderEditArpeggioDrag / renderEditStrummingDrag），不走这里。
 */

export type FrameBox = { x: number; y: number; w: number; h: number }

type SingleAffiliatedSymbol = SingleNoteAffiliatedSymbol | SingleSlotAffiliatedSymbol | SingleMeasureAffiliatedSymbol

const OWN_DRAG_SLOT_NAMES = new Set<string>([
  SingleSlotAffiliatedSymbolNameEnum.Arpeggio,
  SingleSlotAffiliatedSymbolNameEnum.arpeggio_straight,
  SingleSlotAffiliatedSymbolNameEnum.Strumming,
])

export type LocatedNoteAffiliated = {
  kind: SingleAffiliatedSymbolKind
  grandStaff: GrandStaff
  singleStaff: SingleStaff
  measure: Measure
  /** 所在 slot 的主体（NoteSymbol / NoteNumber / 休止符等）；小节附属为 null */
  note: unknown
  /** 挂在 NotesInfo（含倚音）上时为该 NotesInfo，否则 null */
  info: unknown
  symbol: SingleAffiliatedSymbol
}

export function locateNoteAffiliatedById(musicScore: MusicScore, id: string): LocatedNoteAffiliated | null {
  const located = locateSingleAffiliatedSymbolById(musicScore, id)
  if (!located) return null
  const note = located.slot?.symbol ?? null
  return {
    kind: located.kind,
    grandStaff: located.grandStaff,
    singleStaff: located.singleStaff,
    measure: located.measure,
    note,
    info: located.kind === 'note' && located.host !== note ? located.host : null,
    symbol: located.symbol,
  }
}

export function isNoteAffiliatedSelected(
  selected: SlotData | null,
): selected is SlotData & { self: SingleAffiliatedSymbol } {
  const self = selected?.self as { id?: unknown; name?: unknown } | null | undefined
  if (!selected?.musicScore || !self || typeof self.id !== 'string' || !('name' in self) || 'startId' in self) return false
  const located = locateSingleAffiliatedSymbolById(selected.musicScore, self.id)
  if (!located) return false
  return !(located.kind === 'slot' && OWN_DRAG_SLOT_NAMES.has(String(self.name)))
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
  const located = locateSingleAffiliatedSymbolById(musicScore, symbolId)
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
 * 拖单宿主附属：立刻 updateVDom 平移节点；relativeX / relativeY 防抖落盘。
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
      setSingleAffiliatedSymbolFrame(musicScore, session.symbolId, {
        relativeX: session.baseRelativeX + dx,
        relativeY: session.baseRelativeY + dy,
      })
    },
  })
  return box
}
