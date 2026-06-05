<script lang="ts" setup>
import type {SlurHandleKind, SlurHandlePoints} from '../renderEditSlurDrag'

defineProps<{
  handles: SlurHandlePoints
}>()

const emit = defineEmits<{
  'handle-down': [handle: SlurHandleKind, event: PointerEvent]
}>()

const HANDLE_SIZE = 8
const HANDLE_RADIUS = 4

function onHandleDown(handle: SlurHandleKind, event: PointerEvent) {
  event.stopPropagation()
  emit('handle-down', handle, event)
}
</script>

<template>
  <g class="slur-drag-handles">
    <rect
      class="slur-drag-handles__square"
      :height="HANDLE_SIZE"
      :width="HANDLE_SIZE"
      :x="handles.start.x - HANDLE_SIZE / 2"
      :y="handles.start.y - HANDLE_SIZE / 2"
      @pointerdown="onHandleDown('start', $event)"
    />
    <circle
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
