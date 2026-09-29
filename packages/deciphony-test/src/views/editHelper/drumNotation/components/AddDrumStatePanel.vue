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
  <div class="add-drum-state">
    <div class="add-drum-state__row">
      <span class="add-drum-state__label">声部</span>
      <el-radio-group :model-value="model.voice" size="small" @change="setVoice">
        <el-radio-button v-for="opt in DRUM_VOICE_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
      <span class="add-drum-state__label">添加</span>
      <el-radio-group :model-value="model.kind" size="small" @change="setKind">
        <el-radio-button v-for="opt in DRUM_ADD_KIND_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div class="add-drum-state__row">
      <span class="add-drum-state__label">音符头</span>
      <el-radio-group
        :model-value="model.kind === 'note' ? model.headType : undefined"
        size="small"
        @change="setHeadType"
      >
        <el-radio-button v-for="opt in DRUM_HEAD_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div class="add-drum-state__row">
      <span class="add-drum-state__label">时值</span>
      <el-radio-group :model-value="model.chronaxie" size="small" @change="setChronaxie">
        <el-radio-button v-for="opt in DRUM_CHRONAXIE_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
      <span class="add-drum-state__label">附点</span>
      <el-radio-group :model-value="model.dot" size="small" @change="setDot">
        <el-radio-button v-for="opt in DRUM_DOT_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<style scoped>
.add-drum-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.add-drum-state__row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.add-drum-state__label {
  flex: 0 0 auto;
  font-size: 12px;
  color: #606266;
}
</style>
