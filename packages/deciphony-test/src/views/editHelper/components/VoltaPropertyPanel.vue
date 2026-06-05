<script lang="ts" setup>
import {computed} from 'vue'
import {
  setVoltaText,
  setVoltaValue,
  type VoltaEditSlot,
} from '../renderEditVoltaProperties'
import {
  voltaValueFromDisplay,
  voltaValueToDisplay,
} from '../renderEditMeasureProperties'
import VoltaValueEditor from './VoltaValueEditor.vue'

const props = defineProps<{
  editSlot: VoltaEditSlot
}>()

const volta = computed(() => props.editSlot.self)

const text = computed({
  get: () => volta.value.data.volta?.text ?? '',
  set: (v: string) => setVoltaText(volta.value, v),
})

const value = computed({
  get: () => voltaValueToDisplay(volta.value.data.volta?.value ?? [0]),
  set: (v: number[]) => setVoltaValue(volta.value, voltaValueFromDisplay(v)),
})
</script>

<template>
  <div class="volta-props">
    <section class="volta-props__section">
      <div class="volta-props__label">文案</div>
      <el-input v-model="text" placeholder="如 1." size="small"/>
    </section>

    <section class="volta-props__section">
      <div class="volta-props__label">反复值</div>
      <VoltaValueEditor v-model="value"/>
    </section>
  </div>
</template>

<style scoped>
.volta-props__section {
  margin-bottom: 14px;
}

.volta-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}
</style>
