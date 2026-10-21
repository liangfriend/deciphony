<script lang="ts" setup>
import type {Chronaxie} from '@deciphony/renderer'
import {computed} from 'vue'
import {CHRONAXIE_OPTIONS} from '../../renderEditAddNoteState'
import {
  TAB_ADD_KIND_OPTIONS,
  TAB_FRET_OPTIONS,
  type AddTabState,
  type TabAddKind,
} from '../renderEditTabAddState'
import ChronaxieIconButtons from '../../components/ChronaxieIconButtons.vue'
import EditToolbarButton from '../../components/EditToolbarButton.vue'

const props = defineProps<{
  stringCount: number
}>()

const model = defineModel<AddTabState>({required: true})

const showFret = computed(() => model.value.kind === 'normal' || model.value.kind === 'harmonic')
const showRange = computed(() => model.value.kind === 'arpeggio' || model.value.kind === 'strumming')

const regionStartDisplay = computed({
  get: () => model.value.regionStart + 1,
  set: (display: number) => {
    model.value = {...model.value, regionStart: clampDisplay(display)}
  },
})

const regionEndDisplay = computed({
  get: () => model.value.regionEnd + 1,
  set: (display: number) => {
    model.value = {...model.value, regionEnd: clampDisplay(display)}
  },
})

function clampDisplay(display: number): number {
  const value = Math.round(display) - 1
  if (value < 0) return 0
  if (value > props.stringCount - 1) return props.stringCount - 1
  return value
}

function setKind(kind: TabAddKind) {
  const next = {...model.value, kind}
  if (next.regionEnd > props.stringCount - 1) next.regionEnd = props.stringCount - 1
  model.value = next
}

function setChronaxie(chronaxie: Chronaxie) {
  model.value = {...model.value, chronaxie}
}

function setFret(fret: number) {
  model.value = {...model.value, fret}
}
</script>

<template>
  <div class="add-toolbar">
    <div class="add-toolbar__group">
      <EditToolbarButton
        v-for="opt in TAB_ADD_KIND_OPTIONS"
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
    <template v-if="showFret">
      <div class="add-toolbar__sep"/>
      <el-select :model-value="model.fret" size="small" style="width: 88px" @change="setFret">
        <el-option
          v-for="opt in TAB_FRET_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </template>
    <div v-if="showRange" class="add-toolbar__range">
      <span class="add-toolbar__hint">弦 {{ regionStartDisplay }}–{{ regionEndDisplay }}</span>
      <el-slider v-model="regionStartDisplay" :max="stringCount" :min="1" :step="1"/>
      <el-slider v-model="regionEndDisplay" :max="stringCount" :min="1" :step="1"/>
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

.add-toolbar__range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.add-toolbar__hint {
  font-size: 12px;
  color: #606266;
}

.add-toolbar__range :deep(.el-slider) {
  width: 120px;
}
</style>
