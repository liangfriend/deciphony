<script lang="ts" setup>
import type {Chronaxie} from '@deciphony/renderer'
import {
  ADD_NOTE_KIND_OPTIONS,
  CHRONAXIE_OPTIONS,
  type AddNoteSlotKind,
  type AddNoteState,
} from '../renderEditAddNoteState'
import ChronaxieIconButtons from './ChronaxieIconButtons.vue'
import EditToolbarButton from './EditToolbarButton.vue'

const model = defineModel<AddNoteState>({required: true})

function setKind(kind: AddNoteSlotKind) {
  model.value = {...model.value, kind}
}

function setChronaxie(chronaxie: Chronaxie) {
  model.value = {...model.value, chronaxie}
}
</script>

<template>
  <div class="add-toolbar">
    <div class="add-toolbar__group">
      <EditToolbarButton
        v-for="opt in ADD_NOTE_KIND_OPTIONS"
        :key="opt.value"
        :active="model.kind === opt.value"
        :title="opt.label"
        @click="setKind(opt.value)"
      >
        <span class="add-toolbar__text">{{ opt.label }}</span>
      </EditToolbarButton>
    </div>
    <div class="add-toolbar__sep"/>
    <ChronaxieIconButtons
      :model-value="model.chronaxie"
      :mode="model.kind === 'rest' ? 'rest' : 'note'"
      :options="CHRONAXIE_OPTIONS"
      @update:model-value="setChronaxie"
    />
  </div>
</template>

<style scoped>
.add-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border-bottom: 1px solid #dcdfe6;
  background: #f5f7fa;
}

.add-toolbar__group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-toolbar__sep {
  width: 1px;
  height: 28px;
  background: #dcdfe6;
  flex: 0 0 auto;
}

.add-toolbar__text {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
</style>
