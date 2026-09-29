import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import type {VDom} from '@/types/common'

/** 简谱连音线：两端圆弧 + 中间横线；只跟 start/end 的 x 有关 */
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

export function isNumberNotationSlur(notationType?: MusicScoreTypeEnum): boolean {
  return notationType === MusicScoreTypeEnum.NumberNotation
}

/**
 * y 取起点音符顶（去掉 relativeStartPoint.y），两端同高。
 * controlPoint / endPoint.y / startPoint.y 的拖拽偏移都不参与造型。
 */
export function numberNotationSlurGeom(vdom: VDom): NumberNotationSlurGeom {
  const s = vdom.startPoint
  const e = vdom.endPoint
  const slur = vdom.special?.slur
  const relStartY = slur?.relativeStartPoint?.y ?? 0
  const x0 = Math.min(s.x, e.x)
  const x1 = Math.max(s.x, e.x)
  const span = Math.max(0, x1 - x0)
  // 两侧圆弧半径：尽量接近正圆，避免扁椭圆看起来尖
  const arc = Math.min(12, span / 2)
  const rise = arc
  const yFoot = s.y - relStartY
  const yTop = yFoot - rise
  const raw = slur?.thickness != null && slur.thickness > 0 ? slur.thickness : 2
  const thickness = raw / 2
  return {x0, x1, yFoot, yTop, arc, thickness}
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
