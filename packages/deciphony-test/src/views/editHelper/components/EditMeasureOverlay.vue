<script lang="ts" setup>
import {MusicScoreTypeEnum} from 'deciphony-renderer'
import type {MusicScore, VDom} from 'deciphony-renderer'
import {computed, inject} from 'vue'
import {DR_EDIT_INJECTION_KEY} from '../editInject'
import GhostNotePreview from '../standardStaff/components/GhostNotePreview.vue'
import GhostNumberPreview from '../numberNotation/components/GhostNumberPreview.vue'
import type {GhostNotePreview as StaffGhostPreview} from '../standardStaff/renderEditSymbolAddAction'
import type {GhostNumberPreview as NumberGhostPreview} from '../numberNotation/renderEditNumberAddAction'

const props = defineProps<{
  node: VDom
  musicScore: MusicScore
}>()

const edit = inject(DR_EDIT_INJECTION_KEY)
if (!edit) throw new Error('EditMeasureOverlay 需要 useDrEdit()')

const isNumberNotation = computed(
  () => props.musicScore.type === MusicScoreTypeEnum.NumberNotation,
)
const selectedMeasureId = computed(() => edit.selectedItem.value?.measure?.id)
const staffPreview = computed(() =>
  isNumberNotation.value ? null : (edit.activeGhostPreview.value as StaffGhostPreview | null),
)
const numberPreview = computed(() =>
  isNumberNotation.value ? (edit.activeGhostPreview.value as NumberGhostPreview | null) : null,
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
      :measure-id="selectedMeasureId"
      :node="node"
      :preview="numberPreview"
  />
  <GhostNotePreview
      v-else
      :measure-id="selectedMeasureId"
      :node="node"
      :preview="staffPreview"
  />
</template>
