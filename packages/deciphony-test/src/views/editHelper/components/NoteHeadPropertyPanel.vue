<script lang="ts" setup>
import type {Chronaxie} from 'deciphony-renderer'
import {AccidentalTypeEnum, BeamTypeEnum} from 'deciphony-renderer'
import {computed} from 'vue'
import {CHRONAXIE_OPTIONS} from '../renderEditAddNoteState'
import {
  ACCIDENTAL_SELECT_OPTIONS,
  AUGMENTATION_DOT_OPTIONS,
  BEAM_TYPE_OPTIONS,
  setNotesInfoAccidental,
  setNotesInfoAugmentationDot,
  setNotesInfoBeamType,
  setNotesInfoChronaxie,
  type NoteHeadEditSlot,
} from '../renderEditNoteHeadProperties'
import {SLUR_SPAN_OPTIONS, tryAddSlurFromNoteHead, type SlurSpan} from '../renderEditSlurAdd'

const props = defineProps<{
  editSlot: NoteHeadEditSlot
}>()

const notesInfo = computed(() => props.editSlot.info)

const chronaxie = computed({
  get: () => notesInfo.value.chronaxie,
  set: (v: Chronaxie) => setNotesInfoChronaxie(notesInfo.value, v),
})

const beamType = computed({
  get: () => notesInfo.value.beamType ?? BeamTypeEnum.None,
  set: (v: BeamTypeEnum) => setNotesInfoBeamType(notesInfo.value, v),
})

const accidental = computed({
  get: () => notesInfo.value.accidental?.type ?? '',
  set: (v: AccidentalTypeEnum | '' | null | undefined) =>
    setNotesInfoAccidental(notesInfo.value, v || ''),
})

const augmentationDot = computed({
  get: (): 0 | 1 | 2 | 3 => notesInfo.value.augmentationDot?.count ?? 0,
  set: (v: 0 | 1 | 2 | 3) => setNotesInfoAugmentationDot(notesInfo.value, v),
})

function onAddSlur(span: SlurSpan) {
  tryAddSlurFromNoteHead(props.editSlot, span)
}
</script>

<template>
  <div class="note-head-props">
    <section class="note-head-props__section">
      <div class="note-head-props__label">时值</div>
      <el-radio-group v-model="chronaxie" class="note-head-props__radio" size="small">
        <el-radio-button
          v-for="opt in CHRONAXIE_OPTIONS"
          :key="opt.value"
          :label="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="note-head-props__section">
      <div class="note-head-props__label">符杠</div>
      <el-radio-group v-model="beamType" class="note-head-props__radio" size="small">
        <el-radio-button
          v-for="opt in BEAM_TYPE_OPTIONS"
          :key="opt.value"
          :label="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="note-head-props__section">
      <div class="note-head-props__label">变音符号</div>
      <el-select
        v-model="accidental"
        class="note-head-props__select"
        size="small"
      >
        <el-option
          v-for="opt in ACCIDENTAL_SELECT_OPTIONS"
          :key="opt.value || 'none'"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="note-head-props__section">
      <div class="note-head-props__label">附点</div>
      <el-radio-group v-model="augmentationDot" class="note-head-props__radio" size="small">
        <el-radio-button
          v-for="opt in AUGMENTATION_DOT_OPTIONS"
          :key="opt.value"
          :label="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="note-head-props__section">
      <div class="note-head-props__label">连音线</div>
      <div class="note-head-props__row">
        <el-button
          v-for="span in SLUR_SPAN_OPTIONS"
          :key="span"
          size="small"
          @click="onAddSlur(span)"
        >
          {{ span }}
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.note-head-props__section {
  margin-bottom: 14px;
}

.note-head-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.note-head-props__radio {
  display: flex;
  flex-wrap: wrap;
}

.note-head-props__select {
  width: 100%;
}

.note-head-props__row {
  display: flex;
  gap: 8px;
}
</style>
