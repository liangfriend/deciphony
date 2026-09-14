<script lang="ts" setup>
import {computed, ref} from 'vue'
import {
  FLATTEN_HEAD_W,
  FLATTEN_LINE_GAP,
  FLATTEN_STAFF_PAD_Y,
  FLATTEN_STEM_LENGTH,
  MAX_SYNC_SECONDS,
} from '../constants'
import {writePassTime} from '../flattenSlots'
import type {FlattenStaffRow} from '../types'
import SimpleNote from './SimpleNote.vue'

const props = defineProps<{
  rows: FlattenStaffRow[]
  pxPerSecond: number
  timePropName: string
  /** 轴宽（10min * px） */
  axisWidth: number
  playheadX: number
  /** 版本戳：外部改 data 后递增以刷新 */
  revision: number
}>()

const emit = defineEmits<{
  timeChange: []
}>()

const staffInnerH = 4 * FLATTEN_LINE_GAP
const rowH = staffInnerH + FLATTEN_STAFF_PAD_Y * 2

const totalH = computed(() => Math.max(rowH, props.rows.length * rowH))

function staffTopInRow(): number {
  return FLATTEN_STAFF_PAD_Y
}

function slotBox(slot: FlattenStaffRow['slots'][number]) {
  const x = slot.time * props.pxPerSecond
  const w = FLATTEN_HEAD_W + 16
  const h = staffInnerH + FLATTEN_STEM_LENGTH + 8
  const y = FLATTEN_STAFF_PAD_Y - FLATTEN_STEM_LENGTH - 4
  return {x, y, w, h}
}

// —— 拖拽 ——
const draggingKey = ref<string | null>(null)
let dragStartClientX = 0
let dragStartTime = 0

function onPointerDown(ev: PointerEvent, slot: FlattenStaffRow['slots'][number]) {
  ev.preventDefault()
  const target = ev.currentTarget as Element
  target.setPointerCapture(ev.pointerId)
  draggingKey.value = slot.flattenKey
  dragStartClientX = ev.clientX
  dragStartTime = slot.time
}

function onPointerMove(ev: PointerEvent, slot: FlattenStaffRow['slots'][number]) {
  if (draggingKey.value !== slot.flattenKey) return
  const dx = ev.clientX - dragStartClientX
  const next = dragStartTime + dx / props.pxPerSecond
  writePassTime(slot.slotRef, props.timePropName, slot.passIndex, next)
  slot.time = Math.min(MAX_SYNC_SECONDS, Math.max(0, next))
}

function onPointerUp(ev: PointerEvent, slot: FlattenStaffRow['slots'][number]) {
  if (draggingKey.value !== slot.flattenKey) return
  const target = ev.currentTarget as Element
  try {
    target.releasePointerCapture(ev.pointerId)
  } catch {
    /* noop */
  }
  draggingKey.value = null
  emit('timeChange')
}

// 引用 revision 以触发重绘依赖
const _rev = computed(() => props.revision)
</script>

<template>
  <svg
    class="dr-to-flatten"
    :height="totalH"
    :width="axisWidth"
    :viewBox="`0 0 ${axisWidth} ${totalH}`"
  >
    <g v-for="(row, ri) in rows" :key="row.key + '-' + _rev" :transform="`translate(0, ${ri * rowH})`">
      <!-- 五线 -->
      <line
        v-for="li in 5"
        :key="li"
        :x1="0"
        :x2="axisWidth"
        :y1="staffTopInRow() + (li - 1) * FLATTEN_LINE_GAP"
        :y2="staffTopInRow() + (li - 1) * FLATTEN_LINE_GAP"
        stroke="#c0c4cc"
        stroke-width="1"
      />
      <!-- 小节线（左右边界示意） -->
      <line
        :x1="0.5"
        :x2="0.5"
        :y1="staffTopInRow()"
        :y2="staffTopInRow() + staffInnerH"
        stroke="#909399"
        stroke-width="1.5"
      />
      <line
        :x1="axisWidth - 0.5"
        :x2="axisWidth - 0.5"
        :y1="staffTopInRow()"
        :y2="staffTopInRow() + staffInnerH"
        stroke="#909399"
        stroke-width="1.5"
      />

      <g
        v-for="slot in row.slots"
        :key="slot.flattenKey"
        class="dr-to-flatten__slot"
        :transform="`translate(${slot.time * pxPerSecond}, 0)`"
        @pointerdown="onPointerDown($event, slot)"
        @pointermove="onPointerMove($event, slot)"
        @pointerup="onPointerUp($event, slot)"
        @pointercancel="onPointerUp($event, slot)"
      >
        <rect
          class="dr-to-flatten__hit"
          :height="slotBox(slot).h"
          :width="slotBox(slot).w"
          :x="0"
          :y="slotBox(slot).y"
          fill="rgba(64, 158, 255, 0.12)"
          stroke="rgba(64, 158, 255, 0.65)"
          stroke-width="1"
          rx="2"
        />
        <g :transform="`translate(4, 0)`">
          <SimpleNote
            :chronaxie="slot.chronaxie"
            :is-rest="slot.isRest"
            :regions="slot.regions"
            :staff-top="staffTopInRow()"
          />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.dr-to-flatten {
  display: block;
  background: #fff;
}

.dr-to-flatten__slot {
  cursor: grab;
  touch-action: none;
}

.dr-to-flatten__slot:active {
  cursor: grabbing;
}
</style>
