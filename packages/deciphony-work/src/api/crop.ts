import type {CropArea, CropOptions, SCropRect, SElementBase, SImageElement, SPage, SScore} from '../types/types'
import {isRemoteSrc} from '../assets/usage'
import {readImageSize} from '../assets/imageSize'
import type {ResolveImageSource} from './elements'

type Size = {width: number; height: number}

/** 可裁剪的放置框（图片 / 曲谱） */
type CropFrame = Pick<SElementBase, 'x' | 'y' | 'width' | 'height' | 'rotation'> & {crop?: SCropRect}

/** 裁剪后的最小边长（源坐标） */
const MIN_CROP_SIZE = 1

/** 当前可见的源区域：有 crop 用 crop，否则整份源 */
export function visibleSourceRect(crop: SCropRect | undefined, source: Size): SCropRect {
  return crop ?? {x: 0, y: 0, width: source.width, height: source.height}
}

/** 起止点 → 源坐标矩形：自动交换先后、截断到源范围内 */
export function normalizeCropArea(area: CropArea, source: Size): SCropRect {
  const values = [area.startX, area.startY, area.endX, area.endY]
  if (!values.every(Number.isFinite)) throw new Error('裁剪坐标必须是有限数字')
  const clampX = (v: number) => Math.min(source.width, Math.max(0, v))
  const clampY = (v: number) => Math.min(source.height, Math.max(0, v))
  const x1 = clampX(Math.min(area.startX, area.endX))
  const x2 = clampX(Math.max(area.startX, area.endX))
  const y1 = clampY(Math.min(area.startY, area.endY))
  const y2 = clampY(Math.max(area.startY, area.endY))
  if (x2 - x1 < MIN_CROP_SIZE || y2 - y1 < MIN_CROP_SIZE) {
    throw new Error('裁剪区域为空或在源范围之外')
  }
  return {x: x1, y: y1, width: x2 - x1, height: y2 - y1}
}

function isFullSource(rect: SCropRect, source: Size): boolean {
  return rect.x <= 0 && rect.y <= 0 && rect.width >= source.width && rect.height >= source.height
}

/**
 * 把 next 设为可见区域并调整放置框。
 * 默认：保持显示比例，裁出区域中心在页面上不动（含旋转）；
 * keepFrame：框完全不动；keepY：框只改宽高，x/y 不动（左上角钉死）。
 */
function applyCrop(
  target: CropFrame,
  source: Size,
  next: SCropRect,
  options: CropOptions,
  prev: SCropRect = visibleSourceRect(target.crop, source),
) {
  if (!options.keepFrame) {
    const sx = target.width / prev.width
    const sy = target.height / prev.height
    const width = next.width * sx
    const height = next.height * sy
    if (options.keepY) {
      // 左上角不动：起点复谱表变了也不会改 score.x / score.y
      target.width = width
      target.height = height
    } else {
      const dx = (next.x + next.width / 2 - prev.x) * sx - target.width / 2
      const dy = (next.y + next.height / 2 - prev.y) * sy - target.height / 2
      const angle = ((target.rotation ?? 0) * Math.PI) / 180
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const cx = target.x + target.width / 2 + dx * cos - dy * sin
      const cy = target.y + target.height / 2 + dx * sin + dy * cos
      target.width = width
      target.height = height
      target.x = cx - width / 2
      target.y = cy - height / 2
    }
  }
  if (isFullSource(next, source)) delete target.crop
  else target.crop = next
}

function findImage(page: SPage, elementId: string): SImageElement {
  const el = page.elements?.find((e) => e.id === elementId)
  if (!el) throw new Error(`当前页不存在元素: ${elementId}`)
  if (el.type !== 'image') throw new Error(`元素 ${elementId} 不是图片，无法裁剪`)
  return el
}

function findScore(page: SPage, scoreId: string): SScore {
  const score = page.scores?.find((s) => s.id === scoreId)
  if (!score) throw new Error(`当前页不存在曲谱: ${scoreId}`)
  return score
}

function scoreSource(score: SScore): Size {
  return {width: score.musicScore.width || 1, height: score.musicScore.height || 1}
}

/** 直接把可见区域设为 rect（须已在源范围内）：保持显示比例，内容在页面上不动 */
export function setCropRect(target: CropFrame, source: Size, rect: SCropRect) {
  applyCrop(target, source, rect, {})
}

/** 图片原始像素尺寸；没有记录时读取资源并写回 naturalWidth/naturalHeight */
export async function ensureImageNaturalSize(el: SImageElement, resolveSource?: ResolveImageSource): Promise<Size> {
  if (el.naturalWidth && el.naturalHeight) return {width: el.naturalWidth, height: el.naturalHeight}
  const source = resolveSource?.(el.src) ?? (isRemoteSrc(el.src) ? el.src : undefined)
  if (!source) throw new Error(`缓存中不存在资源: ${el.src}`)
  const size = await readImageSize(source)
  el.naturalWidth = size.width
  el.naturalHeight = size.height
  return size
}

/** 裁剪图片；area 为原始像素坐标的起止点。无原始尺寸时先读取资源 */
export async function cropImage(
  page: SPage,
  elementId: string,
  area: CropArea,
  options: CropOptions = {},
  resolveSource?: ResolveImageSource,
): Promise<SCropRect> {
  const el = findImage(page, elementId)
  const source = await ensureImageNaturalSize(el, resolveSource)
  const rect = normalizeCropArea(area, source)
  applyCrop(el, source, rect, options)
  return rect
}

/** 裁剪曲谱；area 为 musicScore.width/height 坐标系的起止点 */
export function cropScore(page: SPage, scoreId: string, area: CropArea, options: CropOptions = {}): SCropRect {
  const score = findScore(page, scoreId)
  const source = scoreSource(score)
  const rect = normalizeCropArea(area, source)
  applyCrop(score, source, rect, options)
  return rect
}

/**
 * 曲谱固有宽高（musicScore.width/height）变化后调整放置框：保持显示比例，内容左上角在页面上不动。
 * 无裁剪时框随之伸缩；有裁剪时只在裁剪区域超出新范围时截断。
 */
export function fitScoreFrameToSource(score: SScore, prevSource: Size) {
  const source = scoreSource(score)
  if (source.width === prevSource.width && source.height === prevSource.height) return
  const prev = visibleSourceRect(score.crop, prevSource)
  let next = visibleSourceRect(undefined, source)
  if (score.crop) {
    const x1 = Math.min(source.width, Math.max(0, prev.x))
    const x2 = Math.min(source.width, Math.max(0, prev.x + prev.width))
    const y1 = Math.min(source.height, Math.max(0, prev.y))
    const y2 = Math.min(source.height, Math.max(0, prev.y + prev.height))
    if (x2 - x1 >= MIN_CROP_SIZE && y2 - y1 >= MIN_CROP_SIZE) {
      next = {x: x1, y: y1, width: x2 - x1, height: y2 - y1}
      if (next.x === prev.x && next.y === prev.y && next.width === prev.width && next.height === prev.height) return
    }
  }
  applyCrop(score, source, next, {}, prev)
}

const syncedSourceSize = new WeakMap<SScore, Size>()

/** 首次调用只记录固有宽高；之后宽高变了就 fitScoreFrameToSource（同一曲谱多处挂载也只调一次） */
export function syncScoreFrame(score: SScore) {
  const source = scoreSource(score)
  const prev = syncedSourceSize.get(score)
  syncedSourceSize.set(score, source)
  if (prev) fitScoreFrameToSource(score, prev)
}

/** 取消图片 / 曲谱裁剪（按 id 在当前页查找）；没有裁剪返回 false */
export function clearCrop(page: SPage, id: string, options: CropOptions = {}): boolean {
  const score = page.scores?.find((s) => s.id === id)
  if (score) {
    if (!score.crop) return false
    const source = scoreSource(score)
    applyCrop(score, source, visibleSourceRect(undefined, source), options)
    return true
  }
  const el = findImage(page, id)
  if (!el.crop) return false
  if (!el.naturalWidth || !el.naturalHeight) {
    delete el.crop
    return true
  }
  const source = {width: el.naturalWidth, height: el.naturalHeight}
  applyCrop(el, source, visibleSourceRect(undefined, source), options)
  return true
}
