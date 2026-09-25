import {NoteSymbolTypeEnum} from '@deciphony/renderer'
import type {Chronaxie, Measure, MusicScore, SlotData, TabNote, TabNoteInfo, VDom} from '@deciphony/renderer'
import {defaultSkin} from '@deciphony/renderer'
import {
  appendTabNoteInfo,
  insertTabNote,
  insertTabRest,
  isTabHeadInfo,
} from '@deciphony/extensions/dr-edit'
import type {AddTabState, TabAddKind} from './renderEditTabAddState'
import {DEFAULT_ADD_TAB_STATE} from './renderEditTabAddState'
import {
  computeSnapPoints,
  findMeasureSlotVDom,
  findMeasureVDom,
  isMeasureAddMode,
  isPointerInMeasureAddRange,
  nearestSnapPoint,
  type MeasureBounds,
  type SlotAnchor,
  type SnapPoint,
} from '../standardStaff/renderEditSymbolAddAction'

const LINE_WIDTH = 1

const REST_SKIN_KEY: Record<Chronaxie, string> = {
  256: 'rest_1',
  128: 'rest_2',
  64: 'rest_3',
  32: 'rest_4',
  16: 'rest_5',
  8: 'rest_6',
  4: 'rest_7',
  2: 'rest_8',
  1: 'rest_9',
}

type SkinGlyph = {content: string; w: number; h: number}

function tabSkinGlyph(key: string): SkinGlyph | null {
  const pack = defaultSkin.tab6 as Record<string, SkinGlyph> | undefined
  const item = pack?.[key]
  if (!item?.content) return null
  return item
}

export function tabStringCenterY(region: number, measureHeight: number, stringCount: number): number {
  const gaps = Math.max(1, stringCount - 1)
  const step = (measureHeight - stringCount * LINE_WIDTH) / gaps + LINE_WIDTH
  return measureHeight - LINE_WIDTH / 2 - region * step
}

/** 弦位纵向用小节线框高度。m 插槽高度可能为 0，不能拿来换算 region。 */
export function tabStaffFrame(
  vDomList: VDom[],
  measureId: string,
): {x: number; y: number; w: number; h: number} | null {
  const slot = findMeasureSlotVDom(vDomList, measureId)
  const staff = findMeasureVDom(vDomList, measureId)
  if (!slot && !staff) return null
  return {
    x: slot?.x ?? staff?.x ?? 0,
    y: staff?.y ?? slot?.y ?? 0,
    w: slot?.w ?? staff?.w ?? 0,
    h: staff?.h && staff.h > 0 ? staff.h : (slot?.h ?? 0),
  }
}

export function tabRegionFromRelativeY(relativeY: number, measureHeight: number, stringCount: number): number {
  const gaps = Math.max(1, stringCount - 1)
  const step = (measureHeight - stringCount * LINE_WIDTH) / gaps + LINE_WIDTH
  const raw = (measureHeight - LINE_WIDTH / 2 - relativeY) / step
  const region = Math.round(raw)
  if (region < 0) return 0
  if (region > stringCount - 1) return stringCount - 1
  return region
}

function fretSkinKey(kind: 'normal' | 'harmonic', fret: number): string {
  const prefix = kind === 'harmonic' ? 'tab_harmonic' : 'tab_note'
  if (fret < 0) return `${prefix}_x`
  return `${prefix}_${Math.min(27, fret)}`
}

/** 琶音 / 扫弦幽灵：都向上；琶音弯折波浪，扫弦直线 */
function spanGhostSvg(height: number, kind: 'arpeggio' | 'strumming'): string {
  const cx = 4
  const headLen = 7
  const shaftBottom = height
  const shaftTop = headLen
  const tip = `M ${cx - 4} ${headLen} L ${cx} 0 L ${cx + 4} ${headLen}`
  if (kind === 'strumming') {
    return `<g>
      <line x1="${cx}" y1="${shaftBottom}" x2="${cx}" y2="${shaftTop}" stroke="#303133" stroke-width="1.5" stroke-linecap="round"/>
      <path d="${tip}" fill="none" stroke="#303133" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`
  }
  // 琶音：自下而上的波浪线（与 arpeggio.vue 同向：箭头朝上）
  const amplitude = 3.2
  const n = Math.max(3, Math.round((shaftBottom - shaftTop) / 10))
  const step = (shaftBottom - shaftTop) / n
  let shaft = `M ${cx} ${shaftBottom}`
  for (let i = 0; i < n; i++) {
    const y0 = shaftBottom - step * i
    const y1 = shaftBottom - step * (i + 1)
    const sign = i % 2 === 0 ? 1 : -1
    const midY = (y0 + y1) / 2
    shaft += ` Q ${cx + sign * amplitude} ${midY} ${cx} ${y1}`
  }
  return `<g>
    <path d="${shaft}" fill="none" stroke="#303133" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${tip}" fill="none" stroke="#303133" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`
}

export type GhostTabPreview = {
  visible: true
  measureId: string
  kind: TabAddKind
  x: number
  y: number
  region: number
  chronaxie: Chronaxie
  value: number
  regionStart: number
  regionEnd: number
  svgHtml: string
  snap: SnapPoint
}

function asTabNote(slot: Measure['notes'][number]): TabNote | null {
  if ('isSlap' in slot && 'notesInfo' in slot) return slot as unknown as TabNote
  return null
}

function collectTabAnchors(vDomList: VDom[], measure: Measure, measureX: number): SlotAnchor[] {
  const anchors: SlotAnchor[] = []
  for (let noteIndex = 0; noteIndex < measure.notes.length; noteIndex++) {
    const slot = measure.notes[noteIndex]!
    let id: string | undefined
    let tags: VDom['tag'][]
    const tabNote = asTabNote(slot)
    if (tabNote) {
      id = tabNote.notesInfo[0]?.id
      const info = tabNote.notesInfo[0]
      if (info?.type === 'arpeggio') tags = ['arpeggio']
      else if (info?.type === 'strumming') tags = ['strumming']
      else tags = ['tabNoteNumber', 'noteHead']
    } else if ('type' in slot && slot.type === NoteSymbolTypeEnum.Rest) {
      id = slot.id
      tags = ['rest']
    } else {
      continue
    }
    if (!id) continue
    const vdom = vDomList.find((node) => node.targetId === id && tags.includes(node.tag))
    if (!vdom) continue
    const centerX = vdom.tag === 'arpeggio' || vdom.tag === 'strumming'
      ? (vdom.startPoint?.x ?? vdom.x) - measureX
      : vdom.x + vdom.w / 2 - measureX
    anchors.push({
      centerX,
      noteIndex,
      isNoteSymbol: tabNote != null,
    })
  }
  return anchors
}

export function resolveGhostTabPreview(params: {
  selected: SlotData | null
  vDomList: VDom[]
  svgX: number
  svgY: number
  measureBounds: MeasureBounds
  addTabState?: AddTabState
  stringCount: number
}): GhostTabPreview | null {
  const {
    selected,
    vDomList,
    svgX,
    svgY,
    measureBounds,
    addTabState = DEFAULT_ADD_TAB_STATE,
    stringCount,
  } = params
  if (!isMeasureAddMode(selected)) return null
  const measure = selected.measure
  const measureNode = findMeasureSlotVDom(vDomList, measure.id)
  if (!measureNode || !isPointerInMeasureAddRange(svgX, svgY, measureBounds)) return null

  const staff = tabStaffFrame(vDomList, measure.id) ?? {
    x: measureNode.x,
    y: measureNode.y,
    w: measureNode.w,
    h: measureNode.h,
  }
  const relativeX = svgX - measureNode.x
  const relativeY = svgY - staff.y
  const anchors = collectTabAnchors(vDomList, measure, measureNode.x)
  let snapPoints = computeSnapPoints(measureNode.w, anchors)
  const geometry = addTabState.kind === 'arpeggio'
    || addTabState.kind === 'strumming'
    || addTabState.kind === 'rest'
  if (geometry) {
    const inserts = snapPoints.filter((point) => point.kind === 'insert')
    if (inserts.length) snapPoints = inserts
  }
  const snap = nearestSnapPoint(relativeX, snapPoints)
  const region = tabRegionFromRelativeY(relativeY, staff.h, stringCount)

  if (addTabState.kind === 'rest') {
    const glyph = tabSkinGlyph(REST_SKIN_KEY[addTabState.chronaxie] ?? 'rest_3')
    const w = glyph?.w ?? 8
    const h = glyph?.h ?? 10
    return {
      visible: true,
      measureId: measure.id,
      kind: 'rest',
      x: snap.x - w / 2,
      y: (staff.h - h) / 2,
      region: 0,
      chronaxie: addTabState.chronaxie,
      value: 0,
      regionStart: 0,
      regionEnd: stringCount - 1,
      svgHtml: glyph?.content ?? '',
      snap,
    }
  }

  if (addTabState.kind === 'arpeggio' || addTabState.kind === 'strumming') {
    const y0 = tabStringCenterY(0, staff.h, stringCount)
    const yN = tabStringCenterY(stringCount - 1, staff.h, stringCount)
    const top = Math.min(y0, yN)
    const height = Math.max(8, Math.abs(yN - y0))
    return {
      visible: true,
      measureId: measure.id,
      kind: addTabState.kind,
      x: snap.x - 4,
      y: top,
      region,
      chronaxie: addTabState.chronaxie,
      value: 0,
      regionStart: addTabState.regionStart,
      regionEnd: addTabState.regionEnd,
      svgHtml: spanGhostSvg(height, addTabState.kind),
      snap,
    }
  }

  const glyph = tabSkinGlyph(fretSkinKey(addTabState.kind, addTabState.fret))
  const w = glyph?.w ?? 8
  const h = glyph?.h ?? 16
  const centerY = tabStringCenterY(region, staff.h, stringCount)
  return {
    visible: true,
    measureId: measure.id,
    kind: addTabState.kind,
    x: snap.x - w / 2,
    y: centerY - h / 2,
    region,
    chronaxie: addTabState.chronaxie,
    value: addTabState.fret,
    regionStart: addTabState.regionStart,
    regionEnd: addTabState.regionEnd,
    svgHtml: glyph?.content ?? '',
    snap,
  }
}

export type TabMeasureAddResult =
  | {type: 'inserted'}
  | {type: 'select'; notesInfoId: string}

export function applyTabMeasureAddAction(
  slot: SlotData & {measure: Measure},
  preview: GhostTabPreview,
  stringCount: number,
  musicScore: MusicScore,
): TabMeasureAddResult | null {
  const measure = slot.measure
  const at = preview.snap.kind === 'insert'
    ? Math.max(0, Math.min(preview.snap.insertIndex, measure.notes.length))
    : preview.snap.noteIndex

  if (preview.kind === 'rest' || preview.snap.kind === 'insert') {
    if (preview.kind === 'rest') {
      insertTabRest(measure, preview.snap.kind === 'insert' ? at : measure.notes.length, preview.chronaxie)
    } else if (preview.snap.kind === 'insert') {
      insertTabNote(measure, at, {
        kind: preview.kind,
        chronaxie: preview.chronaxie,
        value: preview.value,
        region: preview.region,
        regionStart: preview.regionStart,
        regionEnd: preview.regionEnd,
        stringCount,
      })
    }
    void musicScore
    return {type: 'inserted'}
  }

  const note = asTabNote(measure.notes[preview.snap.noteIndex]!)
  if (!note) {
    insertTabNote(measure, measure.notes.length, {
      kind: preview.kind,
      chronaxie: preview.chronaxie,
      value: preview.value,
      region: preview.region,
      stringCount,
    })
    return {type: 'inserted'}
  }

  const same = note.notesInfo.find((info) => isTabHeadInfo(info) && info.region === preview.region)
  if (same) return {type: 'select', notesInfoId: same.id}

  const info = appendTabNoteInfo(note, {
    kind: preview.kind === 'harmonic' ? 'harmonic' : 'normal',
    chronaxie: preview.chronaxie,
    value: preview.value,
    region: preview.region,
    stringCount,
    beamType: note.notesInfo[0]?.beamType,
  })
  return {type: 'select', notesInfoId: info.id}
}
