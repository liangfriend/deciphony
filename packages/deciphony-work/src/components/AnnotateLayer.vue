<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {DrawToolEnum} from '../enums/drawToolEnum'
import {paintStroke, paintStrokeSegment, paintStrokes} from '../draw/paintStrokes'
import type {DrawBrushOptions, DrawStroke} from '../types/types'

/**
 * 展示模式教学标注层：铺满 SJWPDF 内容区（可画到白板之外）。
 * 笔迹坐标以白板左上角为原点（可为负 / 超出页宽高），随白板居中位置平移重绘；
 * 按 pageId 缓存在内存，不序列化。
 */
const props = defineProps<{
  pageId: string
  pageWidth: number
  pageHeight: number
  /** 是否显示（展示模式） */
  visible: boolean
  /** 是否接收指针（startDraw～endDraw） */
  active: boolean
  getPageEl: () => HTMLElement | null
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const annotationsByPageId = new Map<string, DrawStroke[]>()

function strokesOfCurrent(): DrawStroke[] {
  let list = annotationsByPageId.get(props.pageId)
  if (!list) {
    list = []
    annotationsByPageId.set(props.pageId, list)
  }
  return list
}

const activeTool = ref<DrawToolEnum>(DrawToolEnum.Pen)
const brushByTool = ref<Record<DrawToolEnum, {color: string; lineWidth: number}>>({
  [DrawToolEnum.Pen]: {color: '#000000', lineWidth: 3},
  [DrawToolEnum.Eraser]: {color: '#000000', lineWidth: 20},
})
const brushCursorSize = computed(() => brushByTool.value[activeTool.value]?.lineWidth ?? 3)

/** 笔触预览圈（层内坐标） */
const brushCursorVisible = ref(false)
const brushCursorX = ref(0)
const brushCursorY = ref(0)

let stroking = false
let activePointerId: number | null = null
let currentStroke: DrawStroke | null = null

/** 层内 CSS px → canvas bitmap 的缩放（宿主若对 SJWPDF 做 transform 缩放也能对齐） */
function layerMetrics() {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const sx = rect.width && canvas.width ? rect.width / canvas.width : 1
  const sy = rect.height && canvas.height ? rect.height / canvas.height : 1
  const pageEl = props.getPageEl()
  const pRect = pageEl?.getBoundingClientRect()
  const ox = pRect ? (pRect.left - rect.left) / sx : 0
  const oy = pRect ? (pRect.top - rect.top) / sy : 0
  return {rect, sx, sy, ox, oy}
}

function repaint() {
  const canvas = canvasRef.value
  const root = rootRef.value
  if (!canvas || !root) return
  const w = root.clientWidth
  const h = root.clientHeight
  if (!w || !h) return
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const m = layerMetrics()
  if (!m) return
  ctx.setTransform(1, 0, 0, 1, m.ox, m.oy)
  paintStrokes(ctx, strokesOfCurrent())
}

function scheduleRepaint() {
  void nextTick(() => requestAnimationFrame(repaint))
}

function toPoints(ev: PointerEvent) {
  const m = layerMetrics()
  if (!m) return null
  const lx = (ev.clientX - m.rect.left) / m.sx
  const ly = (ev.clientY - m.rect.top) / m.sy
  return {local: [lx, ly] as [number, number], page: [lx - m.ox, ly - m.oy] as [number, number]}
}

function updateBrushCursor(ev: PointerEvent) {
  if (!props.active) {
    brushCursorVisible.value = false
    return
  }
  const p = toPoints(ev)
  if (!p) return
  brushCursorX.value = p.local[0]
  brushCursorY.value = p.local[1]
  brushCursorVisible.value = true
}

function hideBrushCursor() {
  brushCursorVisible.value = false
}

function onPointerDown(ev: PointerEvent) {
  if (!props.active || ev.button !== 0) return
  const canvas = canvasRef.value
  if (!canvas) return
  if (canvas.width !== rootRef.value?.clientWidth || canvas.height !== rootRef.value?.clientHeight) {
    repaint()
  }
  const ctx = canvas.getContext('2d')
  const p = toPoints(ev)
  if (!ctx || !p) return

  canvas.setPointerCapture(ev.pointerId)
  activePointerId = ev.pointerId
  stroking = true
  updateBrushCursor(ev)

  const brush = brushByTool.value[activeTool.value]
  currentStroke = {tool: activeTool.value, lineWidth: brush.lineWidth, points: [p.page]}
  if (activeTool.value === DrawToolEnum.Pen) currentStroke.color = brush.color
  strokesOfCurrent().push(currentStroke)
  paintStroke(ctx, currentStroke)
}

function onPointerMove(ev: PointerEvent) {
  updateBrushCursor(ev)
  if (!stroking || !currentStroke || ev.pointerId !== activePointerId) return
  const ctx = canvasRef.value?.getContext('2d')
  const p = toPoints(ev)
  if (!ctx || !p) return

  const next = p.page
  const prev = currentStroke.points[currentStroke.points.length - 1]
  if (!prev) {
    currentStroke.points.push(next)
    paintStroke(ctx, currentStroke)
    return
  }
  const dx = next[0] - prev[0]
  const dy = next[1] - prev[1]
  if (dx * dx + dy * dy < 0.25) return
  currentStroke.points.push(next)
  paintStrokeSegment(ctx, currentStroke, prev, next)
}

function endStroke(ev: PointerEvent) {
  if (!stroking || ev.pointerId !== activePointerId) return
  stroking = false
  activePointerId = null
  currentStroke = null
  try {
    canvasRef.value?.releasePointerCapture(ev.pointerId)
  } catch {
    /* already released */
  }
  updateBrushCursor(ev)
}

function resetStrokeState() {
  stroking = false
  activePointerId = null
  currentStroke = null
  hideBrushCursor()
}

function setTool(tool: DrawToolEnum, options: DrawBrushOptions = {}) {
  if (tool !== DrawToolEnum.Pen && tool !== DrawToolEnum.Eraser) {
    throw new Error(`未知绘制工具: ${tool}`)
  }
  activeTool.value = tool
  const cur = brushByTool.value[tool]
  if (options.color !== undefined && tool === DrawToolEnum.Pen) cur.color = options.color
  if (options.lineWidth !== undefined) {
    const w = Number(options.lineWidth)
    if (Number.isFinite(w) && w > 0) cur.lineWidth = w
  }
}

/** 仅清空当前页标注 */
function clear() {
  if (stroking) resetStrokeState()
  annotationsByPageId.set(props.pageId, [])
  repaint()
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => repaint())
  if (rootRef.value) resizeObserver.observe(rootRef.value)
  scheduleRepaint()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  annotationsByPageId.clear()
})

watch(
  () => [props.pageId, props.pageWidth, props.pageHeight, props.visible] as const,
  (next, prev) => {
    if (prev && next[0] !== prev[0] && stroking) resetStrokeState()
    scheduleRepaint()
  },
)

watch(
  () => props.active,
  (on) => {
    if (!on) resetStrokeState()
    else scheduleRepaint()
  },
)

defineExpose({
  setTool,
  getTool: () => activeTool.value,
  clear,
})
</script>

<template>
  <div
    v-show="visible"
    ref="rootRef"
    class="sjw-annotate"
    :class="{'sjw-annotate--active': active}"
  >
    <canvas
      ref="canvasRef"
      class="sjw-annotate__canvas"
      @pointercancel="endStroke"
      @pointerdown="onPointerDown"
      @pointerenter="updateBrushCursor"
      @pointerleave="hideBrushCursor"
      @pointermove="onPointerMove"
      @pointerup="endStroke"
    />
    <div
      v-show="active && brushCursorVisible"
      class="sjw-annotate__brush-cursor"
      :style="{
        width: `${brushCursorSize}px`,
        height: `${brushCursorSize}px`,
        left: `${brushCursorX}px`,
        top: `${brushCursorY}px`,
      }"
    />
  </div>
</template>

<style scoped>
.sjw-annotate {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  touch-action: none;
  pointer-events: none;
}

.sjw-annotate--active {
  cursor: none;
  pointer-events: auto;
}

.sjw-annotate__canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.sjw-annotate__brush-cursor {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px dashed #606266;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: transparent;
}
</style>
