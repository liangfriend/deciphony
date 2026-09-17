import {MusicScoreTypeEnum} from '@/enums/musicScoreEnum'
import type {VDom} from '@/types/common'

/** 简谱连音线：两端弧 + 中间横线；只跟 start/end 的 x 有关 */
export type NumberNotationSlurGeom = {
  x0: number
  x1: number
  yFoot: number
  yTop: number
  arc: number
  thickness: number
}

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
  const arc = Math.min(10, span / 2)
  const rise = Math.min(10, Math.max(arc, span > 0 ? 8 : 0))
  const yFoot = s.y - relStartY
  const yTop = yFoot - rise
  // 简谱填充带子比五线谱月牙更“实”，同样数值会显得更粗；视觉上按一半画
  const raw = slur?.thickness != null && slur.thickness > 0 ? slur.thickness : 2
  const thickness = raw / 2
  return {x0, x1, yFoot, yTop, arc, thickness}
}

/** 填充路径：左弧 → 横线 → 右弧，厚度为一条等宽带子 */
export function numberNotationSlurPathD(g: NumberNotationSlurGeom): string {
  const {x0, x1, yFoot, yTop, arc, thickness} = g
  const yOuter = yTop - thickness
  if (arc < 0.5) {
    return `M ${x0} ${yTop} L ${x1} ${yTop} L ${x1} ${yOuter} L ${x0} ${yOuter} Z`
  }
  return [
    `M ${x0} ${yFoot}`,
    `Q ${x0} ${yOuter} ${x0 + arc} ${yOuter}`,
    `L ${x1 - arc} ${yOuter}`,
    `Q ${x1} ${yOuter} ${x1} ${yFoot}`,
    `Q ${x1} ${yTop} ${x1 - arc} ${yTop}`,
    `L ${x0 + arc} ${yTop}`,
    `Q ${x0} ${yTop} ${x0} ${yFoot}`,
    'Z',
  ].join(' ')
}
