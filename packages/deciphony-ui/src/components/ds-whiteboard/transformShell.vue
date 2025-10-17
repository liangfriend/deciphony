<template>
  <div
      ref="shell"
      :style="shellStyle"
      class="transform-shell"
      @pointerdown="onShellMouseDown"
  >
    <!-- 真实内容插槽 -->
    <div ref="content" :style="contentStyle" class="content-slot  hidden-scrollbar">
      <slot></slot>
    </div>

    <!-- 变形控制点 -->
    <template v-if="mode === 'edit'">
      <div
          v-for="handle in handles"
          :key="handle"
          :class="`handle-${handle}`"
          class="resize-handle"
          @pointerdown.stop="onResizeStart($event, handle)"
      />
      <!-- 旋转控制点 -->
      <div
          v-if="mode === 'edit'"
          class="rotate-handle"
          @pointerdown.stop="onRotateStart"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import {computed, CSSProperties, onMounted, onUnmounted, PropType, Ref, ref} from 'vue'

interface Position {
  x: number
  y: number
}

const props = defineProps({
  initX: {type: Number, default: 0},
  initY: {type: Number, default: 0},
  initW: {type: Number, default: 100},
  initH: {type: Number, default: 100},
  initAngle: {type: Number, default: 0},
  mode: {type: Object as PropType<Ref<string>>, default: ref('show')}
})
const mode = computed(() => {
  return props.mode.value
})
const emit = defineEmits<{
  (e: 'update', rect: { x: number; y: number; w: number; h: number; angle: number }): void
  (e: 'mousedown', ev: MouseEvent): void
}>()

const shell = ref<HTMLElement>()
const x = ref(props.initX)
const y = ref(props.initY)
const w = ref(props.initW)
const h = ref(props.initH)
const angle = ref(props.initAngle)

let dragging = false
let resizing = false
let rotating = false
let dragStart: Position = {x: 0, y: 0}
let rectStart: { x: number; y: number; w: number; h: number; angle: number } = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  angle: 0
}

let currentHandle = ''

// 控制点
const handles = ['lt', 'rt', 'lb', 'rb']

const shellStyle = computed((): CSSProperties => ({
  position: 'absolute',
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: `${w.value}px`,
  height: `${h.value}px`,
  transform: `rotate(${angle.value}deg)`,
  transformOrigin: 'center center',
  cursor: mode.value === 'edit' ? 'move' : 'default',
  boxSizing: 'border-box',
  ...(mode.value === 'edit'
      ? {outline: '1px dashed #409eff', userSelect: 'none'}
      : {})
}))

const contentStyle = computed((): CSSProperties => ({
  width: '100%',
  height: '100%',
  pointerEvents: mode.value === 'edit' ? 'none' : 'auto'
}))

function onShellMouseDown(e: MouseEvent) {
  if (mode.value !== 'edit') return
  // 如果已经在旋转，就不要开始拖拽
  if (rotating) return

  dragging = true
  dragStart = {x: e.clientX, y: e.clientY}
  rectStart = {x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value}
  emit('mousedown', e)
}

function onMouseMove(e: MouseEvent) {
  if (dragging) {
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    x.value = rectStart.x + dx
    y.value = rectStart.y + dy
    emit('update', {x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value})
  }

  if (resizing) {
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    let newW = rectStart.w
    let newH = rectStart.h
    let newX = rectStart.x
    let newY = rectStart.y

    switch (currentHandle) {
      case 'rb':
        newW += dx
        newH += dy
        break
      case 'lb':
        newW -= dx
        newH += dy
        newX += dx
        break
      case 'rt':
        newW += dx
        newH -= dy
        newY += dy
        break
      case 'lt':
        newW -= dx
        newH -= dy
        newX += dx
        newY += dy
        break
    }
    if (newW < 20) newW = 20
    if (newH < 20) newH = 20

    x.value = newX
    y.value = newY
    w.value = newW
    h.value = newH

    emit('update', {x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value})
  }

  if (rotating) {
    // 计算中心点
    const centerX = x.value + w.value / 2
    const centerY = y.value + h.value / 2

    // 计算起始角度（从中心到起始点）
    const startAngle = Math.atan2(rectStart.y + rectStart.h / 2 - centerY, rectStart.x + rectStart.w / 2 - centerX) * 180 / Math.PI

    // 计算当前角度（从中心到当前鼠标位置）
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI

    // 计算角度差 - 这里修正了旋转方向
    let angleDiff = currentAngle - startAngle

    // 确保角度差在合理范围内
    if (angleDiff > 180) angleDiff -= 360
    if (angleDiff < -180) angleDiff += 360

    // 应用角度差到起始角度
    angle.value = rectStart.angle + angleDiff

    // 规范化角度到0-360度
    if (angle.value < 0) angle.value += 360
    if (angle.value >= 360) angle.value -= 360

    emit('update', {x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value})
  }
}

function onMouseUp() {
  dragging = false
  resizing = false
  rotating = false
}

function onResizeStart(e: MouseEvent, handle: string) {
  resizing = true
  currentHandle = handle
  dragStart = {x: e.clientX, y: e.clientY}
  rectStart = {x: x.value, y: y.value, w: w.value, h: h.value, angle: angle.value}
}

function onRotateStart(e: MouseEvent) {
  rotating = true
  dragStart = {x: e.clientX, y: e.clientY}
  // 保存旋转开始时的状态
  rectStart = {
    x: x.value,
    y: y.value,
    w: w.value,
    h: h.value,
    angle: angle.value
  }
}

onMounted(() => {
  document.addEventListener('pointermove', onMouseMove)
  document.addEventListener('pointerup', onMouseUp)
})
onUnmounted(() => {
  document.removeEventListener('pointermove', onMouseMove)
  document.removeEventListener('pointerup', onMouseUp)
})
</script>

<style scoped>
.transform-shell {
  position: absolute;
}

.content-slot {
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #409eff;
  border: 1px solid #fff;
  box-sizing: border-box;
  z-index: 10;
}

.handle-lt {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.handle-rt {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.handle-lb {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

.handle-rb {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}

/* 旋转控制点样式 */
.rotate-handle {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  background: #ffa940;
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: grab;
  box-sizing: border-box;
  z-index: 10;
}

.rotate-handle:hover {
  background: #ff7a00;
}

.rotate-handle:active {
  cursor: grabbing;
}
</style>