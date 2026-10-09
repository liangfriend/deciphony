<script lang="ts" setup>
import {computed} from 'vue'
import type {FrameBox} from '../renderEditNoteAffiliatedDrag'

const props = defineProps<{
  /** 被拖符号的包围盒；按钮放在其右侧、纵向居中 */
  box: FrameBox
}>()

const emit = defineEmits<{
  'handle-down': [event: PointerEvent]
}>()

const SIZE = 14
const GAP = 4

const center = computed(() => ({
  x: props.box.x + props.box.w + GAP + SIZE / 2,
  y: props.box.y + props.box.h / 2,
}))

function onDown(event: PointerEvent) {
  event.stopPropagation()
  emit('handle-down', event)
}
</script>

<template>
  <g
    class="move-drag-handle"
    :transform="`translate(${center.x}, ${center.y})`"
    @pointerdown="onDown"
  >
    <rect
      class="move-drag-handle__box"
      :height="SIZE"
      :width="SIZE"
      :x="-SIZE / 2"
      :y="-SIZE / 2"
      rx="2"
    />
    <polygon class="move-drag-handle__arrow" points="0,-6 -2.5,-3 2.5,-3"/>
    <polygon class="move-drag-handle__arrow" points="0,6 -2.5,3 2.5,3"/>
    <polygon class="move-drag-handle__arrow" points="-6,0 -3,-2.5 -3,2.5"/>
    <polygon class="move-drag-handle__arrow" points="6,0 3,-2.5 3,2.5"/>
  </g>
</template>

<style scoped>
.move-drag-handle {
  cursor: move;
}

.move-drag-handle__box {
  fill: #fff;
  stroke: #67c23a;
  stroke-width: 1.5;
}

.move-drag-handle__arrow {
  fill: #67c23a;
  stroke: #529b2e;
  stroke-width: 0.5;
}
</style>
