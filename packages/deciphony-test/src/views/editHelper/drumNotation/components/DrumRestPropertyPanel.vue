<script lang="ts" setup>
import type {Chronaxie, DrumRest, SlotData} from '@deciphony/renderer'
import {computed} from 'vue'
import {setDrumRestAugmentationDot, setDrumRestChronaxie, setDrumRestRegion} from '@deciphony/extensions/dr-edit'
import {DRUM_CHRONAXIE_OPTIONS, DRUM_DOT_OPTIONS} from '../renderEditDrumAddState'

const props = defineProps<{
  editSlot: SlotData
}>()

const rest = computed(() => props.editSlot.self as unknown as DrumRest)

const region = computed({
  get: () => rest.value.region,
  set: (value: number) => {
    setDrumRestRegion(rest.value, value)
  },
})

const chronaxie = computed({
  get: () => rest.value.chronaxie,
  set: (value: Chronaxie) => setDrumRestChronaxie(rest.value, value),
})

const dot = computed({
  get: () => (rest.value.augmentationDot?.count ?? 0) as 0 | 1 | 2,
  set: (value: 0 | 1 | 2) => setDrumRestAugmentationDot(rest.value, value),
})
</script>

<template>
  <div class="drum-rest-props">
    <section class="drum-rest-props__section">
      <div class="drum-rest-props__label">时值</div>
      <el-select v-model="chronaxie" size="small" style="width: 100%">
        <el-option
          v-for="opt in DRUM_CHRONAXIE_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>

    <section class="drum-rest-props__section">
      <div class="drum-rest-props__label">线位（0 底线 · 8 顶线）</div>
      <el-input-number v-model="region" :max="14" :min="-6" :step="1" size="small"/>
    </section>

    <section class="drum-rest-props__section">
      <div class="drum-rest-props__label">附点</div>
      <el-radio-group v-model="dot" size="small">
        <el-radio-button v-for="opt in DRUM_DOT_OPTIONS" :key="opt.value" :label="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </section>
  </div>
</template>

<style scoped>
.drum-rest-props__section {
  margin-bottom: 14px;
}

.drum-rest-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}
</style>
