<script lang="ts" setup>
import type {Chronaxie, DrumHeadTypeEnum} from '@deciphony/renderer'
import type {DrumVoice} from '@deciphony/extensions/dr-edit'
import {
  DRUM_ADD_KIND_OPTIONS,
  DRUM_CHRONAXIE_OPTIONS,
  DRUM_DOT_OPTIONS,
  DRUM_HEAD_OPTIONS,
  DRUM_VOICE_OPTIONS,
  normalizeAddDrumState,
  type AddDrumState,
  type DrumAddKind,
} from '../renderEditDrumAddState'
import ChronaxieIconButtons from '../../components/ChronaxieIconButtons.vue'
import EditToolbarButton from '../../components/EditToolbarButton.vue'

const model = defineModel<AddDrumState>({required: true})

function patch(next: Partial<AddDrumState>) {
  model.value = normalizeAddDrumState({...model.value, ...next})
}

function setVoice(voice: DrumVoice) {
  patch({voice})
}

function setKind(kind: DrumAddKind) {
  patch({kind})
}

function setHeadType(headType: DrumHeadTypeEnum) {
  patch({headType, kind: 'note'})
}

function setChronaxie(chronaxie: Chronaxie) {
  patch({chronaxie})
}

function setDot(dot: 0 | 1 | 2) {
  patch({dot})
}
</script>

<template>
  <div class="add-toolbar">
    <div class="add-toolbar__group">
      <EditToolbarButton
        v-for="opt in DRUM_VOICE_OPTIONS"
        :key="opt.value"
        :active="model.voice === opt.value"
        :title="opt.label"
        @click="setVoice(opt.value)"
      >
        <span class="add-toolbar__text">{{ opt.label }}</span>
      </EditToolbarButton>
    </div>
    <div class="add-toolbar__sep"/>
    <div class="add-toolbar__group">
      <EditToolbarButton
        v-for="opt in DRUM_ADD_KIND_OPTIONS"
        :key="opt.value"
        :active="model.kind === opt.value"
        :title="opt.label"
        @click="setKind(opt.value)"
      >
        <span class="add-toolbar__text">{{ opt.label }}</span>
      </EditToolbarButton>
    </div>
    <div class="add-toolbar__sep"/>
    <div class="add-toolbar__group">
      <EditToolbarButton
        v-for="opt in DRUM_HEAD_OPTIONS"
        :key="opt.value"
        :active="model.kind === 'note' && model.headType === opt.value"
        :title="opt.label"
        @click="setHeadType(opt.value)"
      >
        <span class="add-toolbar__text">{{ opt.label }}</span>
      </EditToolbarButton>
    </div>
    <div class="add-toolbar__sep"/>
    <ChronaxieIconButtons
      :model-value="model.chronaxie"
      :mode="model.kind === 'rest' ? 'rest' : 'note'"
      :options="DRUM_CHRONAXIE_OPTIONS"
      @update:model-value="setChronaxie"
    />
    <div class="add-toolbar__sep"/>
    <div class="add-toolbar__group">
      <EditToolbarButton
        v-for="opt in DRUM_DOT_OPTIONS"
        :key="opt.value"
        :active="model.dot === opt.value"
        :title="opt.label"
        @click="setDot(opt.value)"
      >
        <span class="add-toolbar__text">{{ opt.label }}</span>
      </EditToolbarButton>
    </div>
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
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 0 2px;
}
</style>
