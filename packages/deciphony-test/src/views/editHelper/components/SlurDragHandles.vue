<script lang="ts" setup>
import {computed} from 'vue'
import type {HorizontalHandleKind} from '../renderEditHorizontalDrag'
import type {SlurHandleKind, SlurHandlePoints} from '../renderEditSlurDrag'
import HorizontalDragHandles from './HorizontalDragHandles.vue'

const props = withDefaults(
  defineProps<{
    handles: SlurHandlePoints
    /** 五线谱月牙有控制点；简谱两端弧+横线不展示控制点 */
    showControl?: boolean
    /** 简谱：同踏板拖拽框，左右端控 x，中间点上下平移（control） */
    verticalControl?: boolean
  }>(),
  {showControl: true, verticalControl: false},
)

const emit = defineEmits<{
  'handle-down': [handle: SlurHandleKind, event: PointerEvent]
}>()

const HANDLE_SIZE = 8
const HANDLE_RADIUS = 4

const horizontalHandles = computed(() => ({
  start: props.handles.start,
  end: props.handles.end,
  middle: props.handles.control,
}))

function onHandleDown(handle: SlurHandleKind, event: PointerEvent) {
  event.stopPropagation()
  emit('handle-down', handle, event)
}

function onHorizontalHandleDown(handle: HorizontalHandleKind, event: PointerEvent) {
  emit('handle-down', handle === 'middle' ? 'control' : handle, event)
}
</script>

<template>
  <HorizontalDragHandles
    v-if="verticalControl && !handles.split"
    :handles="horizontalHandles"
    @handle-down="onHorizontalHandleDown"
  />
  <g v-else class="slur-drag-handles">
    <rect
      class="slur-drag-handles__square"
      :height="HANDLE_SIZE"
      :width="HANDLE_SIZE"
      :x="handles.start.x - HANDLE_SIZE / 2"
      :y="handles.start.y - HANDLE_SIZE / 2"
      @pointerdown="onHandleDown('start', $event)"
    />
    <circle
      v-if="showControl && !handles.split"
      class="slur-drag-handles__circle"
      :cx="handles.control.x"
      :cy="handles.control.y"
      :r="HANDLE_RADIUS"
      @pointerdown="onHandleDown('control', $event)"
    />
    <rect
      class="slur-drag-handles__square"
      :height="HANDLE_SIZE"
      :width="HANDLE_SIZE"
      :x="handles.end.x - HANDLE_SIZE / 2"
      :y="handles.end.y - HANDLE_SIZE / 2"
      @pointerdown="onHandleDown('end', $event)"
    />
  </g>
</template>

<style scoped>
.slur-drag-handles__square {
  fill: #fff;
  stroke: #409eff;
  stroke-width: 1.5;
  cursor: move;
}

.slur-drag-handles__circle {
  fill: #fff;
  stroke: #e6a23c;
  stroke-width: 1.5;
  cursor: move;
}
</style>
