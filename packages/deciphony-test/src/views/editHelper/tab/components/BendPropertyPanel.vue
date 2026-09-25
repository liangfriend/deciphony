<script lang="ts" setup>
import type {Bend, SlotData, TabNoteInfo} from '@deciphony/renderer'
import {BendTypeEnum} from '@deciphony/renderer'
import {computed} from 'vue'
import {setTabNoteInfoBend} from '@deciphony/extensions/dr-edit'
import {TAB_SEMITONE_OPTIONS} from '../renderEditTabAddState'

const props = defineProps<{
  editSlot: SlotData
}>()

const info = computed(() => props.editSlot.info as unknown as TabNoteInfo)
const bend = computed(() => props.editSlot.self as unknown as Bend)

const bendType = computed({
  get: () => bend.value.type,
  set: (type: BendTypeEnum) => {
    setTabNoteInfoBend(info.value, {
      type,
      periodOne: bend.value.periodOne,
      periodTwo: bend.value.periodTwo,
    })
  },
})

const periodOne = computed({
  get: () => bend.value.periodOne,
  set: (periodOne: number) => {
    setTabNoteInfoBend(info.value, {
      type: bend.value.type,
      periodOne,
      periodTwo: bend.value.periodTwo,
    })
  },
})

const periodTwo = computed({
  get: () => bend.value.periodTwo,
  set: (periodTwo: number) => {
    setTabNoteInfoBend(info.value, {
      type: bend.value.type,
      periodOne: bend.value.periodOne,
      periodTwo,
    })
  },
})

const typeOptions: {value: BendTypeEnum; label: string}[] = [
  {value: BendTypeEnum.Bend, label: '推弦'},
  {value: BendTypeEnum.BendRelease, label: '推弦再回来'},
  {value: BendTypeEnum.Prebend, label: '预推弦'},
  {value: BendTypeEnum.PrebendRelease, label: '预推弦再回来'},
  {value: BendTypeEnum.PrebendBend, label: '预推弦再升高'},
]
</script>

<template>
  <div class="bend-props">
    <section class="bend-props__section">
      <div class="bend-props__label">推弦类型</div>
      <el-select v-model="bendType" size="small" style="width: 100%">
        <el-option
          v-for="opt in typeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>
    <section class="bend-props__section">
      <div class="bend-props__label">阶段 1 音程</div>
      <el-select v-model="periodOne" size="small" style="width: 100%">
        <el-option
          v-for="opt in TAB_SEMITONE_OPTIONS"
          :key="`p1-${opt.value}`"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>
    <section class="bend-props__section">
      <div class="bend-props__label">阶段 2 音程</div>
      <el-select v-model="periodTwo" size="small" style="width: 100%">
        <el-option
          v-for="opt in TAB_SEMITONE_OPTIONS"
          :key="`p2-${opt.value}`"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </section>
  </div>
</template>

<style scoped>
.bend-props__section {
  margin-bottom: 14px;
}

.bend-props__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}
</style>
