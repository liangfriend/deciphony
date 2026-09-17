import type {SPage} from '../types/types'

export type SetBackgroundOptions = {
  /** 资源缓存 id */
  assetId: string
}

/**
 * 按缓存 id 设置页背景。调用方须已确认 id 在缓存中。
 * @returns 被替换掉的旧背景资源 id（未变或无旧图则 undefined）
 */
export function setBackground(
  page: SPage,
  options: SetBackgroundOptions,
): string | undefined {
  const prev = page.background?.src
  page.background = {src: options.assetId}
  if (prev && prev !== options.assetId) return prev
  return undefined
}

/**
 * 清除页背景。
 * @returns 原背景资源 id（无则 undefined）
 */
export function clearBackground(page: SPage): string | undefined {
  const prev = page.background?.src
  if (!prev) return undefined
  delete page.background
  return prev
}
