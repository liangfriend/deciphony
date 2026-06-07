<script lang="ts" setup>
import type {VDom} from 'deciphony-renderer'
import {computed} from 'vue'
import {deleteSingleStaffFromSlot} from '../renderEditSlotActions'
import {
  DELETE_SINGLE_STAFF_BTN_H,
  DELETE_SINGLE_STAFF_BTN_W,
  deleteSingleStaffBtnX,
  deleteSingleStaffBtnY,
} from '../renderEditSlotLayout'

const props = defineProps<{ node: VDom }>()

const transform = computed(
    () => `translate(${deleteSingleStaffBtnX(props.node)}, ${deleteSingleStaffBtnY(props.node)})`,
)

const canDelete = computed(() => (props.node.slotData?.grandStaff?.staves.length ?? 0) > 1)

function onClick() {
  if (!canDelete.value) return
  const slot = props.node.slotData
  if (slot) deleteSingleStaffFromSlot(slot)
}
</script>

<template>
  <g
      :class="['delete-single-staff-btn', { 'delete-single-staff-btn--disabled': !canDelete }]"
      :transform="transform"
      @click.stop="onClick"
      @pointerdown.stop
      @pointerup.stop
  >
    <rect
        :height="DELETE_SINGLE_STAFF_BTN_H"
        :width="DELETE_SINGLE_STAFF_BTN_W"
        fill="#FFBDBD"
        rx="10"
        ry="10"
        stroke="#F56C6C"
        stroke-width="1.2"
    />
    <line stroke="#C45656" stroke-linecap="round" stroke-width="1.6" x1="6" x2="14" y1="10" y2="10"/>
  </g>
</template>

<style scoped>
.delete-single-staff-btn {
  cursor: pointer;
  transition: filter 0.15s ease;
}

.delete-single-staff-btn:hover {
  filter: brightness(1.06) drop-shadow(0 2px 5px rgba(122, 158, 239, 0.45));
}

.delete-single-staff-btn--disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.delete-single-staff-btn--disabled:hover {
  filter: none;
}
</style>
