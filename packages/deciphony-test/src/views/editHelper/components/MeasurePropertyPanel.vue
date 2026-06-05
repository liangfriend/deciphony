<script lang="ts" setup>
import type {Measure, SlotData} from 'deciphony-renderer'
import {BarlineTypeEnum} from 'deciphony-renderer'
import {computed, ref, watch} from 'vue'
import {
  addVoltaEndingAtMeasure,
  BARLINE_OPTIONS,
  CLEF_OPTIONS,
  END_REPEAT_OPTIONS,
  findVoltaEndingAt,
  formatVoltaValue,
  insertMeasureAfter,
  insertMeasureBefore,
  KEY_SIGNATURE_OPTIONS,
  parseVoltaValueText,
  removeVolta,
  setMeasureBarlineB,
  setMeasureBarlineF,
  setMeasureClefF,
  setMeasureEndRepeat,
  setMeasureKeySignatureF,
  setMeasureStartRepeat,
  setMeasureTimeSignatureF,
  START_REPEAT_OPTIONS,
  TIME_SIGNATURE_OPTIONS,
  type MeasureEditSlot,
} from '../renderEditMeasureProperties'

const props = defineProps<{
  editSlot: SlotData
}>()

const measureEditSlot = computed(() => props.editSlot as MeasureEditSlot)
const measure = computed(() => measureEditSlot.value.measure as Measure)
const musicScore = computed(() => measureEditSlot.value.musicScore)

const barlineB = computed({
  get: () => measure.value.barline_b?.type ?? BarlineTypeEnum.Single_barline,
  set: (v) => setMeasureBarlineB(measure.value, v),
})

const barlineF = computed({
  get: () => measure.value.barline_f?.type ?? '',
  set: (v) => setMeasureBarlineF(measure.value, v === '' ? null : v),
})

const clefF = computed({
  get: () => measure.value.clef_f?.type ?? '',
  set: (v) => setMeasureClefF(measure.value, v === '' ? null : v),
})

const keySignatureF = computed({
  get: () => measure.value.keySignature_f?.type ?? '',
  set: (v) => setMeasureKeySignatureF(measure.value, v === '' ? null : v),
})

const timeSignatureF = computed({
  get: () => measure.value.timeSignature_f?.type ?? '',
  set: (v) => setMeasureTimeSignatureF(measure.value, v === '' ? null : v),
})

const startRepeat = computed({
  get: () => measure.value.startRepeat?.type ?? '',
  set: (v) => setMeasureStartRepeat(measure.value, v === '' ? null : v),
})

const endRepeat = computed({
  get: () => measure.value.endRepeat?.type ?? '',
  set: (v) => setMeasureEndRepeat(measure.value, v === '' ? null : v),
})

const voltaAtMeasure = computed(() => findVoltaEndingAt(musicScore.value, measure.value.id))
const voltaText = ref('')
const voltaValueText = ref('')

watch(
  voltaAtMeasure,
  (volta) => {
    voltaText.value = volta?.data?.volta?.text ?? ''
    voltaValueText.value = volta?.data?.volta ? formatVoltaValue(volta.data.volta.value) : ''
  },
  {immediate: true},
)

function onInsertBefore() {
  insertMeasureBefore(measureEditSlot.value)
}

function onInsertAfter() {
  insertMeasureAfter(measureEditSlot.value)
}

function onAddVolta() {
  const volta = addVoltaEndingAtMeasure(musicScore.value, measure.value)
  voltaText.value = volta.data.volta?.text ?? '1.'
  voltaValueText.value = formatVoltaValue(volta.data.volta?.value ?? [0])
}

function onRemoveVolta() {
  const volta = voltaAtMeasure.value
  if (!volta) return
  removeVolta(musicScore.value, volta.id)
  voltaText.value = ''
  voltaValueText.value = ''
}

function onVoltaTextInput() {
  const volta = voltaAtMeasure.value
  if (!volta?.data.volta) return
  volta.data.volta.text = voltaText.value
}

function onVoltaValueInput() {
  const volta = voltaAtMeasure.value
  if (!volta?.data.volta) return
  volta.data.volta.value = parseVoltaValueText(voltaValueText.value)
}
</script>

<template>
  <div class="measure-props">
    <section class="measure-props__section">
      <div class="measure-props__label">小节操作</div>
      <div class="measure-props__row">
        <el-button size="small" @click="onInsertBefore">前插小节</el-button>
        <el-button size="small" @click="onInsertAfter">后插小节</el-button>
      </div>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">后置小节线</div>
      <el-select v-model="barlineB" class="measure-props__select" size="small">
        <el-option
          v-for="opt in BARLINE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">前置小节线</div>
      <el-select v-model="barlineF" class="measure-props__select" clearable placeholder="无" size="small">
        <el-option
          v-for="opt in BARLINE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">前置谱号</div>
      <el-select v-model="clefF" class="measure-props__select" clearable placeholder="无" size="small">
        <el-option
          v-for="opt in CLEF_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">前置调号</div>
      <el-select v-model="keySignatureF" class="measure-props__select" clearable placeholder="无" size="small">
        <el-option
          v-for="opt in KEY_SIGNATURE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">前置拍号</div>
      <el-select v-model="timeSignatureF" class="measure-props__select" clearable placeholder="无" size="small">
        <el-option
          v-for="opt in TIME_SIGNATURE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">小节前反复</div>
      <el-select v-model="startRepeat" class="measure-props__select" clearable placeholder="无" size="small">
        <el-option
          v-for="opt in START_REPEAT_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">小节后反复</div>
      <el-select v-model="endRepeat" class="measure-props__select" clearable placeholder="无" size="small">
        <el-option
          v-for="opt in END_REPEAT_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="measure-props__section">
      <div class="measure-props__label">反复房子 (Volta)</div>
      <template v-if="voltaAtMeasure">
        <el-input
          v-model="voltaText"
          class="measure-props__input"
          placeholder="文案，如 1."
          size="small"
          @change="onVoltaTextInput"
        />
        <el-input
          v-model="voltaValueText"
          class="measure-props__input"
          placeholder="播放轮次，如 1 或 1, 2"
          size="small"
          @change="onVoltaValueInput"
        />
        <el-button class="measure-props__btn-block" size="small" type="danger" @click="onRemoveVolta">
          移除 Volta
        </el-button>
      </template>
      <el-button v-else class="measure-props__btn-block" size="small" type="primary" @click="onAddVolta">
        添加 Volta
      </el-button>
    </section>
  </div>
</template>

<style scoped>
.measure-props__section {
  margin-bottom: 14px;
}

.measure-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.measure-props__row {
  display: flex;
  gap: 8px;
}

.measure-props__select {
  width: 100%;
}

.measure-props__input {
  margin-bottom: 6px;
}

.measure-props__btn-block {
  width: 100%;
}
</style>
