<script lang="ts" setup>
import type {DoubleNoteAffiliatedSymbol, SlotData} from '@deciphony/renderer'
import {SlurTypeEnum} from '@deciphony/renderer'
import {computed} from 'vue'
import {setSlurType} from '@deciphony/extensions/dr-edit'

const props = defineProps<{
  editSlot: SlotData
}>()

const slur = computed(() => props.editSlot.self as unknown as DoubleNoteAffiliatedSymbol)

const slurType = computed({
  get: () => slur.value.data.slur?.type ?? '',
  set: (value: SlurTypeEnum | '') => {
    setSlurType(slur.value, value === '' ? undefined : value)
  },
})

const options: {value: SlurTypeEnum | ''; label: string}[] = [
  {value: '', label: '无'},
  {value: SlurTypeEnum.H, label: '击弦 H'},
  {value: SlurTypeEnum.S, label: '滑弦 S'},
  {value: SlurTypeEnum.P, label: '勾弦 P'},
  {value: SlurTypeEnum.HP, label: '击勾弦 HP'},
]
</script>

<template>
  <section class="tab-slur-props">
    <div class="tab-slur-props__label">类型</div>
    <el-select v-model="slurType" size="small" style="width: 100%">
      <el-option
        v-for="opt in options"
        :key="opt.value || 'none'"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>
  </section>
</template>

<style scoped>
.tab-slur-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}
</style>
