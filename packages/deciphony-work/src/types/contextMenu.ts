import type {SElement, SJW, SPage, SScore, ScoreAudioRef, SjwMode} from './types'

/** 右键/查询时解析后的曲谱关联音频（含可播放地址与 File） */
export type ResolvedScoreAudio = ScoreAudioRef & {
  /** resolveSrc 得到的 objectURL / 远程地址；缓存未命中为空串 */
  url: string
  /** 资源缓存中的 File */
  file?: File
}

/** 元素 / 曲谱右键菜单回调入参 */
export type ElementContextMenuPayload = {
  /** 右键多媒体元素时有值 */
  element?: SElement
  /** 右键曲谱框时有值 */
  score?: SScore
  /** 目标类型 */
  kind: 'element' | 'score'
  /** 曲谱范唱（已解析 url / file） */
  vocalPerformance?: ResolvedScoreAudio
  /** 曲谱伴奏（已解析 url / file） */
  accompaniment?: ResolvedScoreAudio
  page: SPage
  pageIndex: number
  /** 整份课件数据 */
  data: SJW
  mode: SjwMode
}

/** 宿主自定义菜单项（SJWPDF prop: context-menu） */
export type ElementContextMenuItem = {
  text: string
  /** 返回 false 时不展示该项（按右键目标过滤） */
  visible?: (payload: ElementContextMenuPayload) => boolean
  /**
   * 为 true（或函数返回 true）时选项仍显示但不可点击。
   * 可为 boolean，或按 payload 计算。
   */
  disabled?: boolean | ((payload: ElementContextMenuPayload) => boolean)
  callback: (payload: ElementContextMenuPayload) => void
}

/** 内部菜单渲染项 */
export type ContextMenuEntry = {
  text: string
  danger?: boolean
  disabled?: boolean
  action: () => void
}
