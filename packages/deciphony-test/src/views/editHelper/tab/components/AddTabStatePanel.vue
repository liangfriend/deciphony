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

const props = defineProps<{
  stringCount: number
}>()

const model = defineModel<AddTabState>({required: true})

const showFret = computed(() => model.value.kind === 'normal' || model.value.kind === 'harmonic')
const showRange = computed(() => model.value.kind === 'arpeggio' || model.value.kind === 'strumming')
const showChronaxie = computed(() => true)

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
  <div class="add-tab-state">
    <div class="add-tab-state__row">
      <span class="add-tab-state__label">添加</span>
      <el-radio-group :model-value="model.kind" size="small" @change="setKind">
        <el-radio-button
          v-for="opt in TAB_ADD_KIND_OPTIONS"
          :key="opt.value"
          :label="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div v-if="showChronaxie" class="add-tab-state__row">
      <span class="add-tab-state__label">时值</span>
      <el-radio-group :model-value="model.chronaxie" size="small" @change="setChronaxie">
        <el-radio-button
          v-for="opt in CHRONAXIE_OPTIONS"
          :key="opt.value"
          :label="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div v-if="showFret" class="add-tab-state__row">
      <span class="add-tab-state__label">品</span>
      <el-select :model-value="model.fret" size="small" style="width: 88px" @change="setFret">
        <el-option
          v-for="opt in TAB_FRET_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>
    <div v-if="showRange" class="add-tab-state__range">
      <span class="add-tab-state__label">开始弦 {{ regionStartDisplay }}</span>
      <el-slider v-model="regionStartDisplay" :min="1" :max="stringCount" :step="1"/>
      <span class="add-tab-state__label">结束弦 {{ regionEndDisplay }}</span>
      <el-slider v-model="regionEndDisplay" :min="1" :max="stringCount" :step="1"/>
    </div>
  </div>
</template>

<style scoped>
.add-tab-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.add-tab-state__row,
.add-tab-state__range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.add-tab-state__label {
  flex: 0 0 auto;
  font-size: 12px;
  color: #606266;
}

.add-tab-state__range {
  align-items: stretch;
  flex-direction: column;
}

.add-tab-state__range :deep(.el-slider) {
  width: 180px;
  margin-left: 8px;
}
</style>
