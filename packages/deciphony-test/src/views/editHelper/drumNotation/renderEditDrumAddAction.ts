import {defaultSkin, DrumHeadTypeEnum, slotSymbol} from '@deciphony/renderer'
import type {Chronaxie, Measure, MeasureNoteSlot, SlotData, VDom} from '@deciphony/renderer'
import {
  appendDrumNotesInfo,
  getDrumVoiceSlots,
  insertDrumNote,
  insertDrumRest,
  isDrumNoteBody,
  isDrumRestBody,
  type DrumVoice,
} from '@deciphony/extensions/dr-edit'
import {DEFAULT_ADD_DRUM_STATE, type AddDrumState, type DrumAddKind} from './renderEditDrumAddState'
import {
  computeSnapPoints,
  findMeasureSlotVDom,
  isMeasureAddMode,
  isPointerInMeasureAddRange,
  nearestSnapPoint,
  type MeasureBounds,
  type SlotAnchor,
  type SnapPoint,
} from '../standardStaff/renderEditSymbolAddAction'
import {tabStaffFrame} from '../tab/renderEditTabAddAction'

type SkinGlyph = {content: string; w: number; h: number}

const MEASURE_LINE_WIDTH = 1
/** 与 renderer 鼓谱 MIN_STEM_HEIGHT_RATIO 一致 */
const MIN_STEM_HEIGHT_RATIO = 7 / 8
/** 与 renderer 鼓谱 STEM_Y_OFFSET 一致 */
const STEM_Y_OFFSET = 0.05
const AUGMENTATION_DOT_GAP = 1 / 16
const STEM_WIDTH = 1
const GHOST_REGION_MIN = -6
const GHOST_REGION_MAX = 14

const HEAD_SKIN_KEY: Record<DrumHeadTypeEnum, string> = {
  [DrumHeadTypeEnum.Normal]: 'drumHead_normal',
  [DrumHeadTypeEnum.Cross]: 'drumHead_cross',
  [DrumHeadTypeEnum.CircledCross]: 'drumHead_circledCross',
  [DrumHeadTypeEnum.CircledSlash]: 'drumHead_circledSlash',
  [DrumHeadTypeEnum.Triangle]: 'drumHead_triangle',
  [DrumHeadTypeEnum.Diamond]: 'drumHead_diamond',
}

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

const TAIL_INDEX: Partial<Record<Chronaxie, number>> = {32: 1, 16: 2, 8: 3, 4: 4, 2: 5, 1: 6}

function drumSkinGlyph(key: string): SkinGlyph | null {
  const pack = defaultSkin.drumNotation as Record<string, SkinGlyph> | undefined
  const item = pack?.[key]
  if (!item?.content) return null
  return item
}

/** 与 renderer 鼓谱 noteCenterY 同网格（相对小节顶部）：0 为底线，8 为顶线 */
export function drumRegionCenterY(region: number, measureHeight: number): number {
  const lw = MEASURE_LINE_WIDTH
  return measureHeight - lw / 2 - region * ((measureHeight - 5 * lw) / 8 + lw / 2)
}

export function drumRegionFromRelativeY(relativeY: number, measureHeight: number): number {
  const lw = MEASURE_LINE_WIDTH
  const step = (measureHeight - 5 * lw) / 8 + lw / 2
  const region = Math.round((measureHeight - lw / 2 - relativeY) / step)
  return Math.max(GHOST_REGION_MIN, Math.min(GHOST_REGION_MAX, region))
}

function stemAttachY(headType: DrumHeadTypeEnum, headY: number, headH: number, voice: DrumVoice, mH: number): number {
  const centerY = headY + headH / 2
  switch (headType) {
    case DrumHeadTypeEnum.Cross:
      return voice === 'up' ? headY : headY + headH
    case DrumHeadTypeEnum.CircledCross:
    case DrumHeadTypeEnum.CircledSlash:
    case DrumHeadTypeEnum.Diamond:
      return centerY
    case DrumHeadTypeEnum.Triangle:
      return headY + headH
    default:
      return voice === 'up' ? centerY - STEM_Y_OFFSET * mH : centerY + STEM_Y_OFFSET * mH
  }
}

function ledgerLinesSvg(region: number, centerX: number, headW: number, mH: number): string {
  const lines: number[] = []
  if (region < -1) for (let line = -2; line >= region; line -= 2) lines.push(line)
  if (region > 9) for (let line = 10; line <= region; line += 2) lines.push(line)
  const half = headW / 2 + 3
  return lines
    .map((line) => {
      const y = drumRegionCenterY(line, mH)
      return `<line x1="${centerX - half}" y1="${y}" x2="${centerX + half}" y2="${y}" stroke="black" stroke-width="1"/>`
    })
    .join('')
}

function dotsSvg(dot: number, leftX: number, region: number, mH: number): string {
  if (!dot) return ''
  let y = drumRegionCenterY(region, mH)
  if (region % 2 === 0) y -= mH / 8
  const gap = AUGMENTATION_DOT_GAP * mH
  let out = ''
  for (let i = 0; i < dot; i++) {
    const cx = leftX + gap + 1.5 + i * 5
    out += `<circle cx="${cx}" cy="${y}" r="1.5" fill="black"/>`
  }
  return out
}

/** 鼓谱音符幽灵：音符头 + 符干 + 符尾 + 加线 + 附点；坐标相对小节顶部，x 以音符头左缘为 0 */
function drumNoteGhostSvg(state: AddDrumState, region: number, mH: number): {svg: string; headW: number} {
  const head = drumSkinGlyph(HEAD_SKIN_KEY[state.headType]) ?? drumSkinGlyph(HEAD_SKIN_KEY[DrumHeadTypeEnum.Normal])
  const headW = head?.w ?? 12
  const headH = head?.h ?? 10
  const centerY = drumRegionCenterY(region, mH)
  const headY = centerY - headH / 2
  const parts: string[] = []
  parts.push(ledgerLinesSvg(region, headW / 2, headW, mH))
  if (head) parts.push(`<g transform="translate(0, ${headY})">${head.content}</g>`)

  const up = state.voice === 'up'
  const staffCenterY = mH / 2
  const elongation = mH / 4
  const stemLength = Math.max(
    up ? centerY - staffCenterY + elongation : staffCenterY - centerY + elongation,
    MIN_STEM_HEIGHT_RATIO * mH,
  )
  const attachY = stemAttachY(state.headType, headY, headH, state.voice, mH)
  const tailIndex = TAIL_INDEX[state.chronaxie]
  if (up) {
    const stemX = headW - STEM_WIDTH
    const stemTop = centerY - stemLength
    parts.push(`<rect x="${stemX}" y="${stemTop}" width="${STEM_WIDTH}" height="${Math.max(0, attachY - stemTop)}" fill="black"/>`)
    const tail = tailIndex ? drumSkinGlyph(`noteTail_${tailIndex}`) : null
    if (tail) {
      let offset = 0
      if (state.chronaxie === 2) offset = mH / 8
      if (state.chronaxie === 1) offset = mH * 2 / 8
      parts.push(`<g transform="translate(${stemX}, ${stemTop - offset})">${tail.content}</g>`)
    }
  } else {
    const stemX = 0
    const stemH = Math.max(0, centerY + stemLength - attachY)
    parts.push(`<rect x="${stemX}" y="${attachY}" width="${STEM_WIDTH}" height="${stemH}" fill="black"/>`)
    const tail = tailIndex ? drumSkinGlyph(`noteTail_${tailIndex}_r`) : null
    if (tail) {
      let offset = 0
      if (state.chronaxie === 8) offset = mH / 8
      if (state.chronaxie === 4) offset = mH * 2 / 8
      if (state.chronaxie === 2) offset = mH * 3 / 8
      if (state.chronaxie === 1) offset = mH * 4 / 8
      parts.push(`<g transform="translate(${stemX}, ${attachY + stemH - tail.h + offset})">${tail.content}</g>`)
    }
  }
  parts.push(dotsSvg(state.dot, headW, region, mH))
  return {svg: parts.join(''), headW}
}

function drumRestGhostSvg(state: AddDrumState, region: number, mH: number): {svg: string; w: number} {
  const glyph = drumSkinGlyph(REST_SKIN_KEY[state.chronaxie] ?? 'rest_3')
  const w = glyph?.w ?? 8
  const h = glyph?.h ?? 10
  const y = drumRegionCenterY(region, mH) - h / 2
  const body = glyph ? `<g transform="translate(0, ${y})">${glyph.content}</g>` : ''
  return {svg: body + dotsSvg(state.dot, w, region, mH), w}
}

export type GhostDrumPreview = {
  visible: true
  measureId: string
  voice: DrumVoice
  kind: DrumAddKind
  headType: DrumHeadTypeEnum
  chronaxie: Chronaxie
  dot: 0 | 1 | 2
  region: number
  /** 相对小节插槽左上角；svgHtml 内 y 已相对小节顶部 */
  x: number
  y: number
  svgHtml: string
  snap: SnapPoint
}

function collectDrumAnchors(vDomList: VDom[], slots: MeasureNoteSlot[], measureX: number): SlotAnchor[] {
  const anchors: SlotAnchor[] = []
  for (let noteIndex = 0; noteIndex < slots.length; noteIndex++) {
    const body = slotSymbol(slots[noteIndex]!)
    let id: string | undefined
    let tag: VDom['tag']
    if (isDrumNoteBody(body)) {
      id = body.notesInfo[0]?.id
      tag = 'noteHead'
    } else if (isDrumRestBody(body)) {
      id = body.id
      tag = 'rest'
    } else {
      continue
    }
    if (!id) continue
    const vdom = vDomList.find((node) => node.targetId === id && node.tag === tag)
    if (!vdom) continue
    anchors.push({
      centerX: vdom.x + vdom.w / 2 - measureX,
      noteIndex,
      isNoteSymbol: isDrumNoteBody(body),
    })
  }
  return anchors
}

function voiceSlotsReadonly(measure: Measure, voice: DrumVoice): MeasureNoteSlot[] {
  const notes = measure.notes
  if (Array.isArray(notes)) return voice === 'up' ? notes : []
  return notes[voice] ?? []
}

export function resolveGhostDrumPreview(params: {
  selected: SlotData | null
  vDomList: VDom[]
  svgX: number
  svgY: number
  measureBounds: MeasureBounds
  addDrumState?: AddDrumState
}): GhostDrumPreview | null {
  const {selected, vDomList, svgX, svgY, measureBounds, addDrumState = DEFAULT_ADD_DRUM_STATE} = params
  if (!isMeasureAddMode(selected)) return null
  const measure = selected.measure
  if (measure.longRest) return null
  const measureNode = findMeasureSlotVDom(vDomList, measure.id)
  if (!measureNode || !isPointerInMeasureAddRange(svgX, svgY, measureBounds)) return null

  const staff = tabStaffFrame(vDomList, measure.id) ?? {
    x: measureNode.x,
    y: measureNode.y,
    w: measureNode.w,
    h: measureNode.h,
  }
  const mH = staff.h
  const relativeX = svgX - measureNode.x
  const region = drumRegionFromRelativeY(svgY - staff.y, mH)
  const voice = addDrumState.voice
  const anchors = collectDrumAnchors(vDomList, voiceSlotsReadonly(measure, voice), measureNode.x)
  let snapPoints = computeSnapPoints(measureNode.w, anchors)
  if (addDrumState.kind === 'rest') {
    const inserts = snapPoints.filter((point) => point.kind === 'insert')
    if (inserts.length) snapPoints = inserts
  }
  const snap = nearestSnapPoint(relativeX, snapPoints)
  const common = {
    visible: true as const,
    measureId: measure.id,
    voice,
    kind: addDrumState.kind,
    headType: addDrumState.headType,
    chronaxie: addDrumState.chronaxie,
    dot: addDrumState.dot,
    region,
    y: staff.y - measureNode.y,
    snap,
  }

  if (addDrumState.kind === 'rest') {
    const {svg, w} = drumRestGhostSvg(addDrumState, region, mH)
    return {...common, x: snap.x - w / 2, svgHtml: svg}
  }
  const {svg, headW} = drumNoteGhostSvg(addDrumState, region, mH)
  return {...common, x: snap.x - headW / 2, svgHtml: svg}
}

export type DrumMeasureAddResult =
  | {type: 'inserted'}
  | {type: 'select'; notesInfoId: string}

/** 小节添加模式点击：插入音符 / 休止符，或向已有音符追加音符头（保持小节选中）；同线位已有音符头则选中它 */
export function applyDrumMeasureAddAction(
  slot: SlotData & {measure: Measure},
  preview: GhostDrumPreview,
): DrumMeasureAddResult | null {
  const measure = slot.measure
  const slots = getDrumVoiceSlots(measure, preview.voice)
  const dot = preview.dot || undefined

  if (preview.snap.kind === 'insert') {
    const at = Math.max(0, Math.min(preview.snap.insertIndex, slots.length))
    if (preview.kind === 'rest') {
      insertDrumRest(measure, preview.voice, at, {
        chronaxie: preview.chronaxie,
        region: preview.region,
        augmentationDot: dot,
      })
    } else {
      insertDrumNote(measure, preview.voice, at, {
        region: preview.region,
        headType: preview.headType,
        chronaxie: preview.chronaxie,
        augmentationDot: dot,
      })
    }
    return {type: 'inserted'}
  }

  if (preview.kind === 'rest') return null
  const body = slotSymbol(slots[preview.snap.noteIndex]!)
  if (!isDrumNoteBody(body)) return null
  const same = body.notesInfo.find((info) => info.region === preview.region)
  if (same) return {type: 'select', notesInfoId: same.id}
  const info = appendDrumNotesInfo(body, {region: preview.region, headType: preview.headType})
  return info ? {type: 'inserted'} : null
}
