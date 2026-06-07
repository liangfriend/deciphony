<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import {computed} from 'vue'
import {deleteGrandStaffFromSlot} from '../renderEditSlotActions'
import {
  DELETE_GRAND_STAFF_BTN_H,
  DELETE_GRAND_STAFF_BTN_W,
  deleteGrandStaffBtnX,
  deleteGrandStaffBtnY,
} from '../renderEditSlotLayout'

const props = defineProps<{ node: VDom }>()

const transform = computed(
  () => `translate(${deleteGrandStaffBtnX(props.node)}, ${deleteGrandStaffBtnY(props.node)})`,
)

const canDelete = computed(() => (props.node.slotData?.musicScore.grandStaffs.length ?? 0) > 1)

function onClick() {
  if (!canDelete.value) return
  const slot = props.node.slotData
  if (slot) deleteGrandStaffFromSlot(slot)
}
</script>

<template>
  <g
    :class="['delete-grand-staff-btn', { 'delete-grand-staff-btn--disabled': !canDelete }]"
    :transform="transform"
    @click.stop="onClick"
    @pointerdown.stop
    @pointerup.stop
  >
    <rect
      :height="DELETE_GRAND_STAFF_BTN_H"
      :width="DELETE_GRAND_STAFF_BTN_W"
      fill="#FFC4CE"
      rx="18"
      ry="18"
      stroke="#F08FA3"
      stroke-width="1.5"
    />
    <circle cx="22" cy="18" fill="#fff" opacity="0.92" r="10"/>
    <line stroke="#F08FA3" stroke-linecap="round" stroke-width="2" x1="17" x2="27" y1="18" y2="18"/>
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
.delete-grand-staff-btn {
  cursor: pointer;
  transition: filter 0.15s ease;
}

.delete-grand-staff-btn:hover {
  filter: brightness(1.06) drop-shadow(0 2px 5px rgba(240, 143, 163, 0.45));
}

.delete-grand-staff-btn--disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.delete-grand-staff-btn--disabled:hover {
  filter: none;
}
</style>
