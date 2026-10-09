import type {OcarinaModel} from '../types'

export type OcarinaHole = {x: number; y: number; r: number}

export type OcarinaShape = {
  /** 机身外形：12 孔为圆角三角形（尖端朝上），吊坠为椭圆 */
  outline: 'triangle' | 'ellipse'
  /** 机身宽 / 高（不含吹口） */
  w: number
  bodyH: number
  /** 吹口：从机身底边中心向下伸出 */
  mouthW: number
  mouthH: number
  front: OcarinaHole[]
  /** 背面拇指孔：画在机身底部左右两侧 */
  back: OcarinaHole[]
}

export const OCARINA_PAD_TOP = 6
export const OCARINA_PAD_BOTTOM = 4

/**
 * 坐标原点 = 顶部中心，吹口朝下；孔顺序与指法字符串一致（正面在前，背面在后）。
 * 12 孔：左列左手、右列右手，食指靠吹口（下）、小指靠尖端（上），副孔贴在右食 / 右中外侧。
 */
export const OCARINA_SHAPES: Record<OcarinaModel, OcarinaShape> = {
  transverse12: {
    outline: 'triangle',
    w: 32,
    bodyH: 35,
    mouthW: 6,
    mouthH: 6,
    front: [
      {x: -7.5, y: 29, r: 2.1}, // 左食
      {x: -6, y: 23.5, r: 2.1}, // 左中
      {x: -4.5, y: 18, r: 2}, // 左无名
      {x: -3, y: 12.5, r: 1.6}, // 左小
      {x: 6, y: 29, r: 2.1}, // 右食
      {x: 4.8, y: 23.5, r: 2.1}, // 右中
      {x: 3.6, y: 18, r: 2}, // 右无名
      {x: 2.6, y: 12.5, r: 1.6}, // 右小
      {x: 10, y: 27.3, r: 1}, // 右食副孔
      {x: 8.4, y: 21.8, r: 1}, // 右中副孔
    ],
    back: [
      {x: -12, y: 39.5, r: 2.2}, // 左拇
      {x: 12, y: 39.5, r: 2.2}, // 右拇
    ],
  },
  pendant4: {
    outline: 'ellipse',
    w: 22,
    bodyH: 26,
    mouthW: 5,
    mouthH: 5,
    front: [
      {x: -4.5, y: 17, r: 2.8}, // 左食（靠吹口）
      {x: -4.5, y: 9, r: 2.4}, // 左中
      {x: 4.5, y: 17, r: 2.4}, // 右食（靠吹口）
      {x: 4.5, y: 9, r: 2}, // 右中
    ],
    back: [],
  },
}

/** 指法图总高（含吹口、底部两侧拇指孔，未缩放） */
export function ocarinaFingeringHeight(model: OcarinaModel): number {
  const shape = OCARINA_SHAPES[model]
  return Math.max(shape.bodyH + shape.mouthH, ...shape.back.map((h) => h.y + h.r + 0.6))
}

export function ocarinaSlotHeight(model: OcarinaModel): number {
  return OCARINA_PAD_TOP + ocarinaFingeringHeight(model) + OCARINA_PAD_BOTTOM
}
