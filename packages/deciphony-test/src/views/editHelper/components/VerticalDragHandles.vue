<script lang="ts" setup>
import type {VerticalHandleKind, VerticalHandlePoints} from '../renderEditVerticalDrag'

defineProps<{
  handles: VerticalHandlePoints
}>()

const emit = defineEmits<{
  'handle-down': [handle: VerticalHandleKind, event: PointerEvent]
}>()

const END_SIZE = 8
const MIDDLE_W = 14
const MIDDLE_H = 10

function onHandleDown(handle: VerticalHandleKind, event: PointerEvent) {
  event.stopPropagation()
  emit('handle-down', handle, event)
}
</script>

<template>
  <g class="vertical-drag-handles">
    <rect
      class="vertical-drag-handles__end vertical-drag-handles__end--start"
      :height="END_SIZE"
      :width="END_SIZE"
      :x="handles.start.x - END_SIZE / 2"
      :y="handles.start.y - END_SIZE / 2"
      @pointerdown="onHandleDown('start', $event)"
    />
    <g
      class="vertical-drag-handles__middle"
      :transform="`translate(${handles.middle.x}, ${handles.middle.y})`"
      @pointerdown="onHandleDown('middle', $event)"
    >
      <rect
        class="vertical-drag-handles__middle-box"
        :height="MIDDLE_H"
        :width="MIDDLE_W"
        :x="-MIDDLE_W / 2"
        :y="-MIDDLE_H / 2"
      />
      <polygon class="vertical-drag-handles__arrow" points="-8,0 -3,-3.5 -3,3.5"/>
      <polygon class="vertical-drag-handles__arrow" points="8,0 3,-3.5 3,3.5"/>
    </g>
    <rect
      class="vertical-drag-handles__end vertical-drag-handles__end--end"
      :height="END_SIZE"
      :width="END_SIZE"
      :x="handles.end.x - END_SIZE / 2"
      :y="handles.end.y - END_SIZE / 2"
      @pointerdown="onHandleDown('end', $event)"
    />
  </g>
</template>

<style scoped>
.vertical-drag-handles__end {
  fill: #fff;
  stroke: #409eff;
  stroke-width: 1.5;
  cursor: ns-resize;
}

.vertical-drag-handles__middle {
  cursor: ew-resize;
}

.vertical-drag-handles__middle-box {
  fill: #fff;
  stroke: #67c23a;
  stroke-width: 1.5;
}

.vertical-drag-handles__arrow {
  fill: #67c23a;
  stroke: #529b2e;
  stroke-width: 0.5;
}
</style>
