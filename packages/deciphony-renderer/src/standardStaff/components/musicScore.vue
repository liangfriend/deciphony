<template>
  <svg :height="data.height" :viewBox="`0 0 ${data.width} ${data.height}`" :width="data.width"
       preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <template v-for="(node, i) in vDom" :key="`${i}-${node.skinName ?? 'default'}-${node.skinKey ?? ''}`">

      <Group v-if="node.tag !== 'slot' || !node.slotName" :node="node" :skin="skin"/>
      <g
        v-else
        :data-comment="node.dataComment"
        :data-slot-name="node.slotName"
        :transform="`translate(${node.x}, ${node.y})`"

      >
        <slot :name="node.slotName" v-bind="{ node }">
          <rect
            v-if="false"
            :height="node.h"
            :width="node.w"
            data-comment="插槽占位虚线"
            data-test
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
import {ref, watch, computed} from 'vue'
import mock from '../mock/happyBirthday'
import {musicScoreToVDom} from "@/standardStaff/render/transfer";
import {applyVDomUpdate} from "@/standardStaff/render/update";
import {defaultSkin} from "@/skins/defaultSkin";
import Group from './group.vue'
import type {MusicScore} from "@/types/MusicScoreType";
import type {Skin, SkinPack, SlotConfig, VDom} from "@/types/common";

const props = defineProps<{
  data?: MusicScore
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
      ? musicScoreToVDom(d, slotConfig, {measureHeight: s.measure.h, skin: skin.value})
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
