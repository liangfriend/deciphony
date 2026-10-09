import type {STextElement} from '../types/types'
import {DEFAULT_TEXT_FONT_SIZE} from '../constants/elementDefaults'

/** 与 ElementNode.vue 文本样式一致 */
const PADDING_X = 8
const PADDING_Y = 4
const LINE_HEIGHT = 1.3
const DEFAULT_COLOR = '#303133'

/** 中日韩字符与全角标点：可在任意字符间换行 */
const CJK = '\\u2E80-\\u2FFF\\u3000-\\u303F\\u3040-\\u30FF\\u3100-\\u31FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uAC00-\\uD7AF\\uF900-\\uFAFF\\uFF00-\\uFFEF'
const TOKEN_RE = new RegExp(`[${CJK}]|[^\\s${CJK}]+ ?| `, 'g')

/** white-space: normal：连续空白（含换行）合并成一个空格，首尾去掉 */
function tokenize(text: string): string[] {
  return text.replace(/\s+/g, ' ').trim().match(TOKEN_RE) ?? []
}

/** overflow-wrap: break-word：词放不下才按字符拆 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  const fits = (s: string) => ctx.measureText(s.trimEnd()).width <= maxWidth
  for (const token of tokenize(text)) {
    if (fits(line + token)) {
      line += token
      continue
    }
    if (line.trim()) lines.push(line.trimEnd())
    line = ''
    if (fits(token)) {
      line = token
      continue
    }
    for (const ch of token) {
      if (line && !fits(line + ch)) {
        lines.push(line.trimEnd())
        line = ''
      }
      line += ch
    }
  }
  if (line.trim()) lines.push(line.trimEnd())
  return lines
}

/** 在元素局部坐标（0,0 ~ width,height）里画文本框 */
export function drawTextBox(ctx: CanvasRenderingContext2D, el: STextElement) {
  const fontSize = el.fontSize ?? DEFAULT_TEXT_FONT_SIZE
  const lineHeight = fontSize * LINE_HEIGHT
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, el.width, el.height)
  ctx.clip()
  ctx.font = `${fontSize}px ${el.fontFamily ?? 'sans-serif'}`
  ctx.fillStyle = el.color ?? DEFAULT_COLOR
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const lines = wrapLines(ctx, el.text, Math.max(1, el.width - PADDING_X * 2))
  // flex + align-items: center：内容超高时上下对称溢出
  const top = PADDING_Y + (el.height - PADDING_Y * 2 - lines.length * lineHeight) / 2
  lines.forEach((line, i) => {
    ctx.fillText(line, PADDING_X, top + lineHeight * (i + 0.5))
  })
  ctx.restore()
}
