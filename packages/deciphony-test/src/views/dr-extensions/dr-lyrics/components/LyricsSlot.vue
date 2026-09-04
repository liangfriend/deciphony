<script lang="ts" setup>
import type {MeasureNoteSlot, MusicScore, VDom} from 'deciphony-renderer'
import {computed, unref, watch, type MaybeRef, type Ref} from 'vue'
import {
  LYRICS_INPUT_H,
  LYRICS_PAD_BOTTOM,
  LYRICS_PAD_TOP,
  LYRICS_ROW_GAP,
  LYRICS_ROW_INDEX_X,
} from '../constants'
import {
  addLyricRow,
  collectStaffSlots,
  findNoteAnchorInSlot,
  getLyricsStaff,
  maxLyricsRowCount,
  readSlotLyricLine,
  readSlotLyricOffset,
  removeLyricRow,
  writeSlotLyricLine,
} from '../lyricsFields'
import type {LyricsMode} from '../types'

const props = defineProps<{
  node: VDom
  musicScore: MusicScore
  mode: MaybeRef<LyricsMode>
  vDomList: Ref<VDom[]> | VDom[]
  /** 最前方是否显示行号（1. 2.） */
  showRowIndex?: MaybeRef<boolean>
  /** 由扩展传入的 reactive slotConfig['g-d']，用于同步高度 */
  syncSlotHeight?: (h: number) => void
}>()

defineOptions({inheritAttrs: false})

const lyricsMode = computed(() => unref(props.mode))
const showRowIndex = computed(() => unref(props.showRowIndex) ?? false)
const vDomList = computed(() => unref(props.vDomList) ?? [])

const grandStaff = computed(() => props.node.slotData?.grandStaff ?? null)
const staff = computed(() => getLyricsStaff(grandStaff.value))
const slots = computed(() => collectStaffSlots(staff.value))

const rowCount = computed(() => maxLyricsRowCount(staff.value))

watch(
  rowCount,
  (rows) => {
    const safeRows = Math.max(rows, 1)
    const h = LYRICS_PAD_TOP + safeRows * LYRICS_ROW_GAP + LYRICS_PAD_BOTTOM
    props.syncSlotHeight?.(h)
  },
  {immediate: true},
)

type Cell = {
  slot: MeasureNoteSlot
  rowIndex: number
  x: number
  y: number
  text: string
}

const cells = computed((): Cell[] => {
  const list = vDomList.value
  const node = props.node
  const rows = rowCount.value
  const out: Cell[] = []
  for (const slot of slots.value) {
    const anchor = findNoteAnchorInSlot(list, slot, node)
    if (!anchor) continue
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const {relativeX, relativeY} = readSlotLyricOffset(slot, rowIndex)
      out.push({
        slot,
        rowIndex,
        x: anchor.x + relativeX,
        y: LYRICS_PAD_TOP + rowIndex * LYRICS_ROW_GAP + relativeY,
        text: readSlotLyricLine(slot, rowIndex),
      })
    }
  }
  return out
})

function onCellInput(slot: MeasureNoteSlot, rowIndex: number, event: Event) {
  writeSlotLyricLine(slot, rowIndex, (event.target as HTMLInputElement).value)
}

function onAddRow() {
  addLyricRow(staff.value)
}

function onRemoveRow(rowIndex: number) {
  removeLyricRow(staff.value, rowIndex)
}

const rowIndexLabels = computed(() => {
  const rows = rowCount.value
  const out: {rowIndex: number; label: string; y: number}[] = []
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    out.push({
      rowIndex,
      label: `${rowIndex + 1}.`,
      y: LYRICS_PAD_TOP + rowIndex * LYRICS_ROW_GAP,
    })
  }
  return out
})

/** 每行删除按钮位置（行号右侧） */
const rowDeleteControls = computed(() =>
  rowIndexLabels.value.map((item) => ({
    ...item,
    x: showRowIndex.value ? LYRICS_ROW_INDEX_X + 22 : LYRICS_ROW_INDEX_X,
  })),
)
</script>

<template>
  <g class="dr-lyrics-slot">
    <template v-if="showRowIndex">
      <text
        v-for="item in rowIndexLabels"
        :key="`idx-${item.rowIndex}`"
        class="dr-lyrics-slot__row-index"
        :x="LYRICS_ROW_INDEX_X"
        :y="item.y + LYRICS_INPUT_H * 0.75"
      >{{ item.label }}</text>
    </template>

    <template v-if="lyricsMode === 'show'">
      <text
        v-for="(cell, i) in cells"
        v-show="cell.text"
        :key="`show-${cell.slot.id}-${cell.rowIndex}-${i}`"
        class="dr-lyrics-slot__text"
        :x="cell.x"
        :y="cell.y + LYRICS_INPUT_H * 0.75"
      >{{ cell.text }}</text>
    </template>

    <template v-else>
      <foreignObject
        v-for="(cell, i) in cells"
        :key="`edit-${cell.slot.id}-${cell.rowIndex}-${i}`"
        :height="LYRICS_INPUT_H"
        :width="Math.max(28, 48)"
        :x="cell.x"
        :y="cell.y"
      >
        <input
          class="dr-lyrics-slot__input"
          type="text"
          xmlns="http://www.w3.org/1999/xhtml"
          :value="cell.text"
          @click.stop
          @input="onCellInput(cell.slot, cell.rowIndex, $event)"
          @pointerdown.stop
        />
      </foreignObject>

      <foreignObject
        v-for="item in rowDeleteControls"
        :key="`del-${item.rowIndex}`"
        :height="18"
        :width="22"
        :x="item.x"
        :y="item.y"
      >
        <button
          class="dr-lyrics-slot__del"
          type="button"
          title="删除本行"
          xmlns="http://www.w3.org/1999/xhtml"
          @click.stop="onRemoveRow(item.rowIndex)"
          @pointerdown.stop
        >
          −
        </button>
      </foreignObject>

      <foreignObject
        :height="20"
        :width="56"
        :x="Math.max(0, node.w - 60)"
        y="2"
      >
        <button
          class="dr-lyrics-slot__add"
          type="button"
          xmlns="http://www.w3.org/1999/xhtml"
          @click.stop="onAddRow"
          @pointerdown.stop
        >
          +行
        </button>
      </foreignObject>
    </template>
  </g>
</template>

<style scoped>
.dr-lyrics-slot__text {
  font-size: 13px;
  fill: #303133;
  dominant-baseline: auto;
}

.dr-lyrics-slot__row-index {
  font-size: 12px;
  fill: #909399;
  dominant-baseline: auto;
}

.dr-lyrics-slot__input {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0 2px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  color: #303133;
  font-size: 12px;
  line-height: 16px;
  outline: none;
}

.dr-lyrics-slot__input:focus {
  border-color: #409eff;
}

.dr-lyrics-slot__add,
.dr-lyrics-slot__del {
  padding: 0 6px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  background: #fff;
  color: #606266;
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
}

.dr-lyrics-slot__del {
  width: 100%;
  padding: 0;
  color: #f56c6c;
}
</style>
