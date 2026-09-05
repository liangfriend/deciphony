import type {MusicScore} from '@deciphony/renderer'

/** 页面背景：缓存资源 id（与图片/音频相同） */
export type SPageBackground = {
  /** 资源缓存 id，如 `21546134543.png` */
  src: string
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

/** 多媒体放置元素（曲谱另走 scores） */
export type SElement = STextElement | SImageElement | SAudioElement

/**
 * 页面上的曲谱放置框。
 * musicScore 为完整 MusicScore JSON；框的 width/height 在添加时由 musicScore.width/height 覆盖，
 * 之后拉伸只改框尺寸，曲谱固有宽高不变，视觉上缩放铺满。
 */
export type SScore = SElementBase & {
  musicScore: MusicScore
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
  field: 'thumbnail' | 'src' | 'background'
}
