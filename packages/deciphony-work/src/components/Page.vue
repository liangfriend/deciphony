<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, provide, ref, watch} from 'vue'
import {DrawToolEnum} from '../enums/drawToolEnum'
import {paintStroke, paintStrokeSegment, paintStrokes} from '../draw/paintStrokes'
import type {DrawBrushOptions, DrawStroke, SElement, SPage, SScore, SjwMode} from '../types/types'
import ElementNode from './ElementNode.vue'
import Score from './Score.vue'

const props = withDefaults(
  defineProps<{
    page: SPage
    /** 缩略图预览模式：禁用编辑框与绘制交互 */
    thumbnail?: boolean
    /** show：不显示编辑框；edit：显示通用编辑框 */
    mode?: SjwMode
    resolveSrc?: (src: string) => string
  }>(),
  {
    mode: 'show',
    resolveSrc: (src: string) => src,
  },
)

const emit = defineEmits<{
  elementContextmenu: [payload: {element: SElement; event: MouseEvent}]
  scoreContextmenu: [payload: {score: SScore; event: MouseEvent}]
}>()

const bgCanvasRef = ref<HTMLCanvasElement | null>(null)
const drawCanvasRef = ref<HTMLCanvasElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const selectedId = ref<string | null>(null)

/** 是否处于绘制会话（startDraw～endDraw） */
const drawingSession = ref(false)
const activeTool = ref<DrawToolEnum>(DrawToolEnum.Pen)
const brushByTool = ref<Record<DrawToolEnum, {color: string; lineWidth: number}>>({
  [DrawToolEnum.Pen]: {color: '#000000', lineWidth: 3},
  [DrawToolEnum.Eraser]: {color: '#000000', lineWidth: 20},
})

/** 笔触预览圈（页面坐标） */
const brushCursorVisible = ref(false)
const brushCursorX = ref(0)
const brushCursorY = ref(0)

let stroking = false
let activePointerId: number | null = null
let currentStroke: DrawStroke | null = null

provide('sjwSvgRoot', svgRef)

const elements = computed(() => props.page.elements ?? [])
const scores = computed(() => props.page.scores ?? [])
const editable = computed(() => props.mode === 'edit' && !props.thumbnail)
const drawInteractive = computed(
  () => drawingSession.value && !props.thumbnail,
)
const brushCursorSize = computed(
  () => brushByTool.value[activeTool.value]?.lineWidth ?? 3,
)

function ensureDrawings(): DrawStroke[] {
  if (!props.page.drawings) props.page.drawings = []
  return props.page.drawings
}

function getDrawCtx(): CanvasRenderingContext2D | null {
  const canvas = drawCanvasRef.value
  if (!canvas) return null
  return canvas.getContext('2d')
}

function paintBackground() {
  const canvas = bgCanvasRef.value
  if (!canvas) return
  const {width, height} = props.page
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const bgSrc = props.page.background?.src
  if (!bgSrc) return
  const url = props.resolveSrc(bgSrc)
  if (!url) return

  const img = new Image()
  img.onload = () => {
    if (bgCanvasRef.value !== canvas) return
    ctx.drawImage(img, 0, 0, width, height)
  }
  img.src = url
}

function paintDrawLayer() {
  const canvas = drawCanvasRef.value
  if (!canvas) return
  canvas.width = props.page.width
  canvas.height = props.page.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  paintStrokes(ctx, props.page.drawings ?? [])
}

function syncLayers() {
  paintBackground()
  paintDrawLayer()
}

function clearSelection() {
  selectedId.value = null
}

function selectItem(id: string) {
  selectedId.value = id
}

function onElementContextMenu(el: SElement, ev: MouseEvent) {
  if (props.thumbnail) return
  selectItem(el.id)
  emit('elementContextmenu', {element: el, event: ev})
}

function onScoreContextMenu(sc: SScore, ev: MouseEvent) {
  if (props.thumbnail) return
  selectItem(sc.id)
  emit('scoreContextmenu', {score: sc, event: ev})
}

function toPagePoint(ev: PointerEvent): [number, number] {
  const canvas = drawCanvasRef.value
  if (!canvas) return [0, 0]
  const rect = canvas.getBoundingClientRect()
  const w = rect.width || 1
  const h = rect.height || 1
  const x = ((ev.clientX - rect.left) / w) * props.page.width
  const y = ((ev.clientY - rect.top) / h) * props.page.height
  return [x, y]
}

function updateBrushCursor(ev: PointerEvent) {
  if (!drawInteractive.value) {
    brushCursorVisible.value = false
    return
  }
  const [x, y] = toPagePoint(ev)
  brushCursorX.value = x
  brushCursorY.value = y
  brushCursorVisible.value = true
}

function hideBrushCursor() {
  brushCursorVisible.value = false
}

function onDrawPointerDown(ev: PointerEvent) {
  if (!drawInteractive.value) return
  if (ev.button !== 0) return
  const canvas = drawCanvasRef.value
  const ctx = getDrawCtx()
  if (!canvas || !ctx) return

  canvas.setPointerCapture(ev.pointerId)
  activePointerId = ev.pointerId
  stroking = true
  clearSelection()
  updateBrushCursor(ev)

  const brush = brushByTool.value[activeTool.value]
  const point = toPagePoint(ev)
  currentStroke = {
    tool: activeTool.value,
    lineWidth: brush.lineWidth,
    points: [point],
  }
  if (activeTool.value === DrawToolEnum.Pen) {
    currentStroke.color = brush.color
  }
  ensureDrawings().push(currentStroke)
  paintStroke(ctx, currentStroke)
}

function onDrawPointerMove(ev: PointerEvent) {
  updateBrushCursor(ev)
  if (!stroking || !currentStroke || ev.pointerId !== activePointerId) return
  const ctx = getDrawCtx()
  if (!ctx) return

  const next = toPagePoint(ev)
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
    drawCanvasRef.value?.releasePointerCapture(ev.pointerId)
  } catch {
    /* already released */
  }
  updateBrushCursor(ev)
}

function startDraw() {
  if (props.thumbnail) return
  drawingSession.value = true
  clearSelection()
}

function endDraw() {
  drawingSession.value = false
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
  if (options.color !== undefined && tool === DrawToolEnum.Pen) {
    cur.color = options.color
  }
  if (options.lineWidth !== undefined) {
    const w = Number(options.lineWidth)
    if (Number.isFinite(w) && w > 0) cur.lineWidth = w
  }
}

/** @deprecated 同 setTool(tool, options) */
function setBrush(tool: DrawToolEnum, options: DrawBrushOptions = {}) {
  setTool(tool, options)
}

function clearDrawings() {
  props.page.drawings = []
  paintDrawLayer()
}

onMounted(syncLayers)
onBeforeUnmount(() => {
  endDraw()
})

watch(
  () =>
    [
      props.page.id,
      props.page.width,
      props.page.height,
      props.page.background?.src,
    ] as const,
  syncLayers,
)
watch(
  () => props.page.drawings,
  () => {
    if (stroking) return
    paintDrawLayer()
  },
  {deep: true},
)
watch(
  () => props.mode,
  (m) => {
    if (m !== 'edit') selectedId.value = null
  },
)

defineExpose({
  startDraw,
  endDraw,
  setTool,
  setBrush,
  clearDrawings,
  isDrawing: () => drawingSession.value,
  getTool: () => activeTool.value,
})
</script>

<template>
  <div
    class="sjw-page"
    :class="{
      'sjw-page--thumbnail': thumbnail,
      'sjw-page--edit': editable,
      'sjw-page--drawing': drawInteractive,
    }"
    :style="{width: `${page.width}px`, height: `${page.height}px`}"
  >
    <canvas ref="bgCanvasRef" class="sjw-page__layer sjw-page__bg"/>
    <svg
      ref="svgRef"
      class="sjw-page__layer sjw-page__svg"
      :height="page.height"
      preserveAspectRatio="none"
      :viewBox="`0 0 ${page.width} ${page.height}`"
      :width="page.width"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill="transparent"
        :height="page.height"
        :width="page.width"
        x="0"
        y="0"
        @pointerdown="clearSelection"
      />
      <rect
        fill="none"
        :height="page.height - 1"
        pointer-events="none"
        stroke="#e4e7ed"
        stroke-width="1"
        :width="page.width - 1"
        x="0.5"
        y="0.5"
      />
      <g class="sjw-page__scores">
        <Score
          v-for="sc in scores"
          :key="sc.id"
          :editable="editable"
          :score="sc"
          :selected="editable && selectedId === sc.id"
          @contextmenu="onScoreContextMenu(sc, $event)"
          @select="selectItem(sc.id)"
        />
      </g>
      <g class="sjw-page__elements">
        <ElementNode
          v-for="el in elements"
          :key="el.id"
          :editable="editable"
          :element="el"
          :resolve-src="resolveSrc"
          :selected="editable && selectedId === el.id"
          @contextmenu="onElementContextMenu(el, $event)"
          @select="selectItem(el.id)"
        />
      </g>
    </svg>
    <canvas
      ref="drawCanvasRef"
      class="sjw-page__layer sjw-page__draw"
      :class="{'sjw-page__draw--active': drawInteractive}"
      :style="{pointerEvents: drawInteractive ? 'auto' : 'none'}"
      @pointercancel="endStroke"
      @pointerdown="onDrawPointerDown"
      @pointerenter="updateBrushCursor"
      @pointerleave="hideBrushCursor"
      @pointermove="onDrawPointerMove"
      @pointerup="endStroke"
    />
    <div
      v-show="drawInteractive && brushCursorVisible"
      class="sjw-page__brush-cursor"
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
.sjw-page {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  background: #fff;
}

.sjw-page__layer {
  position: absolute;
  inset: 0;
  display: block;
}

.sjw-page__bg {
  z-index: 1;
}

.sjw-page__svg {
  z-index: 2;
  overflow: visible;
  width: 100%;
  height: 100%;
}

.sjw-page__draw {
  z-index: 3;
  touch-action: none;
}

.sjw-page__draw--active {
  cursor: none;
}

.sjw-page__brush-cursor {
  position: absolute;
  z-index: 4;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px dashed #606266;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: transparent;
}

.sjw-page--thumbnail {
  box-shadow: none;
  border: 1px solid #dcdfe6;
}

.sjw-page--edit {
  overflow: visible;
}

.sjw-page--drawing {
  overflow: hidden;
}
</style>
