<script lang="ts" setup>
/**
 * 几何一律以中心为基准：
 * - 存储仍用左上角 (x,y) + w/h（渲染方便），中心 = (x+w/2, y+h/2)
 * - 变换 = translate(x,y) · rotate(θ, w/2, h/2)
 * - 移动 = 平移中心（等价改 x/y）
 * - 拉伸 = 中心固定，对侧同步扩展：w/h = 2×|中心→角点局部坐标|
 * - 旋转 = 只改 θ，枢轴为中心
 */
import {computed, inject, type Ref} from 'vue'
import {EDIT_FRAME_MIN_SIZE} from '../constants/elementDefaults'
import {setCropRect, visibleSourceRect} from '../api/crop'
import type {SCropRect} from '../types/types'

export type FrameElement = {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  crop?: SCropRect
}

type Corner = 'nw' | 'ne' | 'se' | 'sw'

const props = withDefaults(
  defineProps<{
    element: FrameElement
    editable: boolean
    selected?: boolean
    /** 内容区可拖移；音频 / 视频或文本编辑中为 false */
    moveOnBody?: boolean
    /**
     * 非编辑态是否铺透明命中层（用于曲谱等 pointer-events:none 的内容右键）。
     * 音频/视频/文本等可交互内容勿开，否则会挡住播放控件。
     */
    showHitOverlay?: boolean
    /** 裁剪模式：传源尺寸（图片原始像素 / 曲谱 musicScore 宽高）；四角改裁剪区域，不能旋转 */
    cropSource?: {width: number; height: number} | null
  }>(),
  {
    selected: false,
    moveOnBody: true,
    showHitOverlay: false,
    cropSource: null,
  },
)

const emit = defineEmits<{
  select: []
  bodyDblclick: [ev: MouseEvent]
  contextmenu: [ev: MouseEvent]
}>()

const svgRoot = inject<Ref<SVGSVGElement | null> | null>('sjwSvgRoot', null)

const w = computed(() => props.element.width)
const h = computed(() => props.element.height)
const rot = computed(() => props.element.rotation ?? 0)

const transform = computed(
  () =>
    `translate(${props.element.x},${props.element.y}) rotate(${rot.value},${w.value / 2},${h.value / 2})`,
)

const handleSize = computed(() => Math.max(8, Math.min(14, Math.min(w.value, h.value) * 0.08)))
const halfMin = EDIT_FRAME_MIN_SIZE / 2

const cropping = computed(() => props.editable && props.selected && props.cropSource != null)
const frameColor = computed(() => (cropping.value ? '#e6a23c' : '#409eff'))

/** 整份源在框局部坐标里的范围（裁剪模式下画虚线外框与遮罩） */
const cropExtent = computed(() => {
  const source = props.cropSource
  if (!cropping.value || !source) return null
  const view = visibleSourceRect(props.element.crop, source)
  const sx = w.value / view.width
  const sy = h.value / view.height
  return {x: -view.x * sx, y: -view.y * sy, width: source.width * sx, height: source.height * sy}
})

/** 源范围减去框：裁掉部分的遮罩（evenodd 挖空） */
const cropVeilPath = computed(() => {
  const e = cropExtent.value
  if (!e) return ''
  return (
    `M${e.x},${e.y}h${e.width}v${e.height}h${-e.width}Z` +
    `M0,0v${h.value}h${w.value}v${-h.value}Z`
  )
})

const corners: Corner[] = ['nw', 'ne', 'se', 'sw']

function cornerPos(name: Corner): {x: number; y: number; cursor: string} {
  const s = handleSize.value
  const hw = w.value
  const hh = h.value
  const map: Record<Corner, {x: number; y: number; cursor: string}> = {
    nw: {x: -s / 2, y: -s / 2, cursor: 'nwse-resize'},
    ne: {x: hw - s / 2, y: -s / 2, cursor: 'nesw-resize'},
    se: {x: hw - s / 2, y: hh - s / 2, cursor: 'nwse-resize'},
    sw: {x: -s / 2, y: hh - s / 2, cursor: 'nesw-resize'},
  }
  return map[name]
}

function clientToSvg(clientX: number, clientY: number): {x: number; y: number} {
  const svg = svgRoot?.value
  if (!svg) return {x: clientX, y: clientY}
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return {x: clientX, y: clientY}
  const p = pt.matrixTransform(ctm.inverse())
  return {x: p.x, y: p.y}
}

function onMoveStart(ev: PointerEvent) {
  if (!props.editable) return
  if (ev.button !== 0) return
  ev.stopPropagation()
  ev.preventDefault()
  emit('select')
  const el = props.element
  const start = clientToSvg(ev.clientX, ev.clientY)
  const ox = el.x
  const oy = el.y
  const target = ev.currentTarget as SVGElement
  target.setPointerCapture(ev.pointerId)

  const onMove = (e: PointerEvent) => {
    const p = clientToSvg(e.clientX, e.clientY)
    el.x = ox + (p.x - start.x)
    el.y = oy + (p.y - start.y)
  }
  const onUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId)
    target.removeEventListener('pointermove', onMove)
    target.removeEventListener('pointerup', onUp)
  }
  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerup', onUp)
}

/** 中心固定拉伸：半宽/半高 = |中心→指针| 在局部轴上的投影（按角限象限取号） */
function onResizeStart(ev: PointerEvent, corner: Corner) {
  if (!props.editable) return
  if (ev.button !== 0) return
  ev.stopPropagation()
  ev.preventDefault()
  emit('select')
  const el = props.element
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const angle = ((el.rotation ?? 0) * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const target = ev.currentTarget as SVGElement
  target.setPointerCapture(ev.pointerId)

  const onMove = (e: PointerEvent) => {
    const p = clientToSvg(e.clientX, e.clientY)
    const dx = p.x - cx
    const dy = p.y - cy
    const localX = dx * cos + dy * sin
    const localY = -dx * sin + dy * cos

    let halfW: number
    let halfH: number
    if (corner === 'se') {
      halfW = localX
      halfH = localY
    } else if (corner === 'sw') {
      halfW = -localX
      halfH = localY
    } else if (corner === 'ne') {
      halfW = localX
      halfH = -localY
    } else {
      halfW = -localX
      halfH = -localY
    }

    halfW = Math.max(halfMin, halfW)
    halfH = Math.max(halfMin, halfH)

    const width = halfW * 2
    const height = halfH * 2
    el.width = width
    el.height = height
    el.x = cx - width / 2
    el.y = cy - height / 2
  }

  const onUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId)
    target.removeEventListener('pointermove', onMove)
    target.removeEventListener('pointerup', onUp)
  }
  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerup', onUp)
}

/**
 * 裁剪模式拖角：nw → 起点 xy，se → 终点 xy，ne → 终点 x + 起点 y，sw → 起点 x + 终点 y。
 * 对角与内容在页面上不动，可向外拖回被裁掉的部分（截断到源范围）。
 */
function onCropStart(ev: PointerEvent, corner: Corner) {
  const source = props.cropSource
  if (!props.editable || !source || ev.button !== 0) return
  ev.stopPropagation()
  ev.preventDefault()
  const el = props.element
  const view = visibleSourceRect(el.crop, source)
  const w0 = el.width
  const h0 = el.height
  const sx = w0 / view.width
  const sy = h0 / view.height
  const cx = el.x + w0 / 2
  const cy = el.y + h0 / 2
  const angle = ((el.rotation ?? 0) * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const minW = Math.min(source.width, EDIT_FRAME_MIN_SIZE / sx)
  const minH = Math.min(source.height, EDIT_FRAME_MIN_SIZE / sy)
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

  const target = ev.currentTarget as SVGElement
  target.setPointerCapture(ev.pointerId)

  const onMove = (e: PointerEvent) => {
    const p = clientToSvg(e.clientX, e.clientY)
    const dx = p.x - cx
    const dy = p.y - cy
    const srcX = view.x + (dx * cos + dy * sin + w0 / 2) / sx
    const srcY = view.y + (-dx * sin + dy * cos + h0 / 2) / sy
    let x1 = view.x
    let y1 = view.y
    let x2 = view.x + view.width
    let y2 = view.y + view.height
    if (corner === 'nw' || corner === 'sw') x1 = clamp(srcX, 0, x2 - minW)
    else x2 = clamp(srcX, x1 + minW, source.width)
    if (corner === 'nw' || corner === 'ne') y1 = clamp(srcY, 0, y2 - minH)
    else y2 = clamp(srcY, y1 + minH, source.height)
    setCropRect(el, source, {x: x1, y: y1, width: x2 - x1, height: y2 - y1})
  }

  const onUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId)
    target.removeEventListener('pointermove', onMove)
    target.removeEventListener('pointerup', onUp)
  }
  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerup', onUp)
}

function onCornerDown(ev: PointerEvent, corner: Corner) {
  if (cropping.value) onCropStart(ev, corner)
  else onResizeStart(ev, corner)
}

function onRotateStart(ev: PointerEvent) {
  if (!props.editable) return
  if (ev.button !== 0) return
  ev.stopPropagation()
  ev.preventDefault()
  emit('select')
  const el = props.element
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const start = clientToSvg(ev.clientX, ev.clientY)
  const startAngle = (Math.atan2(start.y - cy, start.x - cx) * 180) / Math.PI
  const baseRot = el.rotation ?? 0

  const target = ev.currentTarget as SVGElement
  target.setPointerCapture(ev.pointerId)

  const onMove = (e: PointerEvent) => {
    const p = clientToSvg(e.clientX, e.clientY)
    const ang = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI
    el.rotation = baseRot + (ang - startAngle)
  }
  const onUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId)
    target.removeEventListener('pointermove', onMove)
    target.removeEventListener('pointerup', onUp)
  }
  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerup', onUp)
}

function onBodyDblclick(ev: MouseEvent) {
  ev.stopPropagation()
  emit('bodyDblclick', ev)
}

function onContextMenu(ev: MouseEvent) {
  ev.preventDefault()
  ev.stopPropagation()
  emit('contextmenu', ev)
}
</script>

<template>
  <g class="sjw-edit-frame" :transform="transform" @contextmenu="onContextMenu">
    <slot/>

    <!-- 仅曲谱等只读内容需要：避免挡住音频播放等交互 -->
    <rect
      v-if="!editable && showHitOverlay"
      fill="transparent"
      :height="h"
      :width="w"
      x="0"
      y="0"
      @contextmenu="onContextMenu"
    />

    <template v-if="cropExtent">
      <path
        :d="cropVeilPath"
        fill="#ffffff"
        fill-opacity="0.6"
        fill-rule="evenodd"
        pointer-events="none"
      />
      <rect
        fill="none"
        :height="cropExtent.height"
        pointer-events="none"
        :stroke="frameColor"
        stroke-dasharray="6 4"
        stroke-opacity="0.8"
        stroke-width="1"
        :width="cropExtent.width"
        :x="cropExtent.x"
        :y="cropExtent.y"
      />
    </template>

    <template v-if="editable">
      <rect
        v-if="moveOnBody"
        fill="transparent"
        :height="h"
        :width="w"
        x="0"
        y="0"
        style="cursor: move"
        @contextmenu="onContextMenu"
        @dblclick="onBodyDblclick"
        @pointerdown="onMoveStart"
      />
      <rect
        v-else
        fill="none"
        :height="h"
        pointer-events="stroke"
        stroke="transparent"
        :stroke-width="14"
        :width="w"
        x="0"
        y="0"
        style="cursor: move"
        @contextmenu="onContextMenu"
        @pointerdown="onMoveStart"
      />

      <rect
        fill="none"
        :height="h"
        pointer-events="none"
        :stroke="selected ? frameColor : '#a0cfff'"
        :stroke-dasharray="selected ? undefined : '4 3'"
        :stroke-width="cropping ? 2 : 1.5"
        :width="w"
        x="0"
        y="0"
      />

      <template v-if="selected">
        <template v-if="!cropping">
          <line
            pointer-events="none"
            stroke="#409eff"
            stroke-width="1.5"
            :x1="w / 2"
            :x2="w / 2"
            y1="0"
            :y2="-28"
          />
          <circle
            :cx="w / 2"
            cy="-28"
            fill="#fff"
            r="7"
            stroke="#409eff"
            stroke-width="1.5"
            style="cursor: grab"
            @pointerdown="onRotateStart"
          />
        </template>
        <rect
          v-for="name in corners"
          :key="name"
          :fill="cropping ? frameColor : '#fff'"
          :height="handleSize"
          :stroke="cropping ? '#fff' : frameColor"
          stroke-width="1.5"
          :style="{cursor: cornerPos(name).cursor}"
          :width="handleSize"
          :x="cornerPos(name).x"
          :y="cornerPos(name).y"
          @pointerdown="onCornerDown($event, name)"
        />
      </template>
    </template>
  </g>
</template>
