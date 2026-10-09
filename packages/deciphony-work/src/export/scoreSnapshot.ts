import {createApp, h, nextTick} from 'vue'
import MusicScoreVue from '@deciphony/renderer'
import type {Skin} from '@deciphony/renderer'
import type {SScore} from '../types/types'
import {scoreDisplayExtensions, scoreSlotConfig} from '../render/scoreDisplay'

/**
 * 序列化成独立 svg 后样式表不再生效（组件 scoped 样式等），
 * 这些属性取计算值写进 style，保证画成图片时外观一致。
 */
const INLINE_PROPS = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'opacity',
  'display',
  'visibility',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'dominant-baseline',
  'letter-spacing',
  'word-spacing',
  'white-space',
] as const

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

function inlineComputedStyles(source: SVGSVGElement, clone: SVGSVGElement) {
  const from = [source, ...source.querySelectorAll('*')]
  const to = [clone, ...clone.querySelectorAll('*')]
  for (let i = 0; i < from.length; i++) {
    const target = to[i]
    if (!(target instanceof SVGElement)) continue
    const computed = getComputedStyle(from[i]!)
    const style = INLINE_PROPS.map((prop) => {
      const value = computed.getPropertyValue(prop)
      return value ? `${prop}:${value}` : ''
    }).filter(Boolean)
    target.setAttribute('style', style.join(';'))
    target.removeAttribute('class')
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

function isVisibleColor(color: string): boolean {
  if (!color || color === 'transparent') return false
  const alpha = color.match(/rgba\([^)]*,\s*([\d.]+)\s*\)/)
  return !alpha || Number(alpha[1]) > 0
}

/**
 * 含 foreignObject 的 svg 画进 canvas 会污染画布（无法再导出像素），
 * 所以按页面上的实际布局把其中的 HTML 换成等价 svg：
 * 文字 → <text>，有背景色的块 → <rect>，内嵌 <svg> → 按显示尺寸搬过来。
 */
function flattenForeignObject(fo: SVGForeignObjectElement): SVGGElement {
  const g = document.createElementNS(SVG_NS, 'g')
  const parent = fo.parentNode
  const ctm = parent instanceof SVGGraphicsElement ? parent.getScreenCTM()?.inverse() : null
  const toLocal = (x: number, y: number) => {
    if (!ctm) return {x, y}
    return new DOMPoint(x, y).matrixTransform(ctm)
  }
  const localRect = (r: DOMRect) => {
    const a = toLocal(r.left, r.top)
    const b = toLocal(r.right, r.bottom)
    return {x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y}
  }

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
      const host = node.parentElement
      if (!text || !host) return
      const range = document.createRange()
      range.selectNodeContents(node)
      const rect = range.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const box = localRect(rect)
      const style = getComputedStyle(host)
      const el = document.createElementNS(SVG_NS, 'text')
      el.setAttribute('x', String(box.x))
      el.setAttribute('y', String(box.y + box.height / 2))
      el.setAttribute(
        'style',
        [
          `fill:${style.color}`,
          `font-family:${style.fontFamily}`,
          `font-size:${style.fontSize}`,
          `font-weight:${style.fontWeight}`,
          `font-style:${style.fontStyle}`,
          `letter-spacing:${style.letterSpacing}`,
          'dominant-baseline:central',
          'text-anchor:start',
          'white-space:pre',
        ].join(';'),
      )
      el.textContent = text
      g.appendChild(el)
      return
    }
    if (!(node instanceof Element)) return
    const style = getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') return
    if (node instanceof SVGSVGElement) {
      const rect = node.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const box = localRect(rect)
      const copy = node.cloneNode(true) as SVGSVGElement
      inlineComputedStyles(node, copy)
      if (!copy.getAttribute('viewBox')) {
        const w = parseFloat(node.getAttribute('width') ?? '') || node.clientWidth || rect.width
        const h = parseFloat(node.getAttribute('height') ?? '') || node.clientHeight || rect.height
        copy.setAttribute('viewBox', `0 0 ${w} ${h}`)
      }
      copy.setAttribute('x', String(box.x))
      copy.setAttribute('y', String(box.y))
      copy.setAttribute('width', String(box.width))
      copy.setAttribute('height', String(box.height))
      copy.setAttribute('overflow', 'visible')
      copy.setAttribute('preserveAspectRatio', 'none')
      copy.removeAttribute('style')
      g.appendChild(copy)
      return
    }
    if (isVisibleColor(style.backgroundColor)) {
      const rect = node.getBoundingClientRect()
      if (rect.width && rect.height) {
        const box = localRect(rect)
        const el = document.createElementNS(SVG_NS, 'rect')
        el.setAttribute('x', String(box.x))
        el.setAttribute('y', String(box.y))
        el.setAttribute('width', String(box.width))
        el.setAttribute('height', String(box.height))
        el.setAttribute('style', `fill:${style.backgroundColor}`)
        g.appendChild(el)
      }
    }
    node.childNodes.forEach(visit)
  }
  fo.childNodes.forEach(visit)
  return g
}

/** 离屏容器：参与布局（文本测量等要用），但不可见、不拦指针 */
function createHiddenHost(): HTMLDivElement {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;left:-100000px;top:0;opacity:0;pointer-events:none;z-index:-1;'
  document.body.appendChild(host)
  return host
}

/**
 * 离屏挂载 renderer 渲染曲谱（与 Score.vue 相同的展示扩展与插槽配置），返回独立 svg 字符串。
 * pixelRatio：svg 的 width/height 按此倍数放大（viewBox 不变），画进 canvas 时足够清晰。
 */
export async function renderScoreSvg(score: SScore, skin: Skin | undefined, pixelRatio = 1): Promise<string> {
  const musicScore = score.musicScore
  const host = createHiddenHost()
  const app = createApp({
    render: () =>
      h(MusicScoreVue, {
        data: musicScore,
        extensions: scoreDisplayExtensions(musicScore),
        slotConfig: scoreSlotConfig(musicScore),
        skin,
      }),
  })
  try {
    app.mount(host)
    await nextTick()
    await document.fonts?.ready
    // 插槽组件 onMounted 测量后可能再更新一轮
    await nextFrame()
    await nextFrame()
    await nextTick()
    const svg = host.querySelector('svg')
    if (!(svg instanceof SVGSVGElement)) throw new Error('曲谱渲染失败')
    const clone = svg.cloneNode(true) as SVGSVGElement
    inlineComputedStyles(svg, clone)
    const sourceFos = svg.querySelectorAll('foreignObject')
    clone.querySelectorAll('foreignObject').forEach((fo, i) => {
      const source = sourceFos[i]
      if (source) fo.replaceWith(flattenForeignObject(source))
      else fo.remove()
    })
    const width = musicScore.width || 1
    const height = musicScore.height || 1
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
    clone.setAttribute('width', String(width * pixelRatio))
    clone.setAttribute('height', String(height * pixelRatio))
    clone.setAttribute('preserveAspectRatio', 'none')
    return new XMLSerializer().serializeToString(clone)
  } finally {
    app.unmount()
    host.remove()
  }
}
