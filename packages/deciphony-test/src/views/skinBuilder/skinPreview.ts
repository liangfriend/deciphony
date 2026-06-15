import type {SkinItem} from '@/types/common'
import {isColorOnlySkinContent} from '@/render/resolveSkinColor'

/** 预览时 node.w 的特殊取值 */
const PREVIEW_W_OVERRIDE: Record<string, number> = {
  measure: 100,
}

/** 预览时 node.h 的特殊取值（连谱号高度由 node.h 动态拉伸） */
const PREVIEW_H_OVERRIDE: Record<string, number> = {
  bracket: 100,
  brace: 100,
  bracket_arpeggio: 100,
}

/** slur / volta 等：content 为颜色字符串，非 SVG */
export function isColorOnlySkinItem(item: SkinItem): boolean {
  return isColorOnlySkinContent(item.content)
}

export function getPreviewNodeSize(key: string, item: SkinItem): {w: number; h: number} {
  if (isColorOnlySkinItem(item)) {
    return {w: 72, h: 72}
  }
  const w = PREVIEW_W_OVERRIDE[key] ?? item.w
  const h = PREVIEW_H_OVERRIDE[key] ?? item.h
  return {w, h}
}

export function getSkinColorValue(item: SkinItem): string {
  return item.content.trim() || 'transparent'
}
