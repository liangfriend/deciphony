import type {SAudioElement, SImageElement, SPage, STextElement, SVideoElement} from '../types/types'
import {isRemoteSrc} from '../assets/usage'
import {readImageSize} from '../assets/imageSize'
import {readVideoSize} from '../assets/videoSize'
import {
  DEFAULT_AUDIO_HEIGHT,
  DEFAULT_AUDIO_WIDTH,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_TEXT_WIDTH,
  DEFAULT_VIDEO_HEIGHT,
  DEFAULT_VIDEO_WIDTH,
} from '../constants/elementDefaults'

export type AddTextOptions = {
  x: number
  y: number
  text: string
  width?: number
  height?: number
  fontSize?: number
  color?: string
  fontFamily?: string
  rotation?: number
  id?: string
}

/** 按缓存 id 添加图片（id 须已在缓存中） */
export type AddImageOptions = {
  x: number
  y: number
  /** 资源缓存 id */
  assetId: string
  width?: number
  height?: number
  rotation?: number
  id?: string
}

/** 按缓存 id 添加音频 */
export type AddAudioOptions = {
  x: number
  y: number
  assetId: string
  width?: number
  height?: number
  rotation?: number
  id?: string
}

/** 按缓存 id 添加视频 */
export type AddVideoOptions = {
  x: number
  y: number
  /** 资源缓存 id */
  assetId: string
  width?: number
  height?: number
  rotation?: number
  id?: string
}

export type ResolveImageSource = (assetId: string) => File | Blob | string | undefined

function newId(): string {
  return crypto.randomUUID()
}

function ensureElements(page: SPage): NonNullable<SPage['elements']> {
  if (!page.elements) page.elements = []
  return page.elements
}

/** 向指定页添加文本；宽高默认取 DEFAULT_TEXT_* */
export function addText(page: SPage, options: AddTextOptions): string {
  const id = options.id ?? newId()
  const el: STextElement = {
    id,
    type: 'text',
    x: options.x,
    y: options.y,
    width: options.width ?? DEFAULT_TEXT_WIDTH,
    height: options.height ?? DEFAULT_TEXT_HEIGHT,
    text: options.text,
    fontSize: options.fontSize ?? DEFAULT_TEXT_FONT_SIZE,
  }
  if (options.color !== undefined) el.color = options.color
  if (options.fontFamily !== undefined) el.fontFamily = options.fontFamily
  if (options.rotation !== undefined) el.rotation = options.rotation
  ensureElements(page).push(el)
  return id
}

/**
 * 按缓存 id 添加图片：width/height 写入资源原始像素尺寸。
 * src 字段存的是 assetId。
 */
export async function addImage(
  page: SPage,
  options: AddImageOptions,
  resolveSource?: ResolveImageSource,
): Promise<string> {
  const assetId = options.assetId
  if (!assetId?.trim()) throw new Error('addImage 需要 assetId')

  const source =
    resolveSource?.(assetId) ?? (isRemoteSrc(assetId) ? assetId : undefined)
  if (!source) {
    throw new Error(`缓存中不存在资源: ${assetId}`)
  }

  const size =
    options.width !== undefined && options.height !== undefined
      ? {width: options.width, height: options.height}
      : await readImageSize(source)

  const id = options.id ?? newId()
  const el: SImageElement = {
    id,
    type: 'image',
    x: options.x,
    y: options.y,
    src: assetId,
    width: size.width,
    height: size.height,
  }
  if (options.rotation !== undefined) el.rotation = options.rotation
  ensureElements(page).push(el)
  return id
}

/** 按缓存 id 添加音频；宽高默认取 DEFAULT_AUDIO_* */
export function addAudio(page: SPage, options: AddAudioOptions): string {
  const assetId = options.assetId
  if (!assetId?.trim()) throw new Error('addAudio 需要 assetId')

  const id = options.id ?? newId()
  const el: SAudioElement = {
    id,
    type: 'audio',
    x: options.x,
    y: options.y,
    src: assetId,
    width: options.width ?? DEFAULT_AUDIO_WIDTH,
    height: options.height ?? DEFAULT_AUDIO_HEIGHT,
  }
  if (options.rotation !== undefined) el.rotation = options.rotation
  ensureElements(page).push(el)
  return id
}

/**
 * 按缓存 id 添加视频：width/height 写入资源原始像素尺寸（读不到则 DEFAULT_VIDEO_*）。
 * src 字段存的是 assetId。
 */
export async function addVideo(
  page: SPage,
  options: AddVideoOptions,
  resolveSource?: ResolveImageSource,
): Promise<string> {
  const assetId = options.assetId
  if (!assetId?.trim()) throw new Error('addVideo 需要 assetId')

  const source =
    resolveSource?.(assetId) ?? (isRemoteSrc(assetId) ? assetId : undefined)
  if (!source) {
    throw new Error(`缓存中不存在资源: ${assetId}`)
  }

  let size: {width: number; height: number}
  if (options.width !== undefined && options.height !== undefined) {
    size = {width: options.width, height: options.height}
  } else {
    try {
      size = await readVideoSize(source)
    } catch {
      size = {width: DEFAULT_VIDEO_WIDTH, height: DEFAULT_VIDEO_HEIGHT}
    }
  }

  const id = options.id ?? newId()
  const el: SVideoElement = {
    id,
    type: 'video',
    x: options.x,
    y: options.y,
    src: assetId,
    width: size.width,
    height: size.height,
  }
  if (options.rotation !== undefined) el.rotation = options.rotation
  ensureElements(page).push(el)
  return id
}

export function removeElement(page: SPage, elementId: string): boolean {
  const list = page.elements
  if (!list?.length) return false
  const i = list.findIndex((e) => e.id === elementId)
  if (i < 0) return false
  list.splice(i, 1)
  return true
}
