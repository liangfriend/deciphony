<script lang="ts" setup>
import musicScoreVue from 'deciphony-renderer'
import type {MusicScore} from 'deciphony-renderer'
import {reactive, ref} from 'vue'
import type {MusicScoreComponentExpose} from './editHelper/useRenderEdit'
import initialData from './data/singleNote'
import {
  AddGrandStaffButton,
  AddNoteStatePanel,
  EditSlotSdButtons,
  GhostNotePreview,
  PropertyPanel,
  useRenderEdit,
} from './editHelper'

const musicScoreData = reactive(JSON.parse(JSON.stringify(initialData)) as MusicScore)
const musicScoreRef = ref<MusicScoreComponentExpose | null>(null)

const {
  scoreRootRef,
  selectedItem,
  addNoteState,
  activeGhostPreview,
  propertyPanelKind,
  handleDrClick,
  handleDrEnter,
  handleDrLeave,
  handleDrDown,
  handleDrUp,
  handleTopMove,
  handleTopUp,
  handleRenderMusicScore,
} = useRenderEdit(musicScoreData, {musicScoreRef})
</script>

<template>
  <div class="play-test">
    <div class="play-test__main">
      <AddNoteStatePanel v-model="addNoteState"/>
      <div ref="scoreRootRef" class="play-test__score">
      <musicScoreVue
        ref="musicScoreRef"
        :data="musicScoreData"
        :slot-config="{'g-r':{w:50},'g-l':{w:50},'g-d':{h:40},'s-d':{h:20}}"
        skin-name="default"
        @renderMusicScore="handleRenderMusicScore"
        @dr-click="handleDrClick"
        @dr-down="handleDrDown"
        @dr-enter="handleDrEnter"
        @dr-leave="handleDrLeave"
        @dr-up="handleDrUp"
        @top-move="handleTopMove"
        @top-up="handleTopUp"
      >
        <template #g-d="{ node }">
          <AddGrandStaffButton :node="node"/>
        </template>
        <template #s-d="{ node }">
          <EditSlotSdButtons :node="node"/>
        </template>
        <template #m="{ node }">
          <rect
            v-if="selectedItem?.measure?.id === node.slotData?.measure?.id"
            class="measure-selection-frame dr-selected-highlight"
            :height="node.h"
            :width="node.w"
            fill="white"
            fill-opacity="0.01"
            pointer-events="none"
          />
          <GhostNotePreview
            :measure-id="selectedItem?.measure?.id"
            :node="node"
            :preview="activeGhostPreview"
          />
        </template>
      </musicScoreVue>
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

:deep(.dr-hover-highlight) {
  filter: drop-shadow(0 0 3px rgba(64, 158, 255, 0.9)) brightness(1.12);
}

:deep(.dr-selected-highlight) {
  filter: drop-shadow(0 0 4px rgba(255, 152, 0, 0.95)) brightness(1.14);
}

:deep(.dr-selected-highlight[data-tag="noteHead"]) {
  cursor: ns-resize;
}
</style>
