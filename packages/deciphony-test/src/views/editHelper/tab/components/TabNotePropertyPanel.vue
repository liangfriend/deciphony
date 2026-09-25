<script lang="ts" setup>
import type {SlotData, TabNote, TabNoteInfo} from '@deciphony/renderer'
import {BeamTypeEnum, BendTypeEnum} from '@deciphony/renderer'
import {computed} from 'vue'
import {
  setTabNoteInfoBeamType,
  setTabNoteInfoBend,
  setTabNoteInfoRegionRange,
  setTabNoteInfoValue,
  setTabNoteSlap,
} from '@deciphony/extensions/dr-edit'
import {BEAM_TYPE_OPTIONS} from '../../standardStaff/renderEditNoteHeadProperties'
import {SLUR_SPAN_OPTIONS, tryAddSlurFromNoteHead, type SlurSpan} from '../../standardStaff/renderEditSlurAdd'
import {TAB_FRET_OPTIONS, TAB_SEMITONE_OPTIONS} from '../renderEditTabAddState'

const props = defineProps<{
  editSlot: SlotData
  stringCount: number
}>()

const info = computed(() => props.editSlot.info as unknown as TabNoteInfo)
const note = computed(() => props.editSlot.note as unknown as TabNote)

const isHead = computed(() => info.value.type === 'normal' || info.value.type === 'harmonic')
const isGeometry = computed(() => info.value.type === 'arpeggio' || info.value.type === 'strumming')

const fret = computed({
  get: () => info.value.value,
  set: (value: number) => setTabNoteInfoValue(info.value, value),
})

const beamType = computed({
  get: () => info.value.beamType ?? BeamTypeEnum.None,
  set: (value: BeamTypeEnum) => setTabNoteInfoBeamType(info.value, value),
})

const slap = computed({
  get: () => note.value.isSlap,
  set: (value: boolean) => setTabNoteSlap(note.value, value),
})

function regionRangeOf(item: TabNoteInfo): {start: number; end: number} {
  return 'regionRange' in item ? item.regionRange : {start: 0, end: 0}
}

const regionStartDisplay = computed({
  get: () => regionRangeOf(info.value).start + 1,
  set: (display: number) => writeRange(display - 1, regionRangeOf(info.value).end),
})

const regionEndDisplay = computed({
  get: () => regionRangeOf(info.value).end + 1,
  set: (display: number) => writeRange(regionRangeOf(info.value).start, display - 1),
})

const bend = computed(() => ('bend' in info.value ? info.value.bend ?? null : null))

const bendType = computed({
  get: () => bend.value?.type ?? BendTypeEnum.Bend,
  set: (type: BendTypeEnum) => {
    if (!bend.value) return
    setTabNoteInfoBend(info.value, {
      type,
      periodOne: bend.value.periodOne,
      periodTwo: bend.value.periodTwo,
    })
  },
})

const periodOne = computed({
  get: () => bend.value?.periodOne ?? 1,
  set: (value: number) => {
    if (!bend.value) return
    setTabNoteInfoBend(info.value, {
      type: bend.value.type,
      periodOne: value,
      periodTwo: bend.value.periodTwo,
    })
  },
})

const periodTwo = computed({
  get: () => bend.value?.periodTwo ?? 0,
  set: (value: number) => {
    if (!bend.value) return
    setTabNoteInfoBend(info.value, {
      type: bend.value.type,
      periodOne: bend.value.periodOne,
      periodTwo: value,
    })
  },
})

const bendTypeOptions = [
  {value: BendTypeEnum.Bend, label: '推弦'},
  {value: BendTypeEnum.BendRelease, label: '推弦再回来'},
  {value: BendTypeEnum.Prebend, label: '预推弦'},
  {value: BendTypeEnum.PrebendRelease, label: '预推弦再回来'},
  {value: BendTypeEnum.PrebendBend, label: '预推弦再升高'},
]

function writeRange(start: number, end: number) {
  setTabNoteInfoRegionRange(info.value, start, end, props.stringCount)
}

function onAddSlur(span: SlurSpan) {
  tryAddSlurFromNoteHead(props.editSlot as never, span)
}

function onAddBend() {
  setTabNoteInfoBend(info.value, {
    type: BendTypeEnum.Bend,
    periodOne: 1,
    periodTwo: 0,
  })
}

function onRemoveBend() {
  setTabNoteInfoBend(info.value, null)
}
</script>

<template>
  <div class="tab-note-props">
    <section v-if="isHead" class="tab-note-props__section">
      <div class="tab-note-props__label">品</div>
      <el-select v-model="fret" size="small" style="width: 100%">
        <el-option
          v-for="opt in TAB_FRET_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section v-if="isGeometry" class="tab-note-props__section">
      <div class="tab-note-props__label">开始弦 {{ regionStartDisplay }}</div>
      <el-slider v-model="regionStartDisplay" :max="stringCount" :min="1" :step="1"/>
      <div class="tab-note-props__label">结束弦 {{ regionEndDisplay }}</div>
      <el-slider v-model="regionEndDisplay" :max="stringCount" :min="1" :step="1"/>
    </section>

    <section class="tab-note-props__section">
      <div class="tab-note-props__label">符杠</div>
      <el-radio-group v-model="beamType" size="small">
        <el-radio-button
          v-for="opt in BEAM_TYPE_OPTIONS"
          :key="opt.value"
          :label="opt.value"
        >
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>

    <section class="tab-note-props__section">
      <el-checkbox v-model="slap">拍弦</el-checkbox>
    </section>

    <section class="tab-note-props__section">
      <div class="tab-note-props__label">连音线</div>
      <div class="tab-note-props__row">
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

    <section v-if="isHead" class="tab-note-props__section">
      <div class="tab-note-props__label">推弦</div>
      <el-button v-if="!bend" size="small" @click="onAddBend">添加推弦</el-button>
      <template v-else>
        <el-select v-model="bendType" size="small" style="width: 100%; margin-bottom: 8px">
          <el-option
            v-for="opt in bendTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <div class="tab-note-props__label">阶段 1</div>
        <el-select v-model="periodOne" size="small" style="width: 100%; margin-bottom: 8px">
          <el-option
            v-for="opt in TAB_SEMITONE_OPTIONS"
            :key="`a-${opt.value}`"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <div class="tab-note-props__label">阶段 2</div>
        <el-select v-model="periodTwo" size="small" style="width: 100%; margin-bottom: 8px">
          <el-option
            v-for="opt in TAB_SEMITONE_OPTIONS"
            :key="`b-${opt.value}`"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-button size="small" @click="onRemoveBend">移除推弦</el-button>
      </template>
    </section>
  </div>
</template>

<style scoped>
.tab-note-props__section {
  margin-bottom: 14px;
}

.tab-note-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.tab-note-props__row {
  display: flex;
  gap: 8px;
}
</style>
