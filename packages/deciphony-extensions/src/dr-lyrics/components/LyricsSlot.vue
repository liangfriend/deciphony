<script lang="ts" setup>
import {DoubleNoteAffiliatedSymbolNameEnum} from '@deciphony/renderer'
import type {MeasureNoteSlot, MusicScore, VDom} from '@deciphony/renderer'
import {computed, unref, type MaybeRef, type Ref} from 'vue'
import {
  LYRICS_EDIT_MIN_ROWS,
  LYRICS_FONT_SIZE,
  LYRICS_INPUT_FONT_FAMILY,
  LYRICS_PAD_TOP,
  LYRICS_ROW_INDEX_X,
  resolveLyricsMetrics,
} from '../constants'
import {
  addLyricRow,
  clearLyricTexts,
  collectStaffSlots,
  findNoteAnchorInSlot,
  hasLyricText,
  lyricKey,
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
  /** 歌词字号（px） */
  fontSize?: MaybeRef<number>
  /** 字体族；未传则沿用宿主 / 浏览器默认 */
  fontFamily?: MaybeRef<string | undefined>
  /** 播放中高亮的字，元素为 lyricKey(slotId, verse) */
  activeLyrics?: MaybeRef<ReadonlySet<string> | undefined>
}>()

const emit = defineEmits<{
  /** 编辑态歌词输入框获得焦点 */
  cellFocus: [payload: {slot: MeasureNoteSlot; rowIndex: number}]
  /** 编辑态歌词输入框失去焦点 */
  cellBlur: [payload: {slot: MeasureNoteSlot; rowIndex: number}]
}>()

defineOptions({inheritAttrs: false})

const lyricsMode = computed(() => unref(props.mode))
const showRowIndex = computed(() => unref(props.showRowIndex) ?? false)
const metrics = computed(() => resolveLyricsMetrics(unref(props.fontSize) ?? LYRICS_FONT_SIZE))
/** 编辑框比展示文字小 1px，留出边框 */
const inputFontSize = computed(() => Math.max(8, metrics.value.fontSize - 1))
const inputW = computed(() => Math.round(48 * metrics.value.fontSize / LYRICS_FONT_SIZE))
/**
 * 编辑框高度：中文字体行高约 1.3–1.45 em，按行距算的 inputH 余量为 0，
 * 系统缩放（125% / 150%）取整后会裁掉字的下半部分；按 1.5 em 留高，多出部分上下平分，行位置不变。
 */
const inputBoxH = computed(() =>
  Math.max(metrics.value.inputH, Math.ceil(inputFontSize.value * 1.5) + 2),
)
const inputOffsetY = computed(() => (inputBoxH.value - metrics.value.inputH) / 2)
const fontFamily = computed(() => unref(props.fontFamily)?.trim() || undefined)
const fontFamilyStyle = computed(() =>
  fontFamily.value ? {fontFamily: fontFamily.value} : undefined,
)
const vDomList = computed(() => unref(props.vDomList) ?? [])
const activeLyricSet = computed(() => unref(props.activeLyrics))

const staff = computed(() => props.node.slotData?.singleStaff ?? null)
/** 单谱表在复谱表里的下标；Tab 只在同一位置的谱表间跳 */
const staffIndex = computed(() => {
  const grandStaff = props.node.slotData?.grandStaff
  return grandStaff && staff.value ? grandStaff.staves.indexOf(staff.value) : 0
})
const slots = computed(() => collectStaffSlots(staff.value))
/** 本单谱表至少有一个音符/休止符槽位，才允许加歌词行 */
const canAddLyricRow = computed(() => slots.value.length > 0)

const dataRowCount = computed(() => maxLyricsRowCount(staff.value))
/** 编辑态至少 1 行，便于空谱直接输入；s-d 高度由宿主常量控制，不随行数变化 */
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
        y: LYRICS_PAD_TOP + rowIndex * metrics.value.rowGap + relativeY,
        text: readSlotLyricLine(slot, rowIndex),
      })
    }
  }
  return out
})

function onCellInput(slot: MeasureNoteSlot, rowIndex: number, event: Event) {
  writeSlotLyricLine(slot, rowIndex, (event.target as HTMLInputElement).value)
}

/** 整份曲谱的根 svg（各单谱表的 s-d 都在里面） */
function scoreRootSvg(el: Element): SVGSVGElement | null {
  let root = el.closest('foreignObject')?.ownerSVGElement ?? null
  while (root?.ownerSVGElement) root = root.ownerSVGElement
  return root
}

/** 以本槽位某个音为起点的连音线终点 notesInfo id */
function slurEndIdsFrom(slot: MeasureNoteSlot): string[] {
  const infos = (slot.symbol as {notesInfo?: {id: string}[]}).notesInfo
  if (!Array.isArray(infos) || !infos.length) return []
  const ids = new Set(infos.map((info) => info.id))
  return props.musicScore.affiliatedSymbols
    .filter((sym) => sym.name === DoubleNoteAffiliatedSymbolNameEnum.Slur && ids.has(sym.startId))
    .map((sym) => sym.endId)
}

/** 包含该 notesInfo 的槽位 id（同下标单谱表，可跨复谱表） */
function slotIdOfInfo(infoId: string): string | null {
  for (const grandStaff of props.musicScore.grandStaffs) {
    for (const slot of collectStaffSlots(grandStaff.staves[staffIndex.value] ?? null)) {
      const infos = (slot.symbol as {notesInfo?: {id: string}[]}).notesInfo
      if (infos?.some((info) => info.id === infoId)) return slot.id
    }
  }
  return null
}

/**
 * Tab 的落点：当前音是连音线起点时，跳到连音线终点之后那个音（多条取最远）；否则下一个音。
 */
function tabTargetIndex(sameRow: HTMLInputElement[], index: number, slot: MeasureNoteSlot): number {
  let target = index + 1
  for (const endId of slurEndIdsFrom(slot)) {
    const endSlotId = slotIdOfInfo(endId)
    if (!endSlotId) continue
    const endIndex = sameRow.findIndex((el) => el.dataset.lyricSlot === endSlotId)
    if (endIndex > index) target = Math.max(target, endIndex + 1)
  }
  return target
}

/**
 * Tab / Shift+Tab 在同一行歌词里按音符顺序跳（跨复谱表，只在复谱表内同一位置的单谱表之间）。
 * 不能靠 DOM 顺序：同一单谱表的输入框按「音符 × 行」排列，第 2 行按 Tab 会跳到下一个音符的第 1 行；
 * 也不能跨谱表，否则高音谱表最后一个字会跳到低音谱表。
 * 连音线内的音只唱一个字，所以 Tab 遇到连音线起点直接跳过整条连音线。
 */
function onCellKeydown(slot: MeasureNoteSlot, rowIndex: number, event: KeyboardEvent) {
  if (event.key !== 'Tab' || event.isComposing) return
  const input = event.target as HTMLInputElement
  const root = scoreRootSvg(input)
  if (!root) return
  const sameRow = [
    ...root.querySelectorAll<HTMLInputElement>(
      `.dr-lyrics-slot__input[data-lyric-row="${rowIndex}"][data-lyric-staff="${staffIndex.value}"]`,
    ),
  ]
  const index = sameRow.indexOf(input)
  const target = event.shiftKey ? index - 1 : tabTargetIndex(sameRow, index, slot)
  const next = sameRow[target]
  if (!next) {
    // 跳过连音线后没有下一个音：留在原地，别让浏览器默认 Tab 跳进连音线内部
    if (!event.shiftKey && target > index + 1) event.preventDefault()
    return
  }
  event.preventDefault()
  next.focus()
  next.select()
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

const canClearLyrics = computed(() => hasLyricText(staff.value))

function onClearLyrics() {
  clearLyricTexts(staff.value)
}

const rowIndexLabels = computed(() => {
  const rows = rowCount.value
  const out: {rowIndex: number; label: string; y: number}[] = []
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    out.push({
      rowIndex,
      label: `${rowIndex + 1}.`,
      y: LYRICS_PAD_TOP + rowIndex * metrics.value.rowGap,
    })
  }
  return out
})

/** 操作行：歌词下方一行，右侧放删行 / 加行 */
const controlsY = computed(() => LYRICS_PAD_TOP + rowCount.value * metrics.value.rowGap)
const CONTROLS_W = 128
const controlsX = computed(() => Math.max(0, props.node.w - CONTROLS_W - 4))
</script>

<template>
  <g class="dr-lyrics-slot" :style="fontFamilyStyle">
    <template v-if="showRowIndex">
      <text
        v-for="item in rowIndexLabels"
        :key="`idx-${item.rowIndex}`"
        class="dr-lyrics-slot__row-index"
        :x="LYRICS_ROW_INDEX_X"
        :y="item.y + metrics.inputH * 0.75"
        :font-size="inputFontSize"
        :font-family="fontFamily"
      >{{ item.label }}</text>
    </template>

    <template v-if="lyricsMode === 'show'">
      <text
        v-for="(cell, i) in cells"
        v-show="cell.text"
        :key="`show-${cell.slot.id}-${cell.rowIndex}-${i}`"
        class="dr-lyrics-slot__text"
        :class="{'dr-lyrics-slot__text--active': activeLyricSet?.has(lyricKey(cell.slot.id, cell.rowIndex))}"
        :x="cell.x"
        :y="cell.y + metrics.inputH * 0.75"
        :font-size="metrics.fontSize"
        :font-family="fontFamily"
      >{{ cell.text }}</text>
    </template>

    <template v-else>
      <foreignObject
        v-for="(cell, i) in cells"
        :key="`edit-${cell.slot.id}-${cell.rowIndex}-${i}`"
        :height="inputBoxH"
        :width="inputW"
        :x="cell.x"
        :y="cell.y - inputOffsetY"
      >
        <input
          class="dr-lyrics-slot__input"
          type="text"
          xmlns="http://www.w3.org/1999/xhtml"
          :data-lyric-row="cell.rowIndex"
          :data-lyric-staff="staffIndex"
          :data-lyric-slot="cell.slot.id"
          :style="{
            fontSize: `${inputFontSize}px`,
            fontFamily: fontFamily ?? LYRICS_INPUT_FONT_FAMILY,
          }"
          :value="cell.text"
          @click.stop
          @input="onCellInput(cell.slot, cell.rowIndex, $event)"
          @keydown="onCellKeydown(cell.slot, cell.rowIndex, $event)"
          @focus="emit('cellFocus', {slot: cell.slot, rowIndex: cell.rowIndex})"
          @blur="emit('cellBlur', {slot: cell.slot, rowIndex: cell.rowIndex})"
          @pointerdown.stop
        />
      </foreignObject>

      <foreignObject
        :height="20"
        :width="CONTROLS_W"
        :x="controlsX"
        :y="controlsY"
      >
        <div class="dr-lyrics-slot__controls" xmlns="http://www.w3.org/1999/xhtml">
          <button
            class="dr-lyrics-slot__clear"
            type="button"
            :disabled="!canClearLyrics"
            :title="canClearLyrics ? '清空本单谱表所有歌词' : '没有歌词可清空'"
            @click.stop="onClearLyrics"
            @pointerdown.stop
          >
            清空
          </button>
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
            :title="canAddLyricRow ? '添加歌词行' : '当前单谱表没有音符，无法添加歌词行'"
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
  fill: #303133;
  dominant-baseline: auto;
}

/** 播放到这个字 */
.dr-lyrics-slot__text--active {
  fill: #e53935;
}

.dr-lyrics-slot__row-index {
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
  line-height: normal;
  outline: none;
}

.dr-lyrics-slot__input:focus {
  border-color: #409eff;
}

.dr-lyrics-slot__controls {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.dr-lyrics-slot__clear,
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

.dr-lyrics-slot__clear:disabled,
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
