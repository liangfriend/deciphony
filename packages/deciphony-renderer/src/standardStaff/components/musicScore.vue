<template>
  <svg :height="data.height" :viewBox="`0 0 ${data.width} ${data.height}`" :width="data.width"
       preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <template v-for="(node, i) in vDom"
              :key="`${i}-${node.skinName ?? 'default'}-${node.skinKey ?? ''}-${node.tag}-${node.targetId}`">
      <Group v-if="node.tag !== 'slot' && node.tag !== 'affiliation'" :node="node" :notation-type="data.type"
             :skin="skin"/>
      <g
          v-else-if="node.tag === 'affiliation'"
          :data-comment="node.dataComment"
          :data-target-id="node.targetId"
          :transform="`translate(${node.x}, ${node.y})`"
      >
        <Slur v-if="node.special?.slur" :v-dom="node"/>
        <Volta v-else-if="node.special?.volta !== undefined" :v-dom="node"/>
        <Beam v-else-if="node.special?.beam" :v-dom="node"/>
      </g>
      <g
          v-else-if="node.tag === 'slot' && node.slotName"
          :data-comment="node.dataComment"
          :data-slot-name="node.slotName"
          :data-target-id="node.targetId"
          :transform="`translate(${node.x}, ${node.y})`"
      >
        <slot :name="node.slotName" v-bind="{ node }">
          <rect
              v-if="false"
              :height="node.h"
              :width="node.w"
              data-comment="插槽占位虚线"
              fill="none"
              stroke="#ddd"
              stroke-dasharray="4"
              stroke-width="1"
              x="0"
              y="0"
          />
        </slot>
      </g>
    </template>
  </svg>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import mock from '../mock/happyBirthday'
import {musicScoreToVDom} from "@/standardStaff/render/musicScoreToVDom";
import {applyVDomUpdate} from "@/standardStaff/render/update";
import {defaultSkin} from "@/skins/defaultSkin";
import Group from './group.vue'
import Slur from './slur.vue'
import Volta from './volta.vue'
import Beam from './beam.vue'
import type {MusicScore} from "@/types/MusicScoreType";
import type {Skin, SkinPack, SlotConfig, VDom} from "@/types/common";

const props = defineProps<{
  data: MusicScore
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关 */
  slotConfig?: SlotConfig
  /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
  skin?: Skin
}>()
const data = computed(() => props.data ?? mock)
const skin = computed(() => props.skin ?? {default: defaultSkin})

const skinPackForLayout = computed<SkinPack>(() => skin.value?.default ?? defaultSkin)

const vDom = ref<VDom[]>([])

// data、slotConfig 或 skin 变化时重新计算 vDom
watch(
    [data, () => props.slotConfig, skinPackForLayout],
    ([d, slotConfig, s]) => {
      vDom.value = d
          ? musicScoreToVDom(d, slotConfig, {skin: skin.value})
          : []
    },
    {immediate: true}
)

/**
 * 更新 VDom：传入 updater 对深拷贝后的 vDom 做修改（如替换某符号 skinName），仅替换有变化的节点，实现部分重渲染
 * @param updater (vDom: VDom[]) => VDom[] 用户修改后 return
 */
function updateVDomHandler(updater: (vDom: VDom[]) => VDom[]) {
  applyVDomUpdate(vDom.value, updater)
}

defineExpose({updateVDom: updateVDomHandler})
</script>
