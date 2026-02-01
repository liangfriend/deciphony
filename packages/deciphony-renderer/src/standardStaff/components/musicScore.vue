<template>
  <svg :viewBox="`0 0 ${data.width} ${data.height}`" :width="data.width" :height="data.height"
       preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <template v-for="(node, i) in vDom" :key="i">

      <Group v-if="node.tag !== 'slot' || !node.slotName" :node="node" :skin="skin"/>
      <g
          v-else
          :data-comment="node.dataComment"
          :transform="`translate(${node.x}, ${node.y})`"
          :data-slot-name="node.slotName"

      >
        <slot :name="node.slotName" v-bind="{ node }">
          <rect
              data-comment="插槽占位虚线"
              x="0"
              y="0"
              :width="node.w"
              :height="node.h"
              fill="none"
              stroke="#ddd"
              stroke-width="1"
              stroke-dasharray="4"
          />
        </slot>
      </g>
    </template>
  </svg>
</template>

<script setup lang="ts">
import {ref, watch, computed} from 'vue'
import mock from '../mock/happyBirthday'
import {musicScoreToVDom} from "@/standardStaff/render/transfer";
import {defaultSkin} from "@/skins/defaultSkin";
import Group from './group.vue'
import type {MusicScore} from "@/types/MusicScoreType";

const props = defineProps<{
  data?: MusicScore
  /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关 */
  slotConfig?: import('@/types/common').SlotConfig
}>()
const data = computed(() => props.data ?? mock)

const vDom = ref<ReturnType<typeof musicScoreToVDom>>([])
const skin = defaultSkin

// data 或 slotConfig 变化时重新计算 vDom
watch(
    [data, () => props.slotConfig],
    ([d, slotConfig]) => {
      vDom.value = d ? musicScoreToVDom(d, slotConfig) : []
    },
    {immediate: true}
)
</script>
