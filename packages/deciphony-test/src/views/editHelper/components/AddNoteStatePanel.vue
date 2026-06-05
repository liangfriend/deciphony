<script lang="ts" setup>
import type {Chronaxie} from 'deciphony-renderer'
import {
  ADD_NOTE_KIND_OPTIONS,
  CHRONAXIE_OPTIONS,
  type AddNoteSlotKind,
  type AddNoteState,
} from '../renderEditAddNoteState'

const model = defineModel<AddNoteState>({required: true})

function setKind(kind: AddNoteSlotKind) {
  model.value = {...model.value, kind}
}

function setChronaxie(chronaxie: Chronaxie) {
  model.value = {...model.value, chronaxie}
}
</script>

<template>
  <div class="add-note-state">
    <div class="add-note-state__row">
      <span class="add-note-state__label">添加</span>
      <el-radio-group :model-value="model.kind" size="small" @change="setKind">
        <el-radio-button
          v-for="opt in ADD_NOTE_KIND_OPTIONS"
          :key="opt.value"
          :label="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div class="add-note-state__row">
      <span class="add-note-state__label">时值</span>
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
  </div>
</template>

<style scoped>
.add-note-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.add-note-state__row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.add-note-state__label {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}
</style>
