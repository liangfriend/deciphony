import type {Measure, NoteNumber, NotesNumberInfo, SlotData, VDom} from 'deciphony-renderer'
import {
  pointerToSvg,
  resolveMeasureBounds,
  type MeasureBounds,
} from './renderEditNumberAddAction'

type DiatonicSyllable = Exclude<NotesNumberInfo['syllable'], 0 | 'X'>

const OCTAVE_DOT_MIN = -5
const OCTAVE_DOT_MAX = 6
/** 绝对音高刻度上下界（octaveDot*7 + syllable-1） */
const ABS_INDEX_MIN = OCTAVE_DOT_MIN * 7
const ABS_INDEX_MAX = OCTAVE_DOT_MAX * 7 + 6

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
  /** 拖拽起点（首次 update 时按当前指针与音高锚定，保证绝对映射、不累加） */
  startSvgY: number | null
  startAbsIndex: number
}

/** 把唱名(1-7)+八度点编码为绝对音高刻度 */
function toAbsIndex(syllable: DiatonicSyllable, octaveDot: number): number {
  return octaveDot * 7 + (syllable - 1)
}

/** 绝对音高刻度分解回唱名(1-7)+八度点 */
function fromAbsIndex(absIndex: number): {syllable: DiatonicSyllable; octaveDot: number} {
  const octaveDot = Math.floor(absIndex / 7)
  const syllable = (absIndex - octaveDot * 7 + 1) as DiatonicSyllable
  return {syllable, octaveDot}
}

export function createNumberHeadDragSession(
  event: PointerEvent,
  slot: SlotData & {info: NotesNumberInfo; note: NoteNumber; measure: Measure},
): NumberHeadDragSession {
  const info = slot.info
  const startAbsIndex = info.syllable === 0 || info.syllable === 'X'
    ? 0
    : toAbsIndex(info.syllable, info.octaveDot ?? 0)
  return {
    pointerId: event.pointerId,
    notesNumberInfoId: info.id,
    info,
    note: slot.note,
    measureId: slot.measure.id,
    startSvgY: null,
    startAbsIndex,
  }
}

/**
 * 上下拖拽改音高（绝对映射，不累加）：
 * 相对拖拽起点每移动一格改 1 级唱名；唱名越过 1↔7 边界时八度点 ∓1 并环绕。
 * 休止符 / 节奏音符不修改。
 */
export function updateNumberHeadSyllableByPointerY(
  session: NumberHeadDragSession,
  bounds: MeasureBounds,
  svgY: number,
): DiatonicSyllable | null {
  const info = session.info
  if (info.syllable === 0 || info.syllable === 'X') return null

  if (session.startSvgY == null) {
    session.startSvgY = svgY
    session.startAbsIndex = toAbsIndex(info.syllable, info.octaveDot ?? 0)
  }

  // 小节内 7 个唱名位，每格高度 = h / 6；向上(svgY 变小)音高升高
  const stepHeight = bounds.h / 6
  if (stepHeight <= 0) return null
  const steps = Math.round((session.startSvgY - svgY) / stepHeight)

  const targetAbsIndex = Math.max(
    ABS_INDEX_MIN,
    Math.min(ABS_INDEX_MAX, session.startAbsIndex + steps),
  )
  const {syllable, octaveDot} = fromAbsIndex(targetAbsIndex)

  if (info.syllable === syllable && (info.octaveDot ?? 0) === octaveDot) return null
  info.syllable = syllable
  info.octaveDot = octaveDot as NotesNumberInfo['octaveDot']
  return syllable
}

export function updateNumberHeadDragFromPointer(
  session: NumberHeadDragSession,
  svg: SVGSVGElement,
  root: ParentNode,
  vDomList: VDom[],
  clientX: number,
  clientY: number,
): DiatonicSyllable | null {
  const bounds = resolveMeasureBounds(root, session.measureId, vDomList)
  if (!bounds) return null
  const {y} = pointerToSvg(svg, clientX, clientY)
  return updateNumberHeadSyllableByPointerY(session, bounds, y)
}
