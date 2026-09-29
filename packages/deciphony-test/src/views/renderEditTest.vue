<script lang="ts" setup>
import type {MusicScore} from '@deciphony/renderer'
import musicScoreVue, {MusicScoreTypeEnum} from '@deciphony/renderer'
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import type {MusicScoreComponentExpose} from './editHelper/useRenderEdit'
import initialData from './data/其多列简谱'
import {buildDrumSample} from './data/drumSample'
import {tabStringCount} from '@deciphony/extensions/dr-edit'
import {
  AddDrumStatePanel,
  AddNoteStatePanel,
  AddNumberStatePanel,
  AddTabStatePanel,
  EditContextMenu,
  type EditContextMenuItem,
  HorizontalDragHandles,
  PropertyPanel,
  SlurDragHandles,
  useDrEdit,
  useMidiPianoInput,
  VerticalDragHandles,
  VoltaDragHandles,
} from './editHelper'

/** `?score=drum` 载入鼓谱示例，否则用默认简谱 */
const useDrumSample = new URLSearchParams(window.location.search).get('score') === 'drum'
const musicScoreData = reactive(
    useDrumSample ? buildDrumSample() : JSON.parse(JSON.stringify(initialData)) as MusicScore,
)
const isDrum = computed(() => musicScoreData.type === MusicScoreTypeEnum.DrumNotation)
const isNumberNotation = computed(
    () => musicScoreData.type === MusicScoreTypeEnum.NumberNotation,
)
const isTab = computed(
    () => musicScoreData.type === MusicScoreTypeEnum.Tab4
        || musicScoreData.type === MusicScoreTypeEnum.Tab6,
)
const tabStrings = computed(() => tabStringCount(musicScoreData.type))
const musicScoreRef = ref<MusicScoreComponentExpose | null>(null)

const contextMenuItems = ref<EditContextMenuItem[]>([])

const editApi = useDrEdit(musicScoreData, {
  musicScoreRef,
  contextMenu: contextMenuItems,
  onBeforeContextMenu() {
    contextMenuItems.value = [editApi.createDeleteContextMenuItem()]
  },
})

const {
  extension: editExtension,
  scoreRootRef,
  selectedItem,
  addNoteState,
  addTabState,
  addDrumState,
  propertyPanelKind,
  slurHandlePoints,
  arpeggioHandlePoints,
  strummingHandlePoints,
  pedalHandlePoints,
  pitchHandlePoints,
  voltaHandlePoints,
  handleSlurHandleDown,
  handleArpeggioHandleDown,
  handleStrummingHandleDown,
  handlePedalHandleDown,
  handlePitchHandleDown,
  handleVoltaHandleDown,
  deleteSelected,
  navigateSelectedMeasure,
  addMidiNote,
  contextMenuState,
  closeContextMenu,
} = editApi

/** 模板里写 [editExtension] 每次 render 都是新数组，会触发 musicScore 的 slotConfig watch 整谱重算 */
const scoreExtensions = [editExtension]

const {status: midiStatus, deviceNames: midiDevices} = useMidiPianoInput((midi) => {
  addMidiNote(midi)
})

const midiHint = computed(() => {
  if (midiStatus.value === 'unsupported') return 'MIDI：浏览器不支持'
  if (midiStatus.value === 'denied') return 'MIDI：权限被拒绝'
  if (midiStatus.value === 'empty') return 'MIDI：未检测到输入设备'
  if (midiDevices.value.length) return `MIDI：${midiDevices.value.join(', ')}（选中小节后按琴键落音）`
  return 'MIDI：已就绪'
})

const ARROW_TO_MEASURE_NAV = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
} as const

function isTypingTarget(target: EventTarget | null): boolean {
  return (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || (target instanceof HTMLElement && target.isContentEditable)
  )
}

function onKeyDown(event: KeyboardEvent) {
  if (isTypingTarget(event.target)) return

  const navDir = ARROW_TO_MEASURE_NAV[event.key as keyof typeof ARROW_TO_MEASURE_NAV]
  if (navDir) {
    if (navigateSelectedMeasure(navDir)) {
      event.preventDefault()
    }
    return
  }

  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  if (deleteSelected()) {
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="play-test">
    <div class="play-test__main">
      <div class="play-test__midi-hint">{{ midiHint }}</div>
      <AddTabStatePanel v-if="isTab" v-model="addTabState" :string-count="tabStrings"/>
      <AddDrumStatePanel v-else-if="isDrum" v-model="addDrumState"/>
      <AddNumberStatePanel v-else-if="isNumberNotation" v-model="addNoteState as any"/>
      <AddNoteStatePanel v-else v-model="addNoteState as any"/>
      <div ref="scoreRootRef" class="play-test__score">
        <div class="play-test__score-stack">
          <musicScoreVue
              ref="musicScoreRef"
              :data="musicScoreData"
              :extensions="scoreExtensions"
              class="play-test__score-svg"
              skin-name="default"
              @renderMusicScore="()=>{
              }"
          />
          <svg
              v-if="slurHandlePoints || arpeggioHandlePoints || strummingHandlePoints || pedalHandlePoints || pitchHandlePoints || voltaHandlePoints"
              :height="musicScoreData.height"
              :viewBox="`0 0 ${musicScoreData.width} ${musicScoreData.height}`"
              :width="musicScoreData.width"
              class="play-test__affiliated-drag-layer"
              xmlns="http://www.w3.org/2000/svg"
          >
            <SlurDragHandles
                v-if="slurHandlePoints"
                :handles="slurHandlePoints"
                :show-control="!isNumberNotation"
                @handle-down="handleSlurHandleDown"
            />
            <VerticalDragHandles
                v-if="arpeggioHandlePoints"
                :handles="arpeggioHandlePoints"
                @handle-down="handleArpeggioHandleDown"
            />
            <VerticalDragHandles
                v-if="strummingHandlePoints"
                :handles="strummingHandlePoints"
                @handle-down="handleStrummingHandleDown"
            />
            <HorizontalDragHandles
                v-if="pedalHandlePoints"
                :handles="pedalHandlePoints"
                @handle-down="handlePedalHandleDown"
            />
            <HorizontalDragHandles
                v-if="pitchHandlePoints"
                :handles="pitchHandlePoints"
                @handle-down="handlePitchHandleDown"
            />
            <VoltaDragHandles
                v-if="voltaHandlePoints"
                :handles="voltaHandlePoints"
                @handle-down="handleVoltaHandleDown"
            />
          </svg>
        </div>
      </div>
    </div>
    <PropertyPanel :kind="propertyPanelKind" :selected="selectedItem"/>
    <EditContextMenu
        v-if="contextMenuState.open && contextMenuState.items.length"
        :items="contextMenuState.items"
        :x="contextMenuState.x"
        :y="contextMenuState.y"
        @close="closeContextMenu"
    />
  </div>
</template>

<style scoped>
.play-test {
  display: flex;
  align-items: flex-start;
  height: 100%;
  gap: 16px;
}

.play-test__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.play-test__midi-hint {
  flex-shrink: 0;
  padding: 4px 8px;
  font-size: 12px;
  color: #909399;
}

.play-test__score {
  flex: 1;
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.play-test__score-stack {
  position: relative;
  display: inline-block;
}

.play-test__affiliated-drag-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}

.play-test__affiliated-drag-layer :deep(.slur-drag-handles__square),
.play-test__affiliated-drag-layer :deep(.slur-drag-handles__circle),
.play-test__affiliated-drag-layer :deep(.volta-drag-handles__square),
.play-test__affiliated-drag-layer :deep(.volta-drag-handles__center),
.play-test__affiliated-drag-layer :deep(.vertical-drag-handles__end),
.play-test__affiliated-drag-layer :deep(.vertical-drag-handles__middle),
.play-test__affiliated-drag-layer :deep(.horizontal-drag-handles__end),
.play-test__affiliated-drag-layer :deep(.horizontal-drag-handles__middle) {
  pointer-events: all;
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

:deep(.dr-related-highlight) {
  filter: drop-shadow(0 0 4px rgba(103, 194, 58, 0.95)) brightness(1.12);
}
</style>
