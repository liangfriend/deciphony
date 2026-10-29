import {MusicScoreTypeEnum, SlurStyleEnum} from '@/enums/musicScoreEnum'
import type {VDom} from '@/types/common'

/** 简谱连音线：两端圆弧 + 中间横线；横向跟 start/end 的 x，高度跟两端 relative y 均值 */
export type NumberNotationSlurGeom = {
  x0: number
  x1: number
  yFoot: number
  yTop: number
  arc: number
  thickness: number
}

/** 三次贝塞尔逼近 1/4 圆的控制点系数 */
const QUARTER_CIRCLE_KAPPA = 0.5522847498

/** 简谱连音线两端圆弧半径上限（两端 1/4 圆的半径） */
const NUMBER_NOTATION_SLUR_ARC_MAX = 6

/**
 * 是否用圆润（rounded）连音线。
 * `style`（data.slur / special.slur）优先；未指定时按 `notationType === NumberNotation`。
 */
export function isNumberNotationSlur(
  notationType?: MusicScoreTypeEnum,
  style?: SlurStyleEnum,
): boolean {
  if (style === SlurStyleEnum.Rounded) return true
  if (style === SlurStyleEnum.Sharp) return false
  return notationType === MusicScoreTypeEnum.NumberNotation
}

/**
 * y = 基准（起止音符中更靠上的音符顶，engine 已写进两端）+ (relativeStartPoint.y + relativeEndPoint.y) / 2，两端同高。
 * controlPoint 不参与造型。
 */
export function numberNotationSlurGeom(vdom: VDom): NumberNotationSlurGeom {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const slur = vdom.special?.slur
  const relStartY = slur?.relativeStartPoint?.y ?? 0
  const relEndY = slur?.relativeEndPoint?.y ?? 0
  const x0 = Math.min(s.x, e.x)
  const x1 = Math.max(s.x, e.x)
  const span = Math.max(0, x1 - x0)
  // 两侧圆弧半径：尽量接近正圆，避免扁椭圆看起来尖
  const arc = Math.min(NUMBER_NOTATION_SLUR_ARC_MAX, span / 2)
  const rise = arc
  const yFoot = s.y - relStartY + (relStartY + relEndY) / 2
  const yTop = yFoot - rise
  const raw = slur?.thickness != null && slur.thickness > 0 ? slur.thickness : 2
  const thickness = raw / 2
  return {x0, x1, yFoot, yTop, arc, thickness}
}

type Point = {x: number; y: number}

/** 拱起的 y 方向：'up' → -1（往上拱），'down' → 1（往下拱） */
export function slurBulgeSign(vdom: VDom): 1 | -1 {
  return vdom.special?.slur?.direction === 'down' ? 1 : -1
}

/** 拱高：至少 8，跨度越大越高 */
function slurBulge(span: number): number {
  return Math.max(8, Math.abs(span) * 0.2)
}

/** 默认控制点（不含 relativeControlPoint）：x = 两端中点；y 在两端外侧（向上取较高端、向下取较低端）再拱 */
export function slurDefaultControlPoint(vdom: VDom): Point {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const sign = slurBulgeSign(vdom)
  const edgeY = sign < 0 ? Math.min(s.y, e.y) : Math.max(s.y, e.y)
  return {x: (s.x + e.x) / 2, y: edgeY + sign * slurBulge(e.x - s.x)}
}

export function isSplitSlur(vdom: VDom): boolean {
  return vdom.special?.slur?.split === true
}

/**
 * 分段连音线的两个断开点：起点 / 终点 ± splitGap，y = 各自端点 y。
 * 断开点跟着端点整体平移，每段是固定形状。
 */
export function splitSlurBreaks(vdom: VDom): {start: Point; end: Point} {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const gap = vdom.special?.slur?.splitGap ?? 0
  return {
    start: {x: s.x + gap, y: s.y},
    end: {x: e.x - gap, y: e.y},
  }
}

/** 分段拱高 = 同跨度整段的 2 倍（半段太短，按整段拱高会显得扁） */
const SPLIT_BULGE_SCALE = 2

/** 半段的虚拟控制点 y：以 p 和它关于 brk 的镜像点为两端的整段月牙，拱高放大 SPLIT_BULGE_SCALE */
function splitControlY(p: Point, brk: Point, sign: 1 | -1): number {
  return p.y + sign * SPLIT_BULGE_SCALE * slurBulge(2 * (brk.x - p.x))
}

/**
 * 端点 p 到断开点 brk 的半个月牙：取以 p 和它关于 brk 的镜像点为两端的完整月牙，
 * 在中点（t = 0.5）切开，保留靠 p 的一半；切口是竖直的一小段（月牙最厚处）。sign 为拱起方向（-1 上 / 1 下）。
 */
function halfCrescentPathD(p: Point, brk: Point, thickness: number, sign: 1 | -1): string {
  const cy = splitControlY(p, brk, sign)
  const midX = (p.x + brk.x) / 2
  const outerY = (p.y + cy) / 2
  const innerY = (p.y + cy - sign * thickness) / 2
  return `M ${p.x} ${p.y} Q ${midX} ${outerY} ${brk.x} ${outerY} L ${brk.x} ${innerY} Q ${midX} ${innerY} ${p.x} ${p.y} Z`
}

/** 五线谱 / 吉他谱 / 鼓谱分段连音线（填充）；顶点（文字锚点）为起点那段的切口外沿 */
export function splitSlurGeom(vdom: VDom): {d: string; apex: Point} {
  const slur = vdom.special?.slur
  const thickness = slur?.thickness != null ? slur.thickness : 4
  const sign = slurBulgeSign(vdom)
  const {start, end} = splitSlurBreaks(vdom)
  const s = vdom.startPoint
  const e = vdom.endPoint
  const cy = splitControlY(s, start, sign)
  return {
    d: `${halfCrescentPathD(s, start, thickness, sign)} ${halfCrescentPathD(e, end, thickness, sign)}`,
    apex: {x: start.x, y: (s.y + cy) / 2},
  }
}

function numberNotationHalfPathD(foot: Point, brk: Point): string {
  const dir = brk.x >= foot.x ? 1 : -1
  const arc = Math.min(NUMBER_NOTATION_SLUR_ARC_MAX, Math.abs(brk.x - foot.x))
  const yTop = foot.y - arc
  if (arc < 0.5) return `M ${foot.x} ${foot.y} L ${brk.x} ${foot.y}`
  const k = QUARTER_CIRCLE_KAPPA
  return [
    `M ${foot.x} ${foot.y}`,
    `C ${foot.x} ${foot.y - k * arc} ${foot.x + dir * k * arc} ${yTop} ${foot.x + dir * arc} ${yTop}`,
    `L ${brk.x} ${yTop}`,
  ].join(' ')
}

/** 简谱分段连音线（描边）：每段 = 端点处 1/4 圆 + 横线到断开点；顶点为起点那段横线中点 */
export function numberNotationSplitSlurGeom(vdom: VDom): {d: string; apex: Point; thickness: number} {
  const slur = vdom.special?.slur
  const raw = slur?.thickness != null && slur.thickness > 0 ? slur.thickness : 2
  const {start, end} = splitSlurBreaks(vdom)
  const s = vdom.startPoint
  const e = vdom.endPoint
  const arc = Math.min(NUMBER_NOTATION_SLUR_ARC_MAX, Math.abs(start.x - s.x))
  return {
    d: `${numberNotationHalfPathD(s, start)} ${numberNotationHalfPathD(e, end)}`,
    apex: {x: (s.x + start.x) / 2, y: s.y - arc},
    thickness: raw / 2,
  }
}

/**
 * 描边路径：左 1/4 圆 → 中间横线 → 右 1/4 圆。
 * 端点用 stroke-linecap=round，不再收成尖角。
 */
export function numberNotationSlurPathD(g: NumberNotationSlurGeom): string {
  const {x0, x1, yFoot, yTop, arc} = g
  if (arc < 0.5) {
    return `M ${x0} ${yTop} L ${x1} ${yTop}`
  }
  const k = QUARTER_CIRCLE_KAPPA
  const h = yFoot - yTop
  return [
    `M ${x0} ${yFoot}`,
    // 左：下 → 上右（1/4 圆）
    `C ${x0} ${yFoot - k * h} ${x0 + k * arc} ${yTop} ${x0 + arc} ${yTop}`,
    `L ${x1 - arc} ${yTop}`,
    // 右：左 → 下（1/4 圆）
    `C ${x1 - k * arc} ${yTop} ${x1} ${yTop + k * h} ${x1} ${yFoot}`,
  ].join(' ')
}
