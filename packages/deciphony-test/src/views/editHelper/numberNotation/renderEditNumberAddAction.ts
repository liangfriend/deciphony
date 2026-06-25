import type {Chronaxie, Measure, MusicScore, NoteNumber, NotesNumberInfo, SlotData, VDom} from 'deciphony-renderer'
import {createNoteNumber, createNotesNumberInfo} from '../../dr-extensions/dr-edit/score-builder/factories'
import {isNoteNumberSlot, isSlotRestLike} from '../../dr-extensions/dr-edit/score-builder/noteSlot'
import {
  DEFAULT_ADD_NUMBER_STATE,
  syllableForAddState,
  type AddNumberState,
} from './renderEditNumberAddState'
import {previewNumberRestSvgHtml, previewNumberSvgHtml} from './numberSvg'

export {
  MEASURE_HEIGHT,
  MEASURE_ADD_HOVER_RANGE,
  computeSnapPoints,
  findMeasureElement,
  findMeasureSlotElement,
  findMeasureSlotVDom,
  findMeasureVDom,
  isMeasureAddMode,
  isPointerInMeasureAddRange,
  isPointerInMeasureBounds,
  measureBoundsFromVDom,
  nearestSnapPoint,
  pointerToSvg,
  resolveMeasureBounds,
  resolveMeasureSlotAtPointer,
  type MeasureBounds,
  type SnapPoint,
} from '../standardStaff/renderEditSymbolAddAction'

import {
  computeSnapPoints,
  findMeasureSlotVDom,
  isMeasureAddMode,
  isPointerInMeasureAddRange,
  nearestSnapPoint,
} from '../standardStaff/renderEditSymbolAddAction'

/** 简谱音符预览高度（与皮肤 Number_1 接近） */
export const NUMBER_HEAD_HEIGHT = 18
export const NUMBER_PREVIEW_WIDTH = 14

export type GhostNumberPreview = {
  visible: true
  measureId: string
  slotKind: AddNumberState['kind']
  x: number
  y: number
  syllable: NotesNumberInfo['syllable']
  chronaxie: Chronaxie
  svgHtml: string
  snap: import('../standardStaff/renderEditSymbolAddAction').SnapPoint
}

export type MeasureAddActionResult =
  | {type: 'inserted'}
  | {type: 'noteInfoAdded'}
  | {type: 'selectNote'; slot: SlotData; notesNumberInfoId: string}

function collectNumberSlotAnchors(vDomList: VDom[], measure: Measure, measureX: number) {
  const anchors: import('../standardStaff/renderEditSymbolAddAction').SlotAnchor[] = []
  for (let noteIndex = 0; noteIndex < measure.notes.length; noteIndex++) {
    const slot = measure.notes[noteIndex]!
    if (!isNoteNumberSlot(slot)) continue
    const id = isSlotRestLike(slot) ? slot.id : slot.notesInfo[0]?.id
    if (!id) continue
    const tag = isSlotRestLike(slot) ? 'rest' : 'noteHead'
    const vdom = vDomList.find((node) => node.targetId === id && node.tag === tag)
    if (vdom) {
      anchors.push({
        centerX: vdom.x + vdom.w / 2 - measureX,
        noteIndex,
        isNoteSymbol: !isSlotRestLike(slot),
      })
    }
  }
  return anchors
}

/** 指针 y → 唱名 1–7（上高下低） */
export function syllableFromSvgY(svgY: number, bounds: {y: number; h: number}): Exclude<NotesNumberInfo['syllable'], 0 | 'X'> {
  const relativeY = svgY - bounds.y
  const t = Math.max(0, Math.min(1, relativeY / bounds.h))
  const raw = Math.round(7 - t * 6)
  return Math.max(1, Math.min(7, raw)) as Exclude<NotesNumberInfo['syllable'], 0 | 'X'>
}

export function numberPreviewY(bounds: {y: number; h: number}, measureNodeY: number): number {
  return measureNodeY + (bounds.h - NUMBER_HEAD_HEIGHT) / 2
}

export type ResolveGhostNumberParams = {
  selected: SlotData | null
  vDomList: VDom[]
  svgX: number
  svgY: number
  measureBounds: {x: number; y: number; w: number; h: number}
  addNoteState?: AddNumberState
}

export function resolveGhostNumberPreview(params: ResolveGhostNumberParams): GhostNumberPreview | null {
  const {selected, vDomList, svgX, svgY, measureBounds, addNoteState = DEFAULT_ADD_NUMBER_STATE} = params
  if (!isMeasureAddMode(selected)) return null

  const measure = selected.measure
  const measureNode = findMeasureSlotVDom(vDomList, measure.id)
  if (!measureNode || !isPointerInMeasureAddRange(svgX, svgY, measureBounds)) {
    return null
  }

  const relativeX = svgX - measureNode.x
  const anchors = collectNumberSlotAnchors(vDomList, measure, measureNode.x)
  const snapPoints = computeSnapPoints(measureNode.w, anchors)
  let snap = nearestSnapPoint(relativeX, snapPoints)
  if (addNoteState.kind === 'rest') {
    const insertPoints = snapPoints.filter((point) => point.kind === 'insert')
    if (insertPoints.length > 0) snap = nearestSnapPoint(relativeX, insertPoints)
  }

  const chronaxie = addNoteState.chronaxie
  const syllable = addNoteState.kind === 'note'
    ? syllableFromSvgY(svgY, measureBounds)
    : syllableForAddState(addNoteState)
  const y = numberPreviewY(measureBounds, measureNode.y)
  const svgHtml = syllable === 0
    ? previewNumberRestSvgHtml(chronaxie)
    : previewNumberSvgHtml(syllable)

  return {
    visible: true,
    measureId: measure.id,
    slotKind: addNoteState.kind,
    x: snap.x - NUMBER_PREVIEW_WIDTH / 2,
    y: y - measureNode.y,
    syllable,
    chronaxie,
    svgHtml,
    snap,
  }
}

function buildNumberHeadSlot(
  musicScore: MusicScore,
  measureSlot: SlotData & {measure: Measure},
  note: NoteNumber,
  info: NotesNumberInfo,
): SlotData {
  return {
    musicScore,
    grandStaff: measureSlot.grandStaff,
    singleStaff: measureSlot.singleStaff,
    measure: measureSlot.measure,
    note,
    info,
    self: info,
  }
}

export function applyMeasureAddAction(
  slot: SlotData & {measure: Measure},
  preview: GhostNumberPreview,
  musicScore: MusicScore,
): MeasureAddActionResult | null {
  const measure = slot.measure

  if (preview.snap.kind === 'insert') {
    const at = Math.max(0, Math.min(preview.snap.insertIndex, measure.notes.length))
    const note = createNoteNumber({
      syllable: preview.syllable,
      chronaxie: preview.chronaxie,
    })
    measure.notes.splice(at, 0, note)
    return {type: 'inserted'}
  }

  if (preview.slotKind === 'rest') return null

  const note = measure.notes[preview.snap.noteIndex]
  if (!note || !isNoteNumberSlot(note) || isSlotRestLike(note)) return null

  const existing = note.notesInfo.find((ni) => ni.syllable === preview.syllable && preview.syllable !== 'X')
  if (existing) {
    return {
      type: 'selectNote',
      slot: buildNumberHeadSlot(musicScore, slot, note, existing),
      notesNumberInfoId: existing.id,
    }
  }

  const lead = note.notesInfo[0]
  note.notesInfo.push(createNotesNumberInfo(preview.syllable, {
    chronaxie: lead?.chronaxie ?? preview.chronaxie,
    beamType: lead?.beamType,
  }))
  return {type: 'noteInfoAdded'}
}
