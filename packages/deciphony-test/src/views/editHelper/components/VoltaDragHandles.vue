<script lang="ts" setup>
import type {VoltaHandleKind, VoltaHandlePoints} from '../renderEditVoltaDrag'

defineProps<{
  handles: VoltaHandlePoints
}>()

const emit = defineEmits<{
  'handle-down': [handle: VoltaHandleKind, event: PointerEvent]
}>()

const HANDLE_SIZE = 8

function onHandleDown(handle: VoltaHandleKind, event: PointerEvent) {
  event.stopPropagation()
  emit('handle-down', handle, event)
}
</script>

<template>
  <g class="volta-drag-handles">
    <rect
      class="volta-drag-handles__square volta-drag-handles__square--left"
      :height="HANDLE_SIZE"
      :width="HANDLE_SIZE"
      :x="handles.left.x - HANDLE_SIZE / 2"
      :y="handles.left.y - HANDLE_SIZE / 2"
      @pointerdown="onHandleDown('left', $event)"
    />
    <rect
      class="volta-drag-handles__square volta-drag-handles__square--right"
      :height="HANDLE_SIZE"
      :width="HANDLE_SIZE"
      :x="handles.right.x - HANDLE_SIZE / 2"
      :y="handles.right.y - HANDLE_SIZE / 2"
      @pointerdown="onHandleDown('right', $event)"
    />
    <g
      class="volta-drag-handles__center"
      :transform="`translate(${handles.center.x}, ${handles.center.y})`"
      @pointerdown="onHandleDown('center', $event)"
    >
      <polygon class="volta-drag-handles__arrow" points="0,-7 -4,-1 4,-1"/>
      <polygon class="volta-drag-handles__arrow" points="0,7 -4,1 4,1"/>
    </g>
  </g>
</template>

<style scoped>
.volta-drag-handles__square {
  fill: #fff;
  stroke: #409eff;
  stroke-width: 1.5;
}

.volta-drag-handles__square--left,
.volta-drag-handles__square--right {
  cursor: ew-resize;
}

.volta-drag-handles__center {
  cursor: ns-resize;
}

.volta-drag-handles__arrow {
  fill: #67c23a;
  stroke: #529b2e;
  stroke-width: 0.5;
}
</style>
