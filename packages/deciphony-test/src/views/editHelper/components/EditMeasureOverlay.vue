<script lang="ts" setup>
import {MusicScoreTypeEnum} from '@deciphony/renderer'
import type {MusicScore, VDom} from '@deciphony/renderer'
import {computed, inject} from 'vue'
import {DR_EDIT_INJECTION_KEY} from '../editInject'
import GhostNotePreview from '../standardStaff/components/GhostNotePreview.vue'
import GhostNumberPreview from '../numberNotation/components/GhostNumberPreview.vue'
import GhostTabPreview from '../tab/components/GhostTabPreview.vue'
import type {GhostNotePreview as StaffGhostPreview} from '../standardStaff/renderEditSymbolAddAction'
import type {GhostNumberPreview as NumberGhostPreview} from '../numberNotation/renderEditNumberAddAction'
import type {GhostTabPreview as TabGhostPreview} from '../tab/renderEditTabAddAction'

const props = defineProps<{
  node: VDom
  musicScore: MusicScore
}>()

const edit = inject(DR_EDIT_INJECTION_KEY)
if (!edit) throw new Error('EditMeasureOverlay 需要 useDrEdit()')

const isNumberNotation = computed(
  () => props.musicScore.type === MusicScoreTypeEnum.NumberNotation,
)
const isTab = computed(
  () => props.musicScore.type === MusicScoreTypeEnum.Tab4
    || props.musicScore.type === MusicScoreTypeEnum.Tab6,
)
const selectedMeasureId = computed(() => edit.selectedItem.value?.measure?.id)
const staffPreview = computed(() =>
  isNumberNotation.value || isTab.value ? null : (edit.activeGhostPreview.value as StaffGhostPreview | null),
)
const numberPreview = computed(() =>
  isNumberNotation.value ? (edit.activeGhostPreview.value as NumberGhostPreview | null) : null,
)
const tabPreview = computed(() =>
  isTab.value ? (edit.activeGhostPreview.value as TabGhostPreview | null) : null,
)
</script>

<template>
  <rect
      v-if="selectedMeasureId === node.slotData?.measure?.id"
      class="measure-selection-frame dr-selected-highlight"
      :height="node.h"
      :width="node.w"
      fill="white"
      fill-opacity="0.01"
      pointer-events="none"
  />
  <GhostNumberPreview
      v-if="isNumberNotation"
      :measure-id="selectedMeasureId ?? null"
      :node="node"
      :preview="numberPreview"
  />
  <GhostTabPreview
      v-else-if="isTab"
      :measure-id="selectedMeasureId ?? null"
      :node="node"
      :preview="tabPreview"
  />
  <GhostNotePreview
      v-else
      :measure-id="selectedMeasureId ?? null"
      :node="node"
      :preview="staffPreview"
  />
</template>
