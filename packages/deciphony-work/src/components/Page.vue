<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch} from 'vue'
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
    /** 宿主 startDraw～endDraw；仅 edit 下开启持久绘制（show 的教学标注在 SJWPDF 顶层） */
    inkSession?: boolean
    resolveSrc?: (src: string) => string
  }>(),
  {
    mode: 'show',
    inkSession: false,
    resolveSrc: (src: string) => src,
  },
)

const emit = defineEmits<{
  elementContextmenu: [payload: {element: SElement; event: MouseEvent}]
  scoreContextmenu: [payload: {score: SScore; event: MouseEvent}]
  /** 选中的曲谱 / 元素 id 变化（null = 取消选中） */
  selectionChange: [id: string | null]
  /** 裁剪模式的目标 id 变化（null = 退出裁剪） */
  cropChange: [id: string | null]
}>()

const drawCanvasRef = ref<HTMLCanvasElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const selectedId = ref<string | null>(null)
/** 裁剪模式目标；始终等于 selectedId 或为 null，选中项一变就退出 */
const cropId = ref<string | null>(null)

/** 编辑模式：持久绘制会话（startDraw～endDraw → page.drawings） */
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
  () => drawingSession.value && props.mode === 'edit' && !props.thumbnail,
)
const brushCursorSize = computed(
  () => brushByTool.value[activeTool.value]?.lineWidth ?? 3,
)
/** 背景图 URL；无背景时仅白底 div */
const bgUrl = computed(() => {
  const src = props.page.background?.src
  if (!src) return ''
  return props.resolveSrc(src)
})

function ensureDrawings(): DrawStroke[] {
  if (!props.page.drawings) props.page.drawings = []
  return props.page.drawings
}

function syncDrawLayer() {
  const canvas = drawCanvasRef.value
  if (!canvas) return
  canvas.width = props.page.width
  canvas.height = props.page.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  paintStrokes(ctx, props.page.drawings ?? [])
}

/** 开始持久绘制（仅 edit；show 下的教学标注由 SJWPDF 顶层负责） */
function startDraw() {
  if (props.thumbnail || props.mode !== 'edit') return
  drawingSession.value = true
  void nextTick(() => syncDrawLayer())
  clearSelection()
}

function clearSelection() {
  selectedId.value = null
}

function selectItem(id: string) {
  selectedId.value = id
}

/** 进入裁剪模式（会选中该项）；调用方负责确认是曲谱或已知原始尺寸的图片 */
function startCrop(id: string) {
  if (!editable.value) return
  selectedId.value = id
  cropId.value = id
}

function endCrop() {
  cropId.value = null
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

function onPointerDown(ev: PointerEvent) {
  if (!drawInteractive.value) return
  if (ev.button !== 0) return
  const canvas = drawCanvasRef.value
  if (!canvas) return
  // 未正确初始化时补齐 bitmap，否则笔画会画在默认 300×150 外
  if (canvas.width !== props.page.width || canvas.height !== props.page.height) {
    syncDrawLayer()
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return

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

function onPointerMove(ev: PointerEvent) {
  updateBrushCursor(ev)
  if (!stroking || !currentStroke || ev.pointerId !== activePointerId) return
  const ctx = drawCanvasRef.value?.getContext('2d') ?? null
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

function resetStrokeState() {
  stroking = false
  activePointerId = null
  currentStroke = null
  hideBrushCursor()
}

/** 与 SJWPDF inkSession 对齐：优先听 prop，兼容直接调 Page.startDraw */
watch(
  () => [props.inkSession, props.mode] as const,
  ([on, mode]) => {
    if (props.thumbnail || !on || mode !== 'edit') {
      drawingSession.value = false
      resetStrokeState()
      return
    }
    drawingSession.value = true
    void nextTick(() => syncDrawLayer())
    clearSelection()
  },
)

function endDraw() {
  drawingSession.value = false
  resetStrokeState()
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

/** 清空持久笔迹 page.drawings */
function clearDrawings() {
  props.page.drawings = []
  syncDrawLayer()
}

onMounted(() => {
  syncDrawLayer()
})
onBeforeUnmount(() => {
  endDraw()
})

watch(
  () => [props.page.id, props.page.width, props.page.height] as const,
  (next, prev) => {
    if (prev && next[0] !== prev[0]) {
      if (stroking) resetStrokeState()
      clearSelection()
    }
    syncDrawLayer()
  },
)
watch(selectedId, (id) => {
  if (id !== cropId.value) cropId.value = null
  emit('selectionChange', id)
})
watch(cropId, (id) => emit('cropChange', id))
watch(
  () => props.page.drawings,
  () => {
    if (stroking) return
    syncDrawLayer()
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
  getSelectedId: () => selectedId.value,
  clearSelection,
  startCrop,
  endCrop,
  getCropId: () => cropId.value,
})
</script>

<template>
  <div
    class="sjw-page"
    :class="{
      'sjw-page--thumbnail': thumbnail,
      'sjw-page--edit': editable,
      'sjw-page--show': mode === 'show' && !thumbnail,
      'sjw-page--drawing': drawInteractive,
    }"
    :data-sjw-mode="mode"
    :style="{width: `${page.width}px`, height: `${page.height}px`}"
  >
    <div class="sjw-page__layer sjw-page__bg" aria-hidden="true">
      <img
        v-if="bgUrl"
        class="sjw-page__bg-img"
        alt=""
        draggable="false"
        :src="bgUrl"
      />
    </div>
    <svg
      ref="svgRef"
      class="sjw-page__layer sjw-page__svg"
      :class="{'sjw-page__svg--ink': drawInteractive}"
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
          :cropping="editable && cropId === sc.id"
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
          :cropping="editable && cropId === el.id"
          @contextmenu="onElementContextMenu(el, $event)"
          @select="selectItem(el.id)"
        />
      </g>
    </svg>
    <canvas
      ref="drawCanvasRef"
      class="sjw-page__layer sjw-page__draw"
      :class="{'sjw-page__draw--active': drawInteractive}"
      @pointercancel="endStroke"
      @pointerdown="onPointerDown"
      @pointerenter="updateBrushCursor"
      @pointerleave="hideBrushCursor"
      @pointermove="onPointerMove"
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
  background: #fff;
  overflow: hidden;
  pointer-events: none;
}

.sjw-page__bg-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
  -webkit-user-drag: none;
}

.sjw-page__svg {
  z-index: 2;
  overflow: visible;
  width: 100%;
  height: 100%;
}

/* 绘制中禁用 svg（含 foreignObject 文本），避免抢走指针去拖元素 */
.sjw-page__svg--ink {
  pointer-events: none;
}

.sjw-page__draw {
  z-index: 3;
  width: 100%;
  height: 100%;
  touch-action: none;
  pointer-events: none;
}

.sjw-page__draw--active {
  cursor: none;
  pointer-events: auto;
}

.sjw-page__brush-cursor {
  position: absolute;
  z-index: 6;
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
