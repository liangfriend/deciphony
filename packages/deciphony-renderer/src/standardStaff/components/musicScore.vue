<template>
  <svg :height="data.height" :viewBox="`0 0 ${data.width} ${data.height}`" :width="data.width"
       preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <template v-for="(node, i) in vDom" :key="i">

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
