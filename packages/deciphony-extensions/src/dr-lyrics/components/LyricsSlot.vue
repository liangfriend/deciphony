<script lang="ts" setup>
import type {MeasureNoteSlot, MusicScore, VDom} from '@deciphony/renderer'
import {computed, unref, type MaybeRef, type Ref} from 'vue'
import {
  LYRICS_EDIT_MIN_ROWS,
  LYRICS_INPUT_H,
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
}>()

defineOptions({inheritAttrs: false})

const lyricsMode = computed(() => unref(props.mode))
const showRowIndex = computed(() => unref(props.showRowIndex) ?? false)
const vDomList = computed(() => unref(props.vDomList) ?? [])

const grandStaff = computed(() => props.node.slotData?.grandStaff ?? null)
const staff = computed(() => getLyricsStaff(grandStaff.value))
const slots = computed(() => collectStaffSlots(staff.value))
/** slotData 下首谱表至少有一个音符/休止符槽位，才允许加歌词行 */
const canAddLyricRow = computed(() => slots.value.length > 0)

const dataRowCount = computed(() => maxLyricsRowCount(staff.value))
/** 编辑态至少 1 行，便于空谱直接输入；g-d 高度由宿主常量控制，不随行数变化 */
const rowCount = computed(() =>
  lyricsMode.value === 'edit'
    ? Math.max(dataRowCount.value, LYRICS_EDIT_MIN_ROWS)
    : dataRowCount.value,
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
  if (!canAddLyricRow.value) return
  addLyricRow(staff.value)
}

/** 删除最后一行歌词 */
function onRemoveLastRow() {
  if (dataRowCount.value <= 1) return
  removeLyricRow(staff.value, dataRowCount.value - 1)
}

const canRemoveLyricRow = computed(() => dataRowCount.value > 1)

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

/** 操作行：歌词下方一行，右侧放删行 / 加行 */
const controlsY = computed(() => LYRICS_PAD_TOP + rowCount.value * LYRICS_ROW_GAP)
const controlsX = computed(() => Math.max(0, props.node.w - 88))
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
        :height="20"
        :width="84"
        :x="controlsX"
        :y="controlsY"
      >
        <div class="dr-lyrics-slot__controls" xmlns="http://www.w3.org/1999/xhtml">
          <button
            class="dr-lyrics-slot__del"
            type="button"
            :disabled="!canRemoveLyricRow"
            :title="canRemoveLyricRow ? '删除最后一行歌词' : '至少保留一行歌词'"
            @click.stop="onRemoveLastRow"
            @pointerdown.stop
          >
            −行
          </button>
          <button
            class="dr-lyrics-slot__add"
            type="button"
            :disabled="!canAddLyricRow"
            :title="canAddLyricRow ? '添加歌词行' : '当前复谱表没有音符，无法添加歌词行'"
            @click.stop="onAddRow"
            @pointerdown.stop
          >
            +行
          </button>
        </div>
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

.dr-lyrics-slot__controls {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 100%;
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

.dr-lyrics-slot__add:disabled,
.dr-lyrics-slot__del:disabled {
  color: #c0c4cc;
  background: #f5f7fa;
  border-color: #e4e7ed;
  cursor: not-allowed;
}

.dr-lyrics-slot__del {
  color: #f56c6c;
}
</style>
