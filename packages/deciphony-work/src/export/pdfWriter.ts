/**
 * 最小 PDF 1.4 写入：每页铺满一张 RGB 图（不依赖第三方 PDF 库）。
 * JPEG 直接嵌入（DCTDecode）；无损用 zlib 压缩的原始 RGB（FlateDecode）。
 */

export type PdfPageImage = {
  /** 页面尺寸（pt） */
  widthPt: number
  heightPt: number
  /** 图像像素尺寸 */
  pixelWidth: number
  pixelHeight: number
  filter: 'DCTDecode' | 'FlateDecode'
  data: Uint8Array
}

export type PdfInfo = {
  title?: string
  author?: string
}

const encoder = new TextEncoder()

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

/** 文本字符串统一写成 UTF-16BE 十六进制（带 BOM），中文标题也能正确显示 */
function pdfText(s: string): string {
  let hex = 'FEFF'
  for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase()
  return `<${hex}>`
}

export function buildPdf(pages: PdfPageImage[], info: PdfInfo = {}): Blob {
  if (!pages.length) throw new Error('没有可导出的页面')
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0

  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? encoder.encode(part) : part
    chunks.push(bytes)
    length += bytes.length
  }
  const object = (id: number, body: string, stream?: Uint8Array) => {
    offsets[id] = length
    push(`${id} 0 obj\n${body}\n`)
    if (stream) {
      push('stream\n')
      push(stream)
      push('\nendstream\n')
    }
    push('endobj\n')
  }

  // 1 catalog, 2 pages, 3 info；之后每页 3 个对象：page / contents / image
  const pageId = (i: number) => 4 + i * 3
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${pages.length} >>`)
  const infoEntries = [`/Producer ${pdfText('@deciphony/work')}`]
  if (info.title) infoEntries.push(`/Title ${pdfText(info.title)}`)
  if (info.author) infoEntries.push(`/Author ${pdfText(info.author)}`)
  object(3, `<< ${infoEntries.join(' ')} >>`)

  pages.forEach((page, i) => {
    const id = pageId(i)
    const w = num(page.widthPt)
    const h = num(page.heightPt)
    object(
      id,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`,
    )
    const content = encoder.encode(`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`)
    object(id + 1, `<< /Length ${content.length} >>`, content)
    object(
      id + 2,
      `<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /${page.filter} /Length ${page.data.length} >>`,
      page.data,
    )
  })

  const size = pageId(pages.length)
  const xrefOffset = length
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`
  for (let id = 1; id < size; id++) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  push(xref)
  push(`trailer\n<< /Size ${size} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)
  return new Blob(chunks as BlobPart[], {type: 'application/pdf'})
}
