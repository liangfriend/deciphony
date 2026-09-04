<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import {MusicScoreTypeEnum} from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import type {MusicScoreComponentExpose} from './editHelper/useRenderEdit'
import initialData from './data/其多列简谱'
import {
  AddNoteStatePanel,
  AddNumberStatePanel,
  PropertyPanel,
  SlurDragHandles,
  VoltaDragHandles,
  useDrEdit,
} from './editHelper'

const musicScoreData = reactive(JSON.parse(JSON.stringify(initialData)) as MusicScore)
const isNumberNotation = computed(
    () => musicScoreData.type === MusicScoreTypeEnum.NumberNotation,
)
const musicScoreRef = ref<MusicScoreComponentExpose | null>(null)

const {
  extension: editExtension,
  scoreRootRef,
  selectedItem,
  addNoteState,
  propertyPanelKind,
  slurHandlePoints,
  voltaHandlePoints,
  handleSlurHandleDown,
  handleVoltaHandleDown,
  deleteSelected,
} = useDrEdit(musicScoreData, {musicScoreRef})

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  const target = event.target
  if (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return
  }
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
      <AddNumberStatePanel v-if="isNumberNotation" v-model="addNoteState as any"/>
      <AddNoteStatePanel v-else v-model="addNoteState as any"/>
      <div ref="scoreRootRef" class="play-test__score">
        <div class="play-test__score-stack">
          <musicScoreVue
              ref="musicScoreRef"
              class="play-test__score-svg"
              :data="musicScoreData"
              :extensions="[editExtension]"
              skin-name="default"
          />
          <svg
              v-if="slurHandlePoints || voltaHandlePoints"
              class="play-test__affiliated-drag-layer"
              :height="musicScoreData.height"
              :viewBox="`0 0 ${musicScoreData.width} ${musicScoreData.height}`"
              :width="musicScoreData.width"
              xmlns="http://www.w3.org/2000/svg"
          >
            <SlurDragHandles
                v-if="slurHandlePoints"
                :handles="slurHandlePoints"
                @handle-down="handleSlurHandleDown"
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
.play-test__affiliated-drag-layer :deep(.volta-drag-handles__center) {
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
