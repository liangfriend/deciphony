import type {Skin} from '@deciphony/renderer'
import type {SElementBase, SImageElement, SPage, SScore, SVideoElement} from '../types/types'
import {parseSkinFile} from '../assets/skinAsset'
import {isRemoteSrc} from '../assets/usage'
import {paintStrokes} from '../draw/paintStrokes'
import {scoreViewRect} from '../render/scoreDisplay'
import {renderScoreSvg} from './scoreSnapshot'
import {drawTextBox} from './textBox'

/** 导出时读取资源（SJWPDF 内部用资源缓存实现） */
export type ExportAssetContext = {
  getAsset: (id: string) => File | undefined
  resolveSrc: (src: string) => string
}

export type RenderPageOptions = {
  /** 输出像素 / 页面逻辑像素，默认 2 */
  scale?: number
  /** 资源加载失败等非致命问题；默认 console.warn */
  onWarning?: (message: string) => void
}

/** 单边最大像素，超出时降低曲谱 svg 的栅格倍数 */
const MAX_RASTER_SIDE = 8192
const MEDIA_TIMEOUT_MS = 8000

type Drawable = CanvasImageSource & {width: number; height: number}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

function loadImageUrl(url: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`图片加载失败: ${url.slice(0, 80)}`))
    img.src = url
  })
}

async function loadImageSource(src: string, ctx: ExportAssetContext): Promise<Drawable> {
  const file = ctx.getAsset(src)
  if (file) {
    // svg 文件 createImageBitmap 不一定支持，回退 Image
    try {
      return await createImageBitmap(file)
    } catch {
      const url = URL.createObjectURL(file)
      try {
        const img = await loadImageUrl(url, false)
        await img.decode().catch(() => undefined)
        return img
      } finally {
        URL.revokeObjectURL(url)
      }
    }
  }
  const url = ctx.resolveSrc(src)
  if (!url) throw new Error(`缓存中不存在资源: ${src}`)
  return loadImageUrl(url, isRemoteSrc(url))
}

function waitEvent(target: HTMLMediaElement, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => {
      target.removeEventListener('error', fail)
      resolve()
    }
    const fail = () => {
      target.removeEventListener(name, ok)
      reject(new Error('视频加载失败'))
    }
    target.addEventListener(name, ok, {once: true})
    target.addEventListener('error', fail, {once: true})
  })
}

/** 取视频开头一帧；时长未知（如 MediaRecorder 录的 webm）或跳转超时就用已解码的首帧 */
async function loadVideoFrame(src: string, ctx: ExportAssetContext): Promise<HTMLVideoElement> {
  const url = ctx.resolveSrc(src)
  if (!url) throw new Error(`缓存中不存在资源: ${src}`)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  if (isRemoteSrc(url)) video.crossOrigin = 'anonymous'
  video.src = url
  await withTimeout(waitEvent(video, 'loadeddata'), MEDIA_TIMEOUT_MS, '视频加载超时')
  const target = Number.isFinite(video.duration) ? Math.min(0.1, video.duration / 2) : 0
  if (target > 0) {
    video.currentTime = target
    await withTimeout(waitEvent(video, 'seeked'), MEDIA_TIMEOUT_MS, '视频跳转超时').catch(() => undefined)
  }
  return video
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}))
  return loadImageUrl(url, false).finally(() => URL.revokeObjectURL(url))
}

/** 与 EditFrame 一致：translate(x,y) rotate(θ, w/2, h/2) */
function applyFrameTransform(c: CanvasRenderingContext2D, el: SElementBase) {
  c.translate(el.x, el.y)
  const rot = el.rotation ?? 0
  if (rot) {
    c.translate(el.width / 2, el.height / 2)
    c.rotate((rot * Math.PI) / 180)
    c.translate(-el.width / 2, -el.height / 2)
  }
}

async function resolveScoreSkin(score: SScore, ctx: ExportAssetContext): Promise<Skin | undefined> {
  if (!score.skin) return undefined
  const file = ctx.getAsset(score.skin)
  return file ? parseSkinFile(file) : undefined
}

async function drawScore(c: CanvasRenderingContext2D, score: SScore, ctx: ExportAssetContext, scale: number) {
  const view = scoreViewRect(score)
  const naturalW = score.musicScore.width || 1
  const naturalH = score.musicScore.height || 1
  const wanted = scale * Math.max(score.width / view.width, score.height / view.height, 1)
  const ratio = Math.max(0.1, Math.min(wanted, MAX_RASTER_SIDE / Math.max(naturalW, naturalH)))
  const skin = await resolveScoreSkin(score, ctx)
  const img = await loadSvgImage(await renderScoreSvg(score, skin, ratio))
  c.save()
  applyFrameTransform(c, score)
  c.drawImage(img, view.x * ratio, view.y * ratio, view.width * ratio, view.height * ratio, 0, 0, score.width, score.height)
  c.restore()
}

async function drawImageElement(c: CanvasRenderingContext2D, el: SImageElement, ctx: ExportAssetContext) {
  const img = await loadImageSource(el.src, ctx)
  c.save()
  applyFrameTransform(c, el)
  if (el.crop) {
    // crop 以 naturalWidth/Height 为准；实际解码尺寸不同（如 svg）时按比例换算
    const kx = el.naturalWidth ? img.width / el.naturalWidth : 1
    const ky = el.naturalHeight ? img.height / el.naturalHeight : 1
    const {x, y, width, height} = el.crop
    c.drawImage(img, x * kx, y * ky, width * kx, height * ky, 0, 0, el.width, el.height)
  } else {
    c.drawImage(img, 0, 0, el.width, el.height)
  }
  c.restore()
  if ('close' in img && typeof img.close === 'function') img.close()
}

function drawVideoPlaceholder(c: CanvasRenderingContext2D, el: SVideoElement) {
  c.fillStyle = '#000'
  c.fillRect(0, 0, el.width, el.height)
  const r = Math.min(el.width, el.height) * 0.15
  c.fillStyle = 'rgba(255,255,255,0.85)'
  c.beginPath()
  c.moveTo(el.width / 2 - r * 0.6, el.height / 2 - r)
  c.lineTo(el.width / 2 + r, el.height / 2)
  c.lineTo(el.width / 2 - r * 0.6, el.height / 2 + r)
  c.closePath()
  c.fill()
}

/** 视频画首帧（和 VideoPlayer 的 object-fit: fill 一样拉伸铺满）；取不到就画黑底播放三角 */
async function drawVideoElement(
  c: CanvasRenderingContext2D,
  el: SVideoElement,
  ctx: ExportAssetContext,
  warn: (m: string) => void,
) {
  c.save()
  applyFrameTransform(c, el)
  try {
    const video = await loadVideoFrame(el.src, ctx)
    c.drawImage(video, 0, 0, el.width, el.height)
    video.removeAttribute('src')
    video.load()
  } catch (err) {
    warn(`视频 ${el.id} 无法取帧，已用占位图：${(err as Error).message}`)
    drawVideoPlaceholder(c, el)
  }
  c.restore()
}

/**
 * 把一页画成 canvas（不依赖页面 DOM，所有页都能导出）。
 * 层级同 Page.vue：白底 → 背景图 → 曲谱 → 多媒体元素 → 持久笔迹（page.drawings）。
 * 音频元素不画；show 模式的教学标注不在数据里，不导出。
 */
export async function renderPageToCanvas(
  page: SPage,
  ctx: ExportAssetContext,
  options: RenderPageOptions = {},
): Promise<HTMLCanvasElement> {
  const scale = options.scale && options.scale > 0 ? options.scale : 2
  const warn = options.onWarning ?? ((m: string) => console.warn(`[sjw export] ${m}`))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(page.width * scale))
  canvas.height = Math.max(1, Math.round(page.height * scale))
  const c = canvas.getContext('2d')
  if (!c) throw new Error('无法创建 canvas 2d 上下文')
  c.scale(canvas.width / page.width, canvas.height / page.height)
  c.fillStyle = '#fff'
  c.fillRect(0, 0, page.width, page.height)

  if (page.background?.src) {
    try {
      const bg = await loadImageSource(page.background.src, ctx)
      c.drawImage(bg, 0, 0, page.width, page.height)
    } catch (err) {
      warn(`背景图未导出：${(err as Error).message}`)
    }
  }

  for (const score of page.scores ?? []) {
    try {
      await drawScore(c, score, ctx, scale)
    } catch (err) {
      warn(`曲谱 ${score.id} 未导出：${(err as Error).message}`)
    }
  }

  for (const el of page.elements ?? []) {
    try {
      if (el.type === 'image') await drawImageElement(c, el, ctx)
      else if (el.type === 'video') await drawVideoElement(c, el, ctx, warn)
      else if (el.type === 'text') {
        c.save()
        applyFrameTransform(c, el)
        drawTextBox(c, el)
        c.restore()
      }
    } catch (err) {
      warn(`元素 ${el.id} 未导出：${(err as Error).message}`)
    }
  }

  if (page.drawings?.length) {
    // 橡皮 destination-out 只擦笔迹，所以先画到独立图层再叠加
    const ink = document.createElement('canvas')
    ink.width = canvas.width
    ink.height = canvas.height
    const ic = ink.getContext('2d')
    if (ic) {
      ic.scale(canvas.width / page.width, canvas.height / page.height)
      paintStrokes(ic, page.drawings)
      c.save()
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.drawImage(ink, 0, 0)
      c.restore()
    }
  }
  return canvas
}
