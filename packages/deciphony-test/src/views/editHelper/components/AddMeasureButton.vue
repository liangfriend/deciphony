<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import {computed} from 'vue'
import {addMeasureFromSlot} from '../renderEditSlotActions'
import {
  ADD_MEASURE_BTN_H,
  ADD_MEASURE_BTN_W,
  addMeasureBtnX,
  addMeasureBtnY,
} from '../renderEditSlotLayout'

const props = defineProps<{ node: VDom }>()

const transform = computed(
  () => `translate(${addMeasureBtnX(props.node)}, ${addMeasureBtnY(props.node)})`,
)

function onClick() {
  const slot = props.node.slotData
  if (slot) addMeasureFromSlot(slot)
}
</script>

<template>
  <g
    :transform="transform"
    class="add-measure-btn"
    @click.stop="onClick"
    @pointerdown.stop
    @pointerup.stop
  >
    <rect
      :height="ADD_MEASURE_BTN_H"
      :width="ADD_MEASURE_BTN_W"
      fill="#C8F0D0"
      rx="10"
      ry="10"
      stroke="#7BC996"
      stroke-width="1.2"
    />
    <line stroke="#4F9E6A" stroke-linecap="round" stroke-width="1.6" x1="6" x2="12.5" y1="10" y2="10"/>
    <polyline
      fill="none"
      points="10.5,7 14,10 10.5,13"
      stroke="#4F9E6A"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.6"
    />
  </g>
</template>

<style scoped>
.add-measure-btn {
  cursor: pointer;
  transition: filter 0.15s ease;
}

.add-measure-btn:hover {
  filter: brightness(1.06) drop-shadow(0 2px 5px rgba(123, 201, 150, 0.45));
}
</style>
