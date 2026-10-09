import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import type {PerspectiveCamera, Scene, WebGLRenderer} from 'three'

/**
 * 世界坐标（单位 = 曲谱 px）：x = 曲谱 x，y = −曲谱 y（向上为正），z = 朝向观察者。
 * 曲谱正面在 z = 0（有厚度时正面在 z = depth）。
 */
export type Score3DVector = {x: number; y: number; z: number}

export type Score3DCameraOptions = {
  /** 相机位置（世界坐标） */
  position?: Score3DVector
  /** 视点 / 旋转中心（世界坐标） */
  target?: Score3DVector
  /** 垂直视角（度），默认 45 */
  fov?: number
  near?: number
  far?: number
}

export type Score3DCameraState = {
  position: Score3DVector
  target: Score3DVector
  fov: number
  near: number
  far: number
}

export type Score3DTransitionOptions = {
  /** 过渡时长（ms），0 = 立即 */
  duration?: number
}

/** 透传到 three OrbitControls 的同名属性 */
export type Score3DControlsOptions = {
  enabled?: boolean
  enableRotate?: boolean
  enablePan?: boolean
  enableZoom?: boolean
  enableDamping?: boolean
  dampingFactor?: number
  rotateSpeed?: number
  panSpeed?: number
  zoomSpeed?: number
  minDistance?: number
  maxDistance?: number
  minPolarAngle?: number
  maxPolarAngle?: number
  minAzimuthAngle?: number
  maxAzimuthAngle?: number
}

/** 曲谱背后的纸张（长方体） */
export type Score3DPaperOptions = {
  color?: string
  /** 纸张超出曲谱内容的留白（px），默认 24 */
  padding?: number
  /** 纸张厚度（px），默认 4 */
  thickness?: number
}

export type SingleLineOptions = {
  /** 单行总宽（px）；缺省按原宽 × 行数，小节平均宽度与原谱相当 */
  width?: number
  /** 单行高度（px）；缺省按原高 / 行数估算（Score3D 渲染后会按实际内容撑开） */
  height?: number
}

/** 世界坐标包围盒 */
export type Score3DBounds = {
  min: Score3DVector
  max: Score3DVector
}

export type Score3DExpose = {
  /** 设置相机；未给的字段保持当前值 */
  setCamera: (camera: Score3DCameraOptions, transition?: Score3DTransitionOptions) => void
  getCamera: () => Score3DCameraState
  /** 回到默认视角（props.camera 覆盖在自动计算的斜视角之上） */
  resetCamera: (transition?: Score3DTransitionOptions) => void
  /** 正视并完整框住整行曲谱 */
  fitView: (options?: Score3DTransitionOptions & {padding?: number}) => void
  /** 保持当前视角方向与距离，平移到曲谱横坐标 x（px） */
  focusX: (x: number, transition?: Score3DTransitionOptions) => void
  /** 世界背景色（CSS 颜色） */
  setBackground: (color: string) => void
  setControls: (options: Score3DControlsOptions) => void
  /** 曲谱坐标（px，y 向下）→ 世界坐标 */
  scoreToWorld: (x: number, y: number, z?: number) => Score3DVector
  getBounds: () => Score3DBounds | null
  /** 重新从曲谱 SVG 生成 3D 网格 */
  rebuild: () => void
  /** 当前画面截图 */
  toDataURL: (type?: string, quality?: number) => string
  getRenderer: () => WebGLRenderer | null
  getScene: () => Scene | null
  getThreeCamera: () => PerspectiveCamera | null
  getControls: () => OrbitControls | null
}
