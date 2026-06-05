<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import {computed} from 'vue'
import {addGrandStaffFromSlot} from '../renderEditSlotActions'
import {
  ADD_GRAND_STAFF_BTN_H,
  ADD_GRAND_STAFF_BTN_W,
  addGrandStaffBtnX,
  addGrandStaffBtnY,
} from '../renderEditSlotLayout'

const props = defineProps<{ node: VDom }>()

const transform = computed(
  () => `translate(${addGrandStaffBtnX(props.node)}, ${addGrandStaffBtnY(props.node)})`,
)

function onClick() {
  const slot = props.node.slotData
  if (slot) addGrandStaffFromSlot(slot)
}
</script>

<template>
  <g
    :transform="transform"
    class="add-grand-staff-btn"
    @click.stop="onClick"
    @pointerdown.stop
    @pointerup.stop
  >
    <rect
      :height="ADD_GRAND_STAFF_BTN_H"
      :width="ADD_GRAND_STAFF_BTN_W"
      fill="#FFB7C5"
      rx="18"
      ry="18"
      stroke="#FF8FAB"
      stroke-width="1.5"
    />
    <circle cx="22" cy="18" fill="#fff" opacity="0.92" r="10"/>
    <line stroke="#FF8FAB" stroke-linecap="round" stroke-width="2" x1="22" x2="22" y1="13" y2="23"/>
    <line stroke="#FF8FAB" stroke-linecap="round" stroke-width="2" x1="17" x2="27" y1="18" y2="18"/>
    <text
      dominant-baseline="middle"
      fill="#7A4455"
      font-size="13"
      font-weight="500"
      text-anchor="middle"
      x="58"
      y="19"
    >复谱表
    </text>
  </g>
</template>

<style scoped>
.add-grand-staff-btn {
  cursor: pointer;
  transition: filter 0.15s ease;
}

.add-grand-staff-btn:hover {
  filter: brightness(1.06) drop-shadow(0 2px 5px rgba(255, 143, 171, 0.45));
}
</style>
