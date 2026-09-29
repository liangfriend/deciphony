<script lang="ts" setup>
import type {HorizontalHandleKind, HorizontalHandlePoints} from '../renderEditHorizontalDrag'

defineProps<{
  handles: HorizontalHandlePoints
}>()

const emit = defineEmits<{
  'handle-down': [handle: HorizontalHandleKind, event: PointerEvent]
}>()

const END_SIZE = 8
const MIDDLE_W = 10
const MIDDLE_H = 14

function onHandleDown(handle: HorizontalHandleKind, event: PointerEvent) {
  event.stopPropagation()
  emit('handle-down', handle, event)
}
</script>

<template>
  <g class="horizontal-drag-handles">
    <rect
      class="horizontal-drag-handles__end horizontal-drag-handles__end--start"
      :height="END_SIZE"
      :width="END_SIZE"
      :x="handles.start.x - END_SIZE / 2"
      :y="handles.start.y - END_SIZE / 2"
      @pointerdown="onHandleDown('start', $event)"
    />
    <g
      class="horizontal-drag-handles__middle"
      :transform="`translate(${handles.middle.x}, ${handles.middle.y})`"
      @pointerdown="onHandleDown('middle', $event)"
    >
      <rect
        class="horizontal-drag-handles__middle-box"
        :height="MIDDLE_H"
        :width="MIDDLE_W"
        :x="-MIDDLE_W / 2"
        :y="-MIDDLE_H / 2"
      />
      <polygon class="horizontal-drag-handles__arrow" points="0,-8 -3.5,-3 3.5,-3"/>
      <polygon class="horizontal-drag-handles__arrow" points="0,8 -3.5,3 3.5,3"/>
    </g>
    <rect
      class="horizontal-drag-handles__end horizontal-drag-handles__end--end"
      :height="END_SIZE"
      :width="END_SIZE"
      :x="handles.end.x - END_SIZE / 2"
      :y="handles.end.y - END_SIZE / 2"
      @pointerdown="onHandleDown('end', $event)"
    />
  </g>
</template>

<style scoped>
.horizontal-drag-handles__end {
  fill: #fff;
  stroke: #409eff;
  stroke-width: 1.5;
  cursor: ew-resize;
}

.horizontal-drag-handles__middle {
  cursor: ns-resize;
}

.horizontal-drag-handles__middle-box {
  fill: #fff;
  stroke: #67c23a;
  stroke-width: 1.5;
}

.horizontal-drag-handles__arrow {
  fill: #67c23a;
  stroke: #529b2e;
  stroke-width: 0.5;
}
</style>
