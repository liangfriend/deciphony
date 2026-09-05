import type {AssetUsage, SJW} from '../types/types'

/** 是否为线上地址（http/https） */
export function isRemoteSrc(src: string): boolean {
  return /^https?:\/\//i.test(src.trim())
}

/** 取 zip 条目的纯文件名（去掉目录前缀） */
export function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const i = normalized.lastIndexOf('/')
  return i >= 0 ? normalized.slice(i + 1) : normalized
}

/** 在 sjw 数据中查找资源 id 引用 */
export function findAssetUsages(data: SJW, filename: string): AssetUsage[] {
  const usages: AssetUsage[] = []
  for (const page of data.pages ?? []) {
    if (page.thumbnail === filename) {
      usages.push({pageId: page.id, field: 'thumbnail'})
    }
    if (page.background?.src === filename) {
      usages.push({pageId: page.id, field: 'background'})
    }
    for (const el of page.elements ?? []) {
      if ((el.type === 'image' || el.type === 'audio') && el.src === filename) {
        usages.push({pageId: page.id, elementId: el.id, field: 'src'})
      }
    }
  }
  return usages
}

export function isAssetUsed(data: SJW, filename: string): boolean {
  return findAssetUsages(data, filename).length > 0
}

/** 清除 data 中对该资源 id 的引用 */
export function clearAssetUsages(data: SJW, filename: string): void {
  for (const page of data.pages ?? []) {
    if (page.thumbnail === filename) {
      delete page.thumbnail
    }
    if (page.background?.src === filename) {
      delete page.background
    }
    const list = page.elements
    if (!list?.length) continue
    for (let i = list.length - 1; i >= 0; i--) {
      const el = list[i]!
      if ((el.type === 'image' || el.type === 'audio') && el.src === filename) {
        list.splice(i, 1)
      }
    }
  }
}
