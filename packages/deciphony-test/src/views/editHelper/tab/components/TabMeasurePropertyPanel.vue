<script lang="ts" setup>
import type {Measure, SlotData} from '@deciphony/renderer'
import {BarlineTypeEnum} from '@deciphony/renderer'
import {computed} from 'vue'
import {
  BARLINE_OPTIONS,
  CLEF_OPTIONS,
  setMeasureBarlineB,
  setMeasureClefF,
  setMeasureTimeSignatureF,
  TIME_SIGNATURE_OPTIONS,
} from '../../renderEditMeasureProperties'

const props = defineProps<{
  editSlot: SlotData
}>()

const measure = computed(() => props.editSlot.measure as Measure)

const barlineB = computed({
  get: () => measure.value.barline_b?.type ?? BarlineTypeEnum.Single_barline,
  set: (v) => setMeasureBarlineB(measure.value, v),
})

const clefF = computed({
  get: () => measure.value.clef_f?.type ?? '',
  set: (v) => setMeasureClefF(measure.value, v === '' ? null : v),
})

const timeSignatureF = computed({
  get: () => measure.value.timeSignature_f?.type ?? '',
  set: (v) => setMeasureTimeSignatureF(measure.value, v === '' ? null : v),
})
</script>

<template>
  <div class="tab-measure-props">
    <section class="tab-measure-props__section">
      <div class="tab-measure-props__label">小节线</div>
      <el-select v-model="barlineB" class="tab-measure-props__select" size="small">
        <el-option
          v-for="opt in BARLINE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>
    <section class="tab-measure-props__section">
      <div class="tab-measure-props__label">前置谱号</div>
      <el-select v-model="clefF" class="tab-measure-props__select" clearable placeholder="无" size="small">
        <el-option
          v-for="opt in CLEF_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>
    <section class="tab-measure-props__section">
      <div class="tab-measure-props__label">前置拍号</div>
      <el-select v-model="timeSignatureF" class="tab-measure-props__select" size="small">
        <el-option label="无" value=""/>
        <el-option
          v-for="opt in TIME_SIGNATURE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>
  </div>
</template>

<style scoped>
.tab-measure-props__section {
  margin-bottom: 14px;
}

.tab-measure-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.tab-measure-props__select {
  width: 100%;
}
</style>
