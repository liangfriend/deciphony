export type FingerPose2 = [x: number, y: number, a0: number, a1: number]
export type FingerPose3 = [x: number, y: number, a0: number, a1: number, a2: number]
export type FingerPose = number[]

export type FingerMode = 'show' | 'edit'

export interface FingerProps {
  /** 同时控制组件宽高和 svg 画布像素 */
  width?: number
  height?: number
  /** show：仅展示；edit：显示关节点，跟点拖拽、其余点旋转 */
  mode?: FingerMode
  /** [x, y, ...从根到指甲的关节角]，角度单位度；0° 时部件朝左 */
  thumbF?: FingerPose
  indexF?: FingerPose
  middleF?: FingerPose
  ringF?: FingerPose
  littleF?: FingerPose
  /** 过渡秒数，监测到 pose / fingerSize 变化后插值；edit 模式下不插值 */
  duration?: number
  /** 大拇指宽度（画布像素），其余长宽按其比例缩放 */
  fingerSize?: number
}
