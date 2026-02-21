<script lang="ts" setup>
import {ref} from 'vue'
import MusicScore from '@/components/musicScore.vue'
import type {MusicScore as MusicScoreType} from "@/types/MusicScoreType";
import type {Skin, SlotConfig} from "@/types/common";

defineProps<{
  data: MusicScoreType
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关 */
  slotConfig?: SlotConfig
  /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
  skin?: Skin
  /** 皮肤名：在 skin 中查得到则用，否则用 default */
  skinName?: string
}>()

const musicScoreRef = ref<InstanceType<typeof MusicScore> | null>(null)
defineExpose({
  updateVDom: (updater: (vDom: import('@/types/common').VDom[]) => import('@/types/common').VDom[]) => {
    musicScoreRef.value?.updateVDom(updater)
  },
})
</script>

<template>
  <MusicScore ref="musicScoreRef" :data="data" :skin="skin" :skin-name="skinName" :slot-config="slotConfig">
    <template v-for="(_, name) in $slots" :key="name" v-slot:[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </MusicScore>
</template>

<style scoped>
</style>