import type {SJW, SPage, SPageBackground} from '../types/types'

/** A4 近似逻辑像素（与 mock / 常见课件一致） */
export const DEFAULT_PAGE_WIDTH = 794
export const DEFAULT_PAGE_HEIGHT = 1123

export type AddPageOptions = {
  width?: number
  height?: number
  background?: SPageBackground
  thumbnail?: string
  id?: string
}

function newId(): string {
  return crypto.randomUUID()
}

function ensurePages(sjw: SJW): SPage[] {
  if (!sjw.pages) sjw.pages = []
  return sjw.pages
}

/** 创建空白页（不插入列表）；无背景时渲染为白底 */
export function createEmptyPage(options: AddPageOptions = {}): SPage {
  const page: SPage = {
    id: options.id ?? newId(),
    width: options.width ?? DEFAULT_PAGE_WIDTH,
    height: options.height ?? DEFAULT_PAGE_HEIGHT,
    scores: [],
    elements: [],
  }
  if (options.background !== undefined) page.background = options.background
  if (options.thumbnail !== undefined) page.thumbnail = options.thumbnail
  return page
}

/**
 * 在末尾添加一页。
 * @returns 新页 id 与下标
 */
export function addPage(sjw: SJW, options: AddPageOptions = {}): {id: string; index: number} {
  const pages = ensurePages(sjw)
  const page = createEmptyPage(options)
  pages.push(page)
  return {id: page.id, index: pages.length - 1}
}

/**
 * 在 `index` 处插入一页（原该下标及之后的页后移）。
 * index 超出范围时钳制到 [0, length]。
 */
export function insertPage(
  sjw: SJW,
  index: number,
  options: AddPageOptions = {},
): {id: string; index: number} {
  const pages = ensurePages(sjw)
  const at = Math.max(0, Math.min(Math.floor(index), pages.length))
  const page = createEmptyPage(options)
  pages.splice(at, 0, page)
  return {id: page.id, index: at}
}

/**
 * 按页码删除。至少保留一页时返回 false（不删）。
 * @returns 是否删除成功
 */
export function removePage(sjw: SJW, index: number): boolean {
  const pages = sjw.pages
  if (!pages?.length) return false
  if (pages.length <= 1) return false
  const i = Math.floor(index)
  if (i < 0 || i >= pages.length) return false
  pages.splice(i, 1)
  return true
}
