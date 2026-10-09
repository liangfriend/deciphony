import {zip, zlibSync} from 'fflate'
import type {SJW, SPage} from '../types/types'
import {buildPdf, type PdfPageImage} from './pdfWriter'
import {type ExportAssetContext, renderPageToCanvas, type RenderPageOptions} from './renderPage'

export type ExportImageType = 'png' | 'jpeg'

export type ExportPagesOptions = RenderPageOptions & {
  /** 要导出的页下标（0-based），默认全部 */
  pages?: number[]
  /** 每完成一页回调 */
  onProgress?: (done: number, total: number) => void
}

export type ExportImagesOptions = ExportPagesOptions & {
  /** 图片格式，默认 png */
  type?: ExportImageType
  /** jpeg 质量 0~1，默认 0.92 */
  quality?: number
}

export type ExportPdfOptions = ExportPagesOptions & {
  /** 页内图片编码：png = 无损（默认，曲谱线条清晰）；jpeg 体积更小 */
  imageType?: ExportImageType
  /** jpeg 质量 0~1，默认 0.92 */
  quality?: number
}

const DEFAULT_QUALITY = 0.92
/** CSS 像素 → pt（96dpi → 72dpi），PDF 页面物理尺寸与屏幕逻辑尺寸一致 */
const PX_TO_PT = 0.75

function pickPages(data: SJW, indices?: number[]): {page: SPage; index: number}[] {
  const all = data.pages ?? []
  const list = indices ?? all.map((_, i) => i)
  return list.map((index) => {
    const page = all[index]
    if (!page) throw new Error(`页码越界: ${index}`)
    return {page, index}
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: ExportImageType, quality = DEFAULT_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas 导出图片失败'))),
      `image/${type}`,
      quality,
    )
  })
}

function zipAsync(files: Record<string, [Uint8Array, {level: 0}]>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(files, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

/** canvas → 去掉 alpha 的 RGB（已在白底上绘制，无透明） */
function canvasRgb(canvas: HTMLCanvasElement): Uint8Array {
  const c = canvas.getContext('2d')
  if (!c) throw new Error('无法读取 canvas 像素')
  const rgba = c.getImageData(0, 0, canvas.width, canvas.height).data
  const rgb = new Uint8Array(canvas.width * canvas.height * 3)
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i]!
    rgb[j + 1] = rgba[i + 1]!
    rgb[j + 2] = rgba[i + 2]!
  }
  return rgb
}

/** 导出单页图片 */
export async function exportPageImage(
  page: SPage,
  ctx: ExportAssetContext,
  options: Omit<ExportImagesOptions, 'pages' | 'onProgress'> = {},
): Promise<Blob> {
  const canvas = await renderPageToCanvas(page, ctx, options)
  const type = options.type ?? 'png'
  return canvasToBlob(canvas, type, options.quality)
}

/**
 * 导出为图片：只导一页时直接返回 png/jpeg；多页打包成 zip（01.png、02.png…按页码补零）。
 */
export async function exportPagesAsImages(
  data: SJW,
  ctx: ExportAssetContext,
  options: ExportImagesOptions = {},
): Promise<Blob> {
  const targets = pickPages(data, options.pages)
  if (!targets.length) throw new Error('没有可导出的页面')
  const type = options.type ?? 'png'
  const ext = type === 'jpeg' ? 'jpg' : 'png'

  // 单页：直接出图，不打 zip
  if (targets.length === 1) {
    const canvas = await renderPageToCanvas(targets[0]!.page, ctx, options)
    const blob = await canvasToBlob(canvas, type, options.quality)
    options.onProgress?.(1, 1)
    return blob
  }

  const digits = String(Math.max(...targets.map((t) => t.index + 1))).length
  const files: Record<string, [Uint8Array, {level: 0}]> = {}
  for (let i = 0; i < targets.length; i++) {
    const {page, index} = targets[i]!
    const canvas = await renderPageToCanvas(page, ctx, options)
    const blob = await canvasToBlob(canvas, type, options.quality)
    files[`${String(index + 1).padStart(digits, '0')}.${ext}`] = [new Uint8Array(await blob.arrayBuffer()), {level: 0}]
    options.onProgress?.(i + 1, targets.length)
  }
  const zipped = await zipAsync(files)
  return new Blob([zipped as BlobPart], {type: 'application/zip'})
}

/** 多页导出为一个 PDF：每页一张图，页面尺寸 = 页面逻辑像素 × 0.75pt */
export async function exportPagesAsPdf(
  data: SJW,
  ctx: ExportAssetContext,
  options: ExportPdfOptions = {},
): Promise<Blob> {
  const targets = pickPages(data, options.pages)
  if (!targets.length) throw new Error('没有可导出的页面')
  const imageType = options.imageType ?? 'png'
  const pdfPages: PdfPageImage[] = []
  for (let i = 0; i < targets.length; i++) {
    const {page} = targets[i]!
    const canvas = await renderPageToCanvas(page, ctx, options)
    const base = {
      widthPt: page.width * PX_TO_PT,
      heightPt: page.height * PX_TO_PT,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
    }
    if (imageType === 'jpeg') {
      const blob = await canvasToBlob(canvas, 'jpeg', options.quality)
      pdfPages.push({...base, filter: 'DCTDecode', data: new Uint8Array(await blob.arrayBuffer())})
    } else {
      pdfPages.push({...base, filter: 'FlateDecode', data: zlibSync(canvasRgb(canvas), {level: 6})})
    }
    canvas.width = canvas.height = 0
    options.onProgress?.(i + 1, targets.length)
  }
  return buildPdf(pdfPages, {title: data.name, author: data.author})
}

/** 触发浏览器下载；filename 缺扩展名时补 ext */
export function downloadBlob(blob: Blob, filename: string, ext: string) {
  const name = filename.toLowerCase().endsWith(`.${ext}`) ? filename : `${filename}.${ext}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
