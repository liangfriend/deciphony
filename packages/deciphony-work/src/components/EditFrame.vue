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

export type FrameElement = {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

type Corner = 'nw' | 'ne' | 'se' | 'sw'

const props = withDefaults(
  defineProps<{
    element: FrameElement
    editable: boolean
    selected?: boolean
    /** 内容区可拖移；音频或文本编辑中为 false */
    moveOnBody?: boolean
    /**
     * 非编辑态是否铺透明命中层（用于曲谱等 pointer-events:none 的内容右键）。
     * 音频/文本等可交互内容勿开，否则会挡住播放控件。
     */
    showHitOverlay?: boolean
  }>(),
  {
    selected: false,
    moveOnBody: true,
    showHitOverlay: false,
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
  const target = ev.currentTarget as Element
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

  const target = ev.currentTarget as Element
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

  const target = ev.currentTarget as Element
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
        :stroke="selected ? '#409eff' : '#a0cfff'"
        :stroke-dasharray="selected ? undefined : '4 3'"
        stroke-width="1.5"
        :width="w"
        x="0"
        y="0"
      />

      <template v-if="selected">
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
        <rect
          v-for="name in corners"
          :key="name"
          fill="#fff"
          :height="handleSize"
          stroke="#409eff"
          stroke-width="1.5"
          :style="{cursor: cornerPos(name).cursor}"
          :width="handleSize"
          :x="cornerPos(name).x"
          :y="cornerPos(name).y"
          @pointerdown="onResizeStart($event, name)"
        />
      </template>
    </template>
  </g>
</template>
