import type {Measure, NoteNumber, NotesNumberInfo, SlotData, VDom} from 'deciphony-renderer'
import {
  pointerToSvg,
  resolveMeasureBounds,
  syllableFromSvgY,
  type MeasureBounds,
} from './renderEditNumberAddAction'

/** 当前选中项是否为「简谱音符头选中」模式 */
export function isNumberHeadSelected(
  selected: SlotData | null,
): selected is SlotData & {info: NotesNumberInfo; note: NoteNumber; measure: Measure} {
  if (!selected?.info || !selected.note || !selected.measure) return false
  const info = selected.info
  return selected.self === info && 'syllable' in info
}

export type NumberHeadDragSession = {
  pointerId: number
  notesNumberInfoId: string
  info: NotesNumberInfo
  note: NoteNumber
  measureId: string
}

export function createNumberHeadDragSession(
  event: PointerEvent,
  slot: SlotData & {info: NotesNumberInfo; note: NoteNumber; measure: Measure},
): NumberHeadDragSession {
  return {
    pointerId: event.pointerId,
    notesNumberInfoId: slot.info.id,
    info: slot.info,
    note: slot.note,
    measureId: slot.measure.id,
  }
}

/** 上下拖拽更改唱名；休止符与节奏音符不修改 */
export function setNotesNumberInfoSyllable(
  info: NotesNumberInfo,
  syllable: NotesNumberInfo['syllable'],
): boolean {
  if (info.syllable === 0 || info.syllable === 'X') return false
  if (syllable === 0 || syllable === 'X') return false
  if (info.syllable === syllable) return false
  info.syllable = syllable
  return true
}

export function updateNumberHeadSyllableByPointerY(
  session: NumberHeadDragSession,
  bounds: MeasureBounds,
  svgY: number,
): NotesNumberInfo['syllable'] | null {
  const syllable = syllableFromSvgY(svgY, bounds)
  return setNotesNumberInfoSyllable(session.info, syllable) ? syllable : null
}

export function updateNumberHeadDragFromPointer(
  session: NumberHeadDragSession,
  svg: SVGSVGElement,
  root: ParentNode,
  vDomList: VDom[],
  clientX: number,
  clientY: number,
): NotesNumberInfo['syllable'] | null {
  const bounds = resolveMeasureBounds(root, session.measureId, vDomList)
  if (!bounds) return null
  const {y} = pointerToSvg(svg, clientX, clientY)
  return updateNumberHeadSyllableByPointerY(session, bounds, y)
}
