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
 * 裁剪区域（源坐标）：图片 = 原始像素，曲谱 = musicScore.width/height 坐标系。
 * 放置框只显示这块区域并拉伸铺满。
 */
export type SCropRect = {
  x: number
  y: number
  width: number
  height: number
}

/** cropImage / cropScore 入参：起点与终点（源坐标，先后顺序不限，超出源范围会被截断） */
export type CropArea = {
  startX: number
  startY: number
  endX: number
  endY: number
}

export type CropOptions = {
  /**
   * true：框尺寸不变，裁出的区域拉伸铺满原框；
   * false（默认）：保持当前显示比例，框随裁剪变小，裁出的区域留在页面原位
   */
  keepFrame?: boolean
  /**
   * true：框宽高仍按比例随裁剪变，但放置框的 x/y 不动（左上角钉死）。
   * 按复谱表裁剪时：起点下移不会改 score.y；与 keepFrame 同时开时以 keepFrame 为准。
   */
  keepY?: boolean
}

/**
 * src：资源缓存 id（数字文件名）或 http(s)。
 * width/height：展示尺寸；addImage 时写入资源原始像素宽高。
 */
export type SImageElement = SElementBase & {
  type: 'image'
  src: string
  /** 资源原始像素宽高；addImage 读取尺寸时写入，裁剪必需（cropImage 缺失时自动读取） */
  naturalWidth?: number
  naturalHeight?: number
  crop?: SCropRect
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
 * 可选 skin = 皮肤资源 id（zip 根目录 .json，内容为 SkinPack）；无则用 renderer 内置 default。
 */
export type SScore = SElementBase & {
  musicScore: MusicScore
  /**
   * 曲谱皮肤资源 id（可选）。与图片/音频相同：缓存键 = zip 内文件名，如 `1730….json`。
   * 文件内容为 SkinPack JSON；每次 addScore 通常新生成一份。
   */
  skin?: string
  /** 范唱音频（资源在 .sjw 根目录，src = 唯一文件名 id） */
  vocalPerformance?: ScoreAudioRef
  /** 伴奏音频 */
  accompaniment?: ScoreAudioRef
  /** 裁剪区域（musicScore.width/height 坐标系）；无则显示整份曲谱 */
  crop?: SCropRect
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

/**
 * 曲谱选段（内存态，不序列化）：点击循环为 第 1 次设起点 → 第 2 次设终点 → 第 3 次重设起点（终点清空）。
 * 起止按点击顺序记录，播放裁剪时再自动交换先后。
 */
export type ScoreRangeSelect = {
  scoreId: string
  startNoteId: string | null
  endNoteId: string | null
}

/** rangeChange 事件 */
export type ScoreRangeChangePayload = ScoreRangeSelect & {
  /** 曲谱在当前页 scores 中的下标，可直接传给 play */
  scoreIndex: number
}

/** 当前选中项（仅 edit 模式；show 模式、未选中、选中项已被删除都为 null） */
export type SjwSelection =
  | {kind: 'score'; score: SScore}
  | {kind: 'element'; element: SElement}
  | null

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
  field: 'thumbnail' | 'src' | 'background' | 'vocalPerformance' | 'accompaniment' | 'skin'
}
