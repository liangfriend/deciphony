<script lang="ts" setup>
import MusicScoreForStandardStaff from '@/standardStaff/components/musicScore.vue'
import MusicScoreForNumberNotation from '@/numberNotation/components/musicScore.vue'
import type {MusicScore} from "@/types/MusicScoreType";
import type {Skin, SlotConfig} from "@/types/common";
import {MusicScoreTypeEnum} from "@/enums/musicScoreEnum";

defineProps<{
  data: MusicScore
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关 */
  slotConfig?: SlotConfig
  /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
  skin?: Skin
}>()
const updateVDom = () => {

}
defineExpose({updateVDom})

</script>

<template>
  <MusicScoreForStandardStaff v-if="data?.type === MusicScoreTypeEnum.StandardStaff || true" :data="data" :skin="skin"
                              :slot-config="slotConfig"/>
  <MusicScoreForNumberNotation v-else-if="data?.type === MusicScoreTypeEnum.NumberNotation" :data="data"
                               :skin="skin"
                               :slot-config="slotConfig"/>
</template>

<style scoped>

</style>