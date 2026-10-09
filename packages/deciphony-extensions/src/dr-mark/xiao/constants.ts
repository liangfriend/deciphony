import type {XiaoModel} from '../types'

export const XIAO_HOLE_R = 3
export const XIAO_HOLE_GAP = 8
/** 正面图顶部留给超吹圆点的高度 */
export const XIAO_REGISTER_H = 6
/** 圆角矩形外框内边距 / 圆角 */
export const XIAO_FRAME_PAD = 3
export const XIAO_FRAME_RADIUS = 4
/** 左偏孔（背孔、八孔箫第一孔）相对中线的左移量 */
export const XIAO_SIDE_OFFSET = 2.5
export const XIAO_FRAME_W = 2 * XIAO_HOLE_R + 2 * XIAO_FRAME_PAD + 2 + XIAO_SIDE_OFFSET
/** 指法图宽（未缩放） */
export const XIAO_FINGERING_W = XIAO_FRAME_W
/** m-d 内上下留白 */
export const XIAO_PAD_TOP = 6
export const XIAO_PAD_BOTTOM = 4

/** 正面孔数（不含背孔） */
export const XIAO_FRONT_HOLES: Record<XiaoModel, number> = {
  hole8: 7,
  hole6: 5,
}

/** 正面最下一孔（第一孔）是否左偏 */
export const XIAO_LOW_HOLE_SIDE: Record<XiaoModel, boolean> = {
  hole8: true,
  hole6: false,
}

/** 孔所在行的中心 y：第 0 行 = 背孔（在正面最上一孔之上），正面孔从第 1 行起 */
export function xiaoHoleY(row: number): number {
  return XIAO_FRAME_PAD + XIAO_REGISTER_H + XIAO_HOLE_R + row * XIAO_HOLE_GAP
}

/** 单张指法图高度（含外框，未缩放） */
export function xiaoFingeringHeight(model: XiaoModel): number {
  return XIAO_REGISTER_H + XIAO_FRONT_HOLES[model] * XIAO_HOLE_GAP + 2 * XIAO_HOLE_R + 2 * XIAO_FRAME_PAD
}

export function xiaoSlotHeight(model: XiaoModel): number {
  return XIAO_PAD_TOP + xiaoFingeringHeight(model) + XIAO_PAD_BOTTOM
}
