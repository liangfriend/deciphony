import type {MusicScore} from '@deciphony/renderer'
import type {DrawToolEnum} from '../enums/drawToolEnum'

/** 页面背景：缓存资源 id（与图片/音频相同） */
export type SPageBackground = {
  /** 资源缓存 id，如 `21546134543.png` */
  src: string
}

/** 单笔笔迹（页面坐标）；随 work.json 持久化进 .sjw */
export type DrawStroke = {
  tool: DrawToolEnum
  /** 画笔颜色；橡皮忽略 */
  color?: string
  lineWidth: number
  /** 折线点 [x, y][]，相对页面逻辑宽高 */
  points: [number, number][]
}

/** setTool / setBrush 第二参数 */
export type DrawBrushOptions = {
  /** 画笔颜色（仅 pen） */
  color?: string
  /** 笔触宽度（线宽 / 橡皮直径） */
  lineWidth?: number
}

/** 放置公共字段（多媒体 + 曲谱框） */
export type SElementBase = {
  id: string
  /**
   * 左上角（由中心推导：x = cx - width/2）。
   * 交互（移动 / 拉伸 / 旋转）一律以几何中心为基准；拉伸时对侧同步，中心不变。
   */
  x: number
  y: number
  width: number
  height: number
  /** 旋转角度（度），绕几何中心 */
  rotation?: number
}

export type STextElement = SElementBase & {
  type: 'text'
  text: string
  fontSize?: number
  color?: string
  fontFamily?: string
}

/**
 * src：资源缓存 id（数字文件名）或 http(s)。
 * width/height：展示尺寸；addImage 时写入资源原始像素宽高。
 */
export type SImageElement = SElementBase & {
  type: 'image'
  src: string
}

/** 音频放置；src 规则同图片 */
export type SAudioElement = SElementBase & {
  type: 'audio'
  src: string
}

/**
 * 视频放置；src 规则同图片。
 * width/height：展示尺寸；addVideo 时写入资源原始像素宽高。
 */
export type SVideoElement = SElementBase & {
  type: 'video'
  src: string
}

/** 多媒体放置元素（曲谱另走 scores） */
export type SElement = STextElement | SImageElement | SAudioElement | SVideoElement

/**
 * 页面上的曲谱放置框。
 * musicScore 为完整 MusicScore JSON；框的 width/height 在添加时由 musicScore.width/height 覆盖，
 * 之后拉伸只改框尺寸，曲谱固有宽高不变，视觉上缩放铺满。
 */
export type SScore = SElementBase & {
  musicScore: MusicScore
  /** 范唱音频（资源在 .sjw 根目录，src = 唯一文件名 id） */
  vocalPerformance?: ScoreAudioRef
  /** 伴奏音频 */
  accompaniment?: ScoreAudioRef
}

/**
 * 曲谱关联音频（持久化在 work.json；文件本体进 zip 根目录，与图片/音频相同）。
 */
export type ScoreAudioRef = {
  /** 资源唯一 id / zip 内文件名，如 `1730123456789.mp3` */
  src: string
  /** 音频展示名称 */
  name: string
  /** 作者 */
  author?: string
}

/** SJWPDF / Page 模式 */
export type SjwMode = 'show' | 'edit'

/**
 * 单页数据。
 */
export type SPage = {
  id: string
  width: number
  height: number
  thumbnail?: string
  background?: SPageBackground
  /** 曲谱列表（与 elements 分开，便于后续独立迭代） */
  scores?: SScore[]
  elements?: SElement[]
  /**
   * 绘制层笔迹（透明 canvas）。
   * 持久化在 work.json，导入导出 .sjw 时随页面一起读写。
   */
  drawings?: DrawStroke[]
}

export type SJW = {
  name: string
  author: string
  pages: SPage[]
  /**
   * 资源 id → 用户自定义名称（导入/导出持久化）。
   * 缓存内每条资源都必须有名称；未显式定义时用载入时的文件名。
   */
  assetNames?: Record<string, string>
}

/** 缓存中的一条静态资源 */
export type AssetRecord = {
  /** 缓存键 / zip 内文件名，如 `21546134543.png` */
  id: string
  /** 用户定义名称（非数字 id）；未指定则用原始文件名 */
  name: string
  file: File
}

export type AssetMap = Map<string, AssetRecord>

export type RemoveAssetOptions = {
  removeUsages?: boolean
}

export type AssetUsage = {
  pageId: string
  elementId?: string
  /** scoreId：曲谱关联范唱/伴奏 */
  scoreId?: string
  field: 'thumbnail' | 'src' | 'background' | 'vocalPerformance' | 'accompaniment'
}
