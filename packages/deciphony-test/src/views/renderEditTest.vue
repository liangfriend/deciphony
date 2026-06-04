<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import type {MusicScore, SlotData, VDom} from 'deciphony-renderer'
import initialData from './data/singleNote'
import {
  addGrandStaffFromSlot,
  addMeasureFromSlot,
  addSingleStaffFromSlot,
} from './editHelper/renderEditSlotActions'
import {
  MEASURE_ADD_HOVER_RANGE,
  applyMeasureAddAction,
  findNoteHeadElement,
  isMeasureAddMode,
  pointerToSvg,
  resolveGhostNotePreview,
  type GhostNotePreview,
} from './editHelper/renderEditSymbolAddAction'
import {slotDataFromVDom} from './editHelper/renderEditSelection'
import {
  createNoteHeadDragSession,
  updateNoteHeadRegionByPointerY,
  type NoteHeadDragSession,
} from './editHelper/renderEditNoteHeadDrag'
import {computed, onBeforeUnmount, reactive, ref} from 'vue'

const musicScoreData = reactive(JSON.parse(JSON.stringify(initialData)) as MusicScore)
const scoreRootRef = ref<HTMLElement | null>(null)
const highlightedEl = ref<SVGElement | null>(null)
// 选中项dom,方便取消高亮
const selectedEl = ref<SVGElement | null>(null)
// 选中项
const selectedItem = ref<SlotData | null>(null)
// 小节添加模式下的占位音符
const ghostNotePreview = ref<GhostNotePreview | null>(null)
// 音符头拖拽改 region
const noteHeadDragSession = ref<NoteHeadDragSession | null>(null)

const EXCLUDED_INTERACTION_TAGS = new Set(['slot', 'space'])
const ADD_GRAND_STAFF_BTN_W = 96
const ADD_GRAND_STAFF_BTN_H = 36
const ADD_SINGLE_STAFF_BTN_W = 20
const ADD_SINGLE_STAFF_BTN_H = 20
const ADD_MEASURE_BTN_W = 20
const ADD_MEASURE_BTN_H = 20
const SD_SLOT_BTN_GAP = 6
const SD_SLOT_BTN_LEFT_OFFSET = 12
const SLOT_BTN_RIGHT_MARGIN = 8

/** g-d 插槽：复谱表按钮水平居中 x */
function addGrandStaffBtnX(node: VDom) {
  return node.w / 2 - ADD_GRAND_STAFF_BTN_W / 2
}

/** g-d 插槽：复谱表按钮垂直居中 y */
function addGrandStaffBtnY(node: VDom) {
  return node.h / 2 - ADD_GRAND_STAFF_BTN_H / 2
}

/** s-d 插槽：按钮在插槽高度内垂直居中 y */
function sSlotBtnY(node: VDom, btnH: number) {
  return node.h / 2 - btnH / 2
}

/** s-d 插槽：添加小节按钮靠右 x */
function addMeasureBtnX(node: VDom) {
  return node.w - ADD_MEASURE_BTN_W - SLOT_BTN_RIGHT_MARGIN
}

/** s-d 插槽：添加单谱表按钮 x（在小节按钮左侧） */
function addSingleStaffBtnX(node: VDom) {
  return addMeasureBtnX(node) - SD_SLOT_BTN_GAP - ADD_SINGLE_STAFF_BTN_W - SD_SLOT_BTN_LEFT_OFFSET
}

/** s-d 插槽：添加单谱表按钮 y */
function addSingleStaffBtnY(node: VDom) {
  return sSlotBtnY(node, ADD_SINGLE_STAFF_BTN_H)
}

/** s-d 插槽：添加小节按钮 y */
function addMeasureBtnY(node: VDom) {
  return sSlotBtnY(node, ADD_MEASURE_BTN_H)
}

/** g-d 按钮：追加复谱表（默认 4 小节单谱表） */
function handleAddGrandStaff(node: VDom) {
  const slot = node.slotData
  if (slot) addGrandStaffFromSlot(slot)
}

/** s-d 按钮：在 anchor 下方追加等量空小节的单谱表 */
function handleAddSingleStaff(node: VDom) {
  const slot = node.slotData
  if (slot) addSingleStaffFromSlot(slot)
}

/** s-d 按钮：在单谱表末尾追加一个小节 */
function handleAddMeasure(node: VDom) {
  const slot = node.slotData
  if (slot) addMeasureFromSlot(slot)
}

/** 从 dr 事件取符号 wrapper 对应的 SVG 元素 */
function resolveInteractionTarget(event: MouseEvent | PointerEvent): SVGElement | null {
  const target = event.currentTarget
  return target instanceof SVGElement ? target : null
}

/** 清除 hover 高亮（不影响已选中项） */
function clearHoverHighlight() {
  if (highlightedEl.value && highlightedEl.value !== selectedEl.value) {
    highlightedEl.value.classList.remove('dr-hover-highlight')
  }
  highlightedEl.value = null
}

/** 清除选中态与高亮 */
function clearSelectedHighlight() {
  selectedEl.value?.classList.remove('dr-selected-highlight')
  selectedEl.value = null
  selectedItem.value = null
}

/** 为元素加上选中高亮样式 */
function applySelectedHighlight(el: SVGElement) {
  el.style.transition = 'filter 0.2s ease'
  el.classList.add('dr-selected-highlight')
}

/** dr-click：更新 selectedItem，切换选中高亮 */
function handleDrClick(event: MouseEvent, vdom: VDom) {
  if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
  const el = resolveInteractionTarget(event)
  if (!el) return
  const slot = slotDataFromVDom(musicScoreData, vdom)
  if (!slot) return

  clearHoverHighlight()
  if (selectedEl.value === el) return

  if (selectedEl.value && selectedEl.value !== el) {
    selectedEl.value.classList.remove('dr-selected-highlight')
  }
  selectedEl.value = el
  selectedItem.value = slot
  applySelectedHighlight(el)
  if (!isMeasureAddMode(slot)) {
    ghostNotePreview.value = null
  }
}

function refreshSelectedNoteHeadHighlight(notesInfoId: string) {
  const root = scoreRootRef.value
  const el = root ? findNoteHeadElement(root, notesInfoId) : null
  if (!el) return
  if (selectedEl.value && selectedEl.value !== el) {
    selectedEl.value.classList.remove('dr-selected-highlight')
  }
  selectedEl.value = el
  applySelectedHighlight(el)
}

/** dr-down：音符头选中 / 开始拖拽改 region */
function handleDrDown(event: PointerEvent, vdom: VDom) {
  if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
  if (vdom.tag !== 'noteHead') return

  const slot = slotDataFromVDom(musicScoreData, vdom)
  if (!slot?.info || !slot.note || !slot.measure) return

  const el = resolveInteractionTarget(event)
  if (!el) return

  clearHoverHighlight()
  if (selectedItem.value?.info?.id !== slot.info.id) {
    selectedEl.value?.classList.remove('dr-selected-highlight')
    selectedEl.value = el
    selectedItem.value = slot
    applySelectedHighlight(el)
    ghostNotePreview.value = null
  }

  noteHeadDragSession.value = createNoteHeadDragSession(
      event,
      slot as SlotData & { info: typeof slot.info; note: typeof slot.note; measure: typeof slot.measure },
  )
  el.setPointerCapture(event.pointerId)
  event.preventDefault()
}

/** dr-move：拖拽时更新 region */
function handleDrMove(event: PointerEvent, vdom: VDom) {
  const session = noteHeadDragSession.value
  if (!session || event.pointerId !== session.pointerId) return

  const svg = resolveSvgFromEvent(event)
  if (!svg) return
  const {y} = pointerToSvg(svg, event.clientX, event.clientY)
  const changed = updateNoteHeadRegionByPointerY(session, latestVDomList, y)
  if (changed != null) {
    refreshSelectedNoteHeadHighlight(session.notesInfoId)
  }
}

/** dr-up：结束拖拽 */
function handleDrUp(event: PointerEvent) {
  if (noteHeadDragSession.value?.pointerId === event.pointerId) {
    noteHeadDragSession.value = null
  }
}

/** dr-enter：非选中项显示 hover 高亮 */
function handleDrEnter(event: PointerEvent, vdom: VDom) {
  if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
  const el = resolveInteractionTarget(event)
  if (!el || el === selectedEl.value || highlightedEl.value === el) return
  clearHoverHighlight()
  el.style.transition = 'filter 0.2s ease'
  el.classList.add('dr-hover-highlight')
  highlightedEl.value = el
}

/** dr-leave：移出时取消 hover 高亮 */
function handleDrLeave(event: PointerEvent, vdom: VDom) {
  if (EXCLUDED_INTERACTION_TAGS.has(vdom.tag)) return
  const el = resolveInteractionTarget(event)
  if (el && highlightedEl.value === el) {
    clearHoverHighlight()
  }
}

// 存储 vDom 列表（供占位音符定位）
let latestVDomList: VDom[] = []

/** 每次重新渲染后返回 vdom 列表 */
function handleRenderMusicScore(list: VDom[]) {
  latestVDomList = list
  const session = noteHeadDragSession.value
  if (session) {
    refreshSelectedNoteHeadHighlight(session.notesInfoId)
  }
}

onBeforeUnmount(() => {
  clearHoverHighlight()
  clearSelectedHighlight()
  ghostNotePreview.value = null
  noteHeadDragSession.value = null
})

const isMeasureSelected = computed(() => isMeasureAddMode(selectedItem.value))

const activeGhostPreview = computed((): GhostNotePreview | null => {
  const preview = ghostNotePreview.value
  const measureId = selectedItem.value?.measure?.id
  if (!preview || !measureId || preview.measureId !== measureId) return null
  return preview
})

function resolveSvgFromEvent(event: PointerEvent | MouseEvent): SVGSVGElement | null {
  const target = event.currentTarget
  if (target instanceof SVGSVGElement) return target
  return (event.target as Element | null)?.closest('svg') ?? null
}

function updateGhostNoteFromEvent(event: PointerEvent | MouseEvent) {
  if (!isMeasureSelected.value) {
    ghostNotePreview.value = null
    return
  }
  const svg = resolveSvgFromEvent(event)
  if (!svg) return
  const {x, y} = pointerToSvg(svg, event.clientX, event.clientY)
  ghostNotePreview.value = resolveGhostNotePreview({
    selected: selectedItem.value,
    vDomList: latestVDomList,
    svgX: x,
    svgY: y,
  })
}

function handleMeasureAddPointerMove(event: PointerEvent) {
  updateGhostNoteFromEvent(event)
}

function handleMeasureAddPointerLeave() {
  ghostNotePreview.value = null
}

/** 切换为音符头选中态 */
function selectNoteHeadSlot(slot: SlotData, notesInfoId: string) {
  clearHoverHighlight()
  if (selectedEl.value) {
    selectedEl.value.classList.remove('dr-selected-highlight')
  }
  const root = scoreRootRef.value
  const el = root ? findNoteHeadElement(root, notesInfoId) : null
  selectedEl.value = el
  selectedItem.value = slot
  ghostNotePreview.value = null
  if (el) applySelectedHighlight(el)
}

function handleMeasureAddPointerDown(event: PointerEvent, node: VDom) {
  if (!isMeasureSelected.value || !node.slotData?.measure) return
  if (selectedItem.value?.measure?.id !== node.slotData.measure.id) return
  updateGhostNoteFromEvent(event)
  const preview = ghostNotePreview.value
  const measureSlot = selectedItem.value
  if (!preview || !measureSlot?.measure) return
  event.preventDefault()
  event.stopPropagation()

  const result = applyMeasureAddAction(
      measureSlot as SlotData & { measure: typeof measureSlot.measure },
      preview,
      musicScoreData,
  )
  if (!result) return

  if (result.type === 'selectNote') {
    selectNoteHeadSlot(result.slot, result.notesInfoId)
  }
}
</script>

<template>
  <div class="play-test">
    <div ref="scoreRootRef" class="play-test__score">
      <musicScoreVue :data="musicScoreData"
                     :slot-config="{'g-r':{w:50},'g-l':{w:50},'g-d':{h:40},'s-d':{h:20}}"
                     skin-name="default"
                     @dr-click="handleDrClick"
                     @dr-down="handleDrDown"
                     @dr-enter="handleDrEnter"
                     @dr-leave="handleDrLeave"
                     @dr-move="handleDrMove"
                     @dr-up="handleDrUp"
                     @renderMusicScore="handleRenderMusicScore"
      >
        <template #g-d="{ node }">
          <g
              class="add-grand-staff-btn"
              :transform="`translate(${addGrandStaffBtnX(node)}, ${addGrandStaffBtnY(node)})`"
              @click.stop="handleAddGrandStaff(node)"
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
        <template #s-d="{ node }">
          <g
              class="add-single-staff-btn"
              :transform="`translate(${addSingleStaffBtnX(node)}, ${addSingleStaffBtnY(node)})`"
              @click.stop="handleAddSingleStaff(node)"
          >
            <rect
                :height="ADD_SINGLE_STAFF_BTN_H"
                :width="ADD_SINGLE_STAFF_BTN_W"
                fill="#B7D7FF"
                rx="10"
                ry="10"
                stroke="#8FABFF"
                stroke-width="1.2"
            />
            <line stroke="#5B7FD6" stroke-linecap="round" stroke-width="1.6" x1="10" x2="10" y1="5.5" y2="12"/>
            <polyline
                fill="none"
                points="7,10 10,13.5 13,10"
                stroke="#5B7FD6"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.6"
            />
          </g>
          <g
              class="add-measure-btn"
              :transform="`translate(${addMeasureBtnX(node)}, ${addMeasureBtnY(node)})`"
              @click.stop="handleAddMeasure(node)"
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
        <template #m="{ node }">
          <g
              v-if="isMeasureSelected && selectedItem?.measure?.id === node.slotData?.measure?.id"
              class="measure-add-overlay"
              @pointerdown.stop="handleMeasureAddPointerDown($event, node)"
              @pointerleave="handleMeasureAddPointerLeave"
              @pointermove="handleMeasureAddPointerMove"
          >
            <rect
                :height="node.h + MEASURE_ADD_HOVER_RANGE * 2"
                :width="node.w"
                :y="-MEASURE_ADD_HOVER_RANGE"
                fill="transparent"
                pointer-events="all"
            />
            <g
                v-if="activeGhostPreview"
                :transform="`translate(${activeGhostPreview.x}, ${activeGhostPreview.y})`"
                class="ghost-note-preview"
                pointer-events="none"
                v-html="activeGhostPreview.svgHtml"
            />
          </g>
        </template>
      </musicScoreVue>

    </div>

  </div>
</template>

<style scoped>
.play-test {
  display: flex;
  align-items: flex-start;
  height: 100%;
  gap: 16px;
}

.play-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.play-test__panel {
  width: 200px;
  flex-shrink: 0;
  padding: 16px;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-grand-staff-btn,
.add-single-staff-btn,
.add-measure-btn {
  cursor: pointer;
  transition: filter 0.15s ease;
}

.add-grand-staff-btn:hover {
  filter: brightness(1.06) drop-shadow(0 2px 5px rgba(255, 143, 171, 0.45));
}

.add-single-staff-btn:hover {
  filter: brightness(1.06) drop-shadow(0 2px 5px rgba(143, 171, 255, 0.45));
}

.add-measure-btn:hover {
  filter: brightness(1.06) drop-shadow(0 2px 5px rgba(123, 201, 150, 0.45));
}

:deep(.dr-hover-highlight) {
  filter: drop-shadow(0 0 3px rgba(64, 158, 255, 0.9)) brightness(1.12);
}

:deep(.dr-selected-highlight) {
  filter: drop-shadow(0 0 4px rgba(255, 152, 0, 0.95)) brightness(1.14);
}

:deep(.dr-selected-highlight[data-tag="noteHead"]) {
  cursor: ns-resize;
}

.play-test__selection {
  margin: 0;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
