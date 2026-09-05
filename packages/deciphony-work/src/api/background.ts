import type {SPage} from '../types/types'

export type SetBackgroundOptions = {
  /** 资源缓存 id */
  assetId: string
}

/**
 * 按缓存 id 设置页背景。调用方须已确认 id 在缓存中。
 */
export function setBackground(page: SPage, options: SetBackgroundOptions): void {
  page.background = {src: options.assetId}
}

export function clearBackground(page: SPage): void {
  delete page.background
}
