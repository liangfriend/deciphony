<script lang="ts" setup>
import type {Chronaxie, DrumHeadTypeEnum, DrumNote, DrumNotesInfo, SlotData} from '@deciphony/renderer'
import {BeamTypeEnum} from '@deciphony/renderer'
import {computed} from 'vue'
import {
  setDrumNoteAugmentationDot,
  setDrumNoteBeamType,
  setDrumNoteChronaxie,
  setDrumNotesInfoHeadType,
  setDrumNotesInfoRegion,
} from '@deciphony/extensions/dr-edit'
import {BEAM_TYPE_OPTIONS} from '../../standardStaff/renderEditNoteHeadProperties'
import {SLUR_SPAN_OPTIONS, tryAddSlurFromNoteHead, type SlurSpan} from '../../standardStaff/renderEditSlurAdd'
import {DRUM_CHRONAXIE_OPTIONS, DRUM_DOT_OPTIONS, DRUM_HEAD_OPTIONS} from '../renderEditDrumAddState'

const props = defineProps<{
  editSlot: SlotData
}>()

const info = computed(() => props.editSlot.info as unknown as DrumNotesInfo)
const note = computed(() => props.editSlot.note as unknown as DrumNote)

const headType = computed({
  get: () => info.value.headType,
  set: (value: DrumHeadTypeEnum) => setDrumNotesInfoHeadType(info.value, value),
})

const region = computed({
  get: () => info.value.region,
  set: (value: number) => {
    setDrumNotesInfoRegion(info.value, value, note.value)
  },
})

const chronaxie = computed({
  get: () => info.value.chronaxie,
  set: (value: Chronaxie) => setDrumNoteChronaxie(note.value, value),
})

const dot = computed({
  get: () => (info.value.augmentationDot?.count ?? 0) as 0 | 1 | 2,
  set: (value: 0 | 1 | 2) => setDrumNoteAugmentationDot(note.value, value),
})

const beamType = computed({
  get: () => info.value.beamType ?? BeamTypeEnum.None,
  set: (value: BeamTypeEnum) => setDrumNoteBeamType(note.value, value),
})

function onAddSlur(span: SlurSpan) {
  tryAddSlurFromNoteHead(props.editSlot as never, span)
}
</script>

<template>
  <div class="drum-note-props">
    <section class="drum-note-props__section">
      <div class="drum-note-props__label">音符头</div>
      <el-select v-model="headType" size="small" style="width: 100%">
        <el-option v-for="opt in DRUM_HEAD_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value"/>
      </el-select>
    </section>

    <section class="drum-note-props__section">
      <div class="drum-note-props__label">线位（0 底线 · 8 顶线）</div>
      <el-input-number v-model="region" :max="14" :min="-6" :step="1" size="small"/>
    </section>

    <section class="drum-note-props__section">
      <div class="drum-note-props__label">时值（整个音符）</div>
      <el-select v-model="chronaxie" size="small" style="width: 100%">
        <el-option
          v-for="opt in DRUM_CHRONAXIE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="drum-note-props__section">
      <div class="drum-note-props__label">附点</div>
      <el-radio-group v-model="dot" size="small">
        <el-radio-button v-for="opt in DRUM_DOT_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="drum-note-props__section">
      <div class="drum-note-props__label">符杠</div>
      <el-radio-group v-model="beamType" size="small">
        <el-radio-button v-for="opt in BEAM_TYPE_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="drum-note-props__section">
      <div class="drum-note-props__label">连音线</div>
      <div class="drum-note-props__row">
        <el-button v-for="span in SLUR_SPAN_OPTIONS" :key="span" size="small" @click="onAddSlur(span)">
          {{ span }}
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.drum-note-props__section {
  margin-bottom: 14px;
}

.drum-note-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.drum-note-props__row {
  display: flex;
  gap: 8px;
}
</style>
