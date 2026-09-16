import type {FingerPart} from './parts'

/** 度 → 弧度 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** 弧度 → 度 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/**
 * 部件朝左（局部 -X）。绝对角 θ（度，SVG 顺时针）下，
 * 从枢轴到下一枢轴的画布位移 = size * length * (-cos θ, -sin θ)。
 */
export function boneOffset(
  absAngleDeg: number,
  length: number,
  size: number,
): {dx: number; dy: number} {
  const rad = degToRad(absAngleDeg)
  const dist = size * length
  return {dx: -dist * Math.cos(rad), dy: -dist * Math.sin(rad)}
}

/**
 * 由父子枢轴向量反推绝对角（度）。
 * 与 boneOffset 互逆：朝左为 0°。
 */
export function absAngleFromDelta(dx: number, dy: number): number {
  return radToDeg(Math.atan2(-dy, -dx))
}

export type JointHandleKind = 'root' | 'rotate'

export type JointHandle = {
  /** 画布坐标 */
  x: number
  y: number
  /** 0 = 跟点；1..n = 第 i 段远端枢轴 / 指尖（拖拽改 angles[i-1]） */
  index: number
  kind: JointHandleKind
}

/**
 * 计算一根手指全部关节连接点（跟点 + 各段远端）。
 * pose: [x, y, ...angles]；angles 为相对父关节的旋转角（度）。
 */
export function computeJointHandles(
  pose: number[],
  segments: FingerPart[],
  size: number,
): JointHandle[] {
  const rootX = pose[0] ?? 0
  const rootY = pose[1] ?? 0
  const angles = pose.slice(2)
  const handles: JointHandle[] = [{x: rootX, y: rootY, index: 0, kind: 'root'}]

  let x = rootX
  let y = rootY
  let absAngle = 0
  for (let i = 0; i < segments.length; i++) {
    absAngle += angles[i] ?? 0
    const {dx, dy} = boneOffset(absAngle, segments[i]!.length, size)
    x += dx
    y += dy
    handles.push({x, y, index: i + 1, kind: 'rotate'})
  }
  return handles
}
