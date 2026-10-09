import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  type Material,
  type Texture,
} from 'three'
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js'

export type TextTextureEntry = {texture: Texture | null; promise: Promise<Texture | null>}
/** svg 文本片段 → 贴图；Score3D 跨多次重建复用 */
export type TextTextureCache = Map<string, TextTextureEntry>

export type BuildScoreObjectOptions = {
  /** 挤出厚度（px），0 = 平面 */
  depth?: number
  curveSegments?: number
  /** 文字贴图每 px 的像素数 */
  textResolution?: number
  /** 统一覆盖符号颜色（CSS 颜色） */
  color?: string
  maxAnisotropy?: number
  textureCache?: TextTextureCache
  /** 文字贴图异步加载完成 */
  onTextureLoad?: () => void
}

export type ScoreObject3D = {
  /** 已做 y 翻转：世界 (x, −y) = 曲谱 (x, y) */
  group: Group
  textureKeys: Set<string>
  dispose: () => void
}

type Paint = {color: string; alpha: number}

type ShapeRecord = {
  kind: 'shape'
  fill: Paint | null
  stroke: Paint | null
  strokeWidth: number
  dash: number[]
  dashOffset: number
  lineCap: string
  /** 局部 → 根 svg 的线性缩放（描边宽 / 虚线按它换算） */
  scale: number
  opacity: number
}

type TextRecord = {kind: 'text'; el: SVGTextElement; matrix: DOMMatrix; opacity: number}

type PaintItem = {color: string; opacity: number; shapes: Shape[]}

const SKIP_TAGS = new Set([
  'defs', 'clipPath', 'mask', 'symbol', 'marker', 'pattern', 'linearGradient', 'radialGradient', 'filter',
  'title', 'desc', 'style', 'script', 'metadata', 'foreignObject', 'image', 'use',
])
const SHAPE_TAGS = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'])
const TEXT_STYLE_PROPS = [
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'font-stretch',
  'letter-spacing', 'word-spacing', 'text-anchor', 'dominant-baseline', 'alignment-baseline', 'baseline-shift',
  'text-decoration', 'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'paint-order',
  'white-space', 'writing-mode', 'direction',
]
/** 同一平面上相邻绘制层的 z 间隔（仅挤出模式，配合对数深度缓冲） */
const Z_STEP = 0.02
const MAX_TEXT_TEXTURE = 2048

function parsePaint(value: string): Paint | null {
  const v = value.trim()
  if (!v || v === 'none' || v === 'transparent') return null
  if (v.startsWith('url(')) {
    const fallback = v.match(/\)\s*(.+)$/)?.[1]
    return fallback ? parsePaint(fallback) : {color: 'rgb(0, 0, 0)', alpha: 1}
  }
  const m = v.match(/^rgba?\(([^)]*)\)/i)
  if (!m) return {color: v, alpha: 1}
  const parts = m[1]!.split(/[\s,/]+/).filter(Boolean)
  const [r, g, b] = parts.map((p) => parseFloat(p))
  const rawAlpha = parts[3]
  const alpha = rawAlpha == null ? 1 : rawAlpha.endsWith('%') ? parseFloat(rawAlpha) / 100 : parseFloat(rawAlpha)
  if (!(alpha > 0)) return null
  return {color: `rgb(${r}, ${g}, ${b})`, alpha}
}

function num(value: string, fallback = 0): number {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

function attr(name: string, value: string | number): string {
  return ` ${name}="${String(value).replace(/"/g, '&quot;')}"`
}

/** 形状几何属性（已代入模板后的真实数值） */
function geometryAttrs(el: SVGElement): string | null {
  switch (el.tagName) {
    case 'path': {
      const d = el.getAttribute('d')
      return d ? attr('d', d) : null
    }
    case 'rect': {
      const r = el as SVGRectElement
      return attr('x', r.x.baseVal.value) + attr('y', r.y.baseVal.value)
        + attr('width', r.width.baseVal.value) + attr('height', r.height.baseVal.value)
        + attr('rx', r.rx.baseVal.value) + attr('ry', r.ry.baseVal.value)
    }
    case 'circle': {
      const c = el as SVGCircleElement
      return attr('cx', c.cx.baseVal.value) + attr('cy', c.cy.baseVal.value) + attr('r', c.r.baseVal.value)
    }
    case 'ellipse': {
      const e = el as SVGEllipseElement
      return attr('cx', e.cx.baseVal.value) + attr('cy', e.cy.baseVal.value)
        + attr('rx', e.rx.baseVal.value) + attr('ry', e.ry.baseVal.value)
    }
    case 'line': {
      const l = el as SVGLineElement
      return attr('x1', l.x1.baseVal.value) + attr('y1', l.y1.baseVal.value)
        + attr('x2', l.x2.baseVal.value) + attr('y2', l.y2.baseVal.value)
    }
    case 'polyline':
    case 'polygon': {
      const points = el.getAttribute('points')
      return points ? attr('points', points) : null
    }
    default:
      return null
  }
}

function disc(center: Vector2, radius: number): Shape {
  const pts: Vector2[] = []
  const n = 12
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(new Vector2(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius))
  }
  return new Shape(pts)
}

function applyDash(pts: Vector2[], dash: number[], offset: number): Vector2[][] {
  const pattern = dash.length % 2 ? [...dash, ...dash] : dash
  const total = pattern.reduce((a, b) => a + b, 0)
  if (!(total > 0) || pattern.some((d) => d < 0)) return [pts]
  let pi = 0
  let o = ((offset % total) + total) % total
  while (o >= pattern[pi]!) {
    o -= pattern[pi]!
    pi = (pi + 1) % pattern.length
  }
  let remain = pattern[pi]! - o
  let on = pi % 2 === 0
  const runs: Vector2[][] = []
  let cur: Vector2[] | null = on ? [pts[0]!.clone()] : null
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!
    const b = pts[i + 1]!
    const segLen = a.distanceTo(b)
    let t = 0
    while (segLen - t > remain) {
      t += remain
      const p = a.clone().lerp(b, t / segLen)
      if (on) {
        cur!.push(p)
        runs.push(cur!)
        cur = null
      } else {
        cur = [p]
      }
      on = !on
      pi = (pi + 1) % pattern.length
      remain = pattern[pi]!
    }
    remain -= segLen - t
    if (on) cur!.push(b.clone())
  }
  if (on && cur && cur.length > 1) runs.push(cur)
  return runs
}

/** 描边转成可挤出的面：每段一个矩形，拐角补圆，端点按 linecap 延伸 / 补圆 */
function strokeRun(run: Vector2[], hw: number, cap: string, closed: boolean, out: Shape[]): void {
  const n = run.length
  for (let i = 0; i < n - 1; i++) {
    const a = run[i]!
    const b = run[i + 1]!
    const len = a.distanceTo(b)
    if (len < 1e-9) continue
    const ux = (b.x - a.x) / len
    const uy = (b.y - a.y) / len
    const ext0 = !closed && i === 0 && cap === 'square' ? hw : 0
    const ext1 = !closed && i === n - 2 && cap === 'square' ? hw : 0
    const ax = a.x - ux * ext0
    const ay = a.y - uy * ext0
    const bx = b.x + ux * ext1
    const by = b.y + uy * ext1
    const nx = -uy * hw
    const ny = ux * hw
    out.push(new Shape([
      new Vector2(ax + nx, ay + ny),
      new Vector2(bx + nx, by + ny),
      new Vector2(bx - nx, by - ny),
      new Vector2(ax - nx, ay - ny),
    ]))
  }
  for (let i = 1; i < n - 1; i++) {
    const d0 = run[i]!.clone().sub(run[i - 1]!)
    const d1 = run[i + 1]!.clone().sub(run[i]!)
    if (d0.lengthSq() < 1e-12 || d1.lengthSq() < 1e-12) continue
    if (Math.abs(d0.angleTo(d1)) > 0.05) out.push(disc(run[i]!, hw))
  }
  if (closed) out.push(disc(run[0]!, hw))
  else if (cap === 'round') {
    out.push(disc(run[0]!, hw))
    out.push(disc(run[n - 1]!, hw))
  }
}

function strokeShapes(points: Vector2[], closed: boolean, rec: ShapeRecord): Shape[] {
  const pts: Vector2[] = []
  for (const p of points) {
    const last = pts[pts.length - 1]
    if (!last || last.distanceToSquared(p) > 1e-12) pts.push(p)
  }
  if (closed && pts.length > 2 && pts[0]!.distanceToSquared(pts[pts.length - 1]!) > 1e-12) pts.push(pts[0]!.clone())
  if (pts.length < 2) return []
  const hw = (rec.strokeWidth * rec.scale) / 2
  const dash = rec.dash.map((d) => d * rec.scale)
  const runs = dash.length ? applyDash(pts, dash, rec.dashOffset * rec.scale) : [pts]
  const out: Shape[] = []
  for (const run of runs) strokeRun(run, hw, rec.lineCap, closed && !dash.length, out)
  return out
}

function loadTextTexture(svgText: string, width: number, height: number, anisotropy: number): Promise<Texture | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0, width, height)
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = anisotropy
      resolve(texture)
    }
    img.onerror = () => resolve(null)
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
  })
}

function inlineTextStyle(source: Element, target: Element, color?: string): void {
  const cs = getComputedStyle(source)
  const style = (target as SVGElement).style
  for (const prop of TEXT_STYLE_PROPS) {
    let value = cs.getPropertyValue(prop)
    if (color && (prop === 'fill' || prop === 'stroke') && parsePaint(value)) value = color
    if (value) style.setProperty(prop, value)
  }
  style.removeProperty('opacity')
}

/**
 * 读取已渲染（在文档中、有布局）的曲谱 svg，生成 three 网格：
 * - 形状按 DOM 顺序取根坐标系下的变换（getScreenCTM），填充交给 SVGLoader，描边自行转成面以便挤出
 * - 相邻同色同透明度的形状合并成一个网格；文字栅格化成贴图贴在平面上
 * - 不支持 image / use / 渐变（渐变按回退色或黑色）/ 裁剪 / 滤镜
 */
export function buildScoreObject3D(svg: SVGSVGElement, options: BuildScoreObjectOptions = {}): ScoreObject3D {
  const depth = Math.max(0, options.depth ?? 0)
  const curveSegments = options.curveSegments ?? 8
  const textResolution = options.textResolution ?? 3
  const cache = options.textureCache ?? new Map()
  const anisotropy = options.maxAnisotropy ?? 1

  const group = new Group()
  group.name = 'dr-score3d'
  group.scale.set(1, -1, 1)
  const textureKeys = new Set<string>()
  let disposed = false

  const rootCtm = svg.getScreenCTM()
  if (!rootCtm) return {group, textureKeys, dispose: () => {}}
  const rootInv = rootCtm.inverse()

  const records: (ShapeRecord | TextRecord)[] = []
  const flat: string[] = []

  const walk = (el: Element, parentOpacity: number) => {
    const tag = el.tagName
    if (SKIP_TAGS.has(tag)) return
    const cs = getComputedStyle(el)
    if (cs.display === 'none') return
    const opacity = parentOpacity * num(cs.opacity, 1)
    if (opacity <= 0) return
    const visible = cs.visibility !== 'hidden' && cs.visibility !== 'collapse'

    if (tag === 'text') {
      const ctm = (el as SVGTextElement).getScreenCTM()
      if (visible && ctm) records.push({kind: 'text', el: el as SVGTextElement, matrix: rootInv.multiply(ctm), opacity})
      return
    }
    if (SHAPE_TAGS.has(tag)) {
      if (!visible) return
      const fill = parsePaint(cs.fill)
      const stroke = parsePaint(cs.stroke)
      const strokeWidth = num(cs.strokeWidth, 1)
      if (!fill && !(stroke && strokeWidth > 0)) return
      const ctm = (el as SVGGraphicsElement).getScreenCTM()
      const geo = geometryAttrs(el as SVGElement)
      if (!ctm || !geo) return
      const m = rootInv.multiply(ctm)
      const dash = cs.strokeDasharray === 'none'
        ? []
        : cs.strokeDasharray.split(/[\s,]+/).map((d) => parseFloat(d)).filter((d) => Number.isFinite(d))
      const index = records.length
      records.push({
        kind: 'shape',
        fill: fill ? {...fill, alpha: fill.alpha * num(cs.fillOpacity, 1)} : null,
        stroke: stroke ? {...stroke, alpha: stroke.alpha * num(cs.strokeOpacity, 1)} : null,
        strokeWidth,
        dash: dash.some((d) => d > 0) ? dash : [],
        dashOffset: num(cs.strokeDashoffset),
        lineCap: cs.strokeLinecap,
        scale: Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)),
        opacity,
      })
      flat.push(`<${tag} data-i="${index}"${attr('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`)}${attr('fill-rule', cs.fillRule)}${geo}/>`)
      return
    }
    for (const child of Array.from(el.children)) walk(child, opacity)
  }
  for (const child of Array.from(svg.children)) walk(child, 1)

  const fillsByIndex = new Map<number, Shape[]>()
  const strokesByIndex = new Map<number, Shape[]>()
  if (flat.length) {
    const parsed = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg">${flat.join('')}</svg>`)
    for (const path of parsed.paths) {
      const node = path.userData?.node as Element | undefined
      const index = Number(node?.getAttribute('data-i'))
      const rec = records[index]
      if (!rec || rec.kind !== 'shape') continue
      if (rec.fill) fillsByIndex.set(index, SVGLoader.createShapes(path))
      if (rec.stroke && rec.strokeWidth > 0) {
        const shapes: Shape[] = []
        for (const sub of path.subPaths) shapes.push(...strokeShapes(sub.getPoints(), sub.autoClose, rec))
        strokesByIndex.set(index, shapes)
      }
    }
  }

  let order = 0
  let pending: PaintItem | null = null

  const flush = () => {
    if (!pending || !pending.shapes.length) {
      pending = null
      return
    }
    const geometry = depth > 0
      ? new ExtrudeGeometry(pending.shapes, {depth, bevelEnabled: false, curveSegments})
      : new ShapeGeometry(pending.shapes, curveSegments)
    const material: Material = depth > 0
      ? new MeshStandardMaterial({
        color: pending.color,
        roughness: 0.55,
        metalness: 0.05,
        transparent: pending.opacity < 1,
        opacity: pending.opacity,
        side: FrontSide,
      })
      : new MeshBasicMaterial({
        color: pending.color,
        transparent: true,
        opacity: pending.opacity,
        depthWrite: false,
        side: DoubleSide,
      })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = order
    if (depth > 0) mesh.position.z = order * Z_STEP
    group.add(mesh)
    order++
    pending = null
  }

  const pushPaint = (paint: Paint, opacity: number, shapes: Shape[] | undefined) => {
    if (!shapes?.length) return
    const color = options.color ?? paint.color
    const alpha = paint.alpha * opacity
    if (pending && pending.color === color && Math.abs(pending.opacity - alpha) < 1e-3) {
      pending.shapes.push(...shapes)
      return
    }
    flush()
    pending = {color, opacity: alpha, shapes: [...shapes]}
  }

  const addText = (rec: TextRecord) => {
    let bbox: DOMRect
    try {
      bbox = rec.el.getBBox()
    } catch {
      return
    }
    if (!(bbox.width > 0 && bbox.height > 0)) return
    flush()
    const m = rec.matrix
    const pad = Math.max(1, bbox.height * 0.15)
    const x0 = bbox.x - pad
    const y0 = bbox.y - pad
    const w = bbox.width + pad * 2
    const h = bbox.height + pad * 2
    let pxPerUnit = textResolution * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c))
    pxPerUnit = Math.min(pxPerUnit, MAX_TEXT_TEXTURE / w, MAX_TEXT_TEXTURE / h)
    const pw = Math.max(1, Math.ceil(w * pxPerUnit))
    const ph = Math.max(1, Math.ceil(h * pxPerUnit))

    const clone = rec.el.cloneNode(true) as SVGTextElement
    clone.removeAttribute('transform')
    inlineTextStyle(rec.el, clone, options.color)
    const srcDesc = rec.el.querySelectorAll('*')
    const dstDesc = clone.querySelectorAll('*')
    srcDesc.forEach((src, i) => dstDesc[i] && inlineTextStyle(src, dstDesc[i]!, options.color))
    const body = new XMLSerializer().serializeToString(clone)
    const key = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="${x0} ${y0} ${w} ${h}">${body}</svg>`
    textureKeys.add(key)

    let entry = cache.get(key)
    if (!entry) {
      const created: TextTextureEntry = {texture: null, promise: loadTextTexture(key, pw, ph, anisotropy)}
      created.promise.then((tex) => (created.texture = tex))
      cache.set(key, created)
      entry = created
    }

    const corners = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]]
      .map(([x, y]) => [m.a * x! + m.c * y! + m.e, m.b * x! + m.d * y! + m.f])
    const z = depth > 0 ? depth + order * Z_STEP : 0
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(corners.flatMap(([x, y]) => [x!, y!, z]), 3))
    geometry.setAttribute('uv', new Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2))
    geometry.setIndex([0, 3, 1, 1, 3, 2])
    const material = new MeshBasicMaterial({
      transparent: true,
      opacity: rec.opacity,
      depthWrite: false,
      side: DoubleSide,
    })
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = order
    group.add(mesh)
    order++

    const apply = (tex: Texture | null) => {
      if (disposed || !tex) return
      material.map = tex
      material.needsUpdate = true
      mesh.visible = true
      options.onTextureLoad?.()
    }
    if (entry.texture) apply(entry.texture)
    else {
      mesh.visible = false
      entry.promise.then(apply)
    }
  }

  records.forEach((rec, index) => {
    if (rec.kind === 'text') {
      addText(rec)
      return
    }
    if (rec.fill) pushPaint(rec.fill, rec.opacity, fillsByIndex.get(index))
    if (rec.stroke) pushPaint(rec.stroke, rec.opacity, strokesByIndex.get(index))
  })
  flush()

  return {
    group,
    textureKeys,
    dispose: () => {
      disposed = true
      group.traverse((obj) => {
        const mesh = obj as Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        ;(mesh.material as Material).dispose()
      })
      group.removeFromParent()
    },
  }
}
