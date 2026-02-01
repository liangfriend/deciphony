<script setup lang="ts">
import {computed} from 'vue'
import {VDom, Skin} from "@/types/common";

defineOptions({
  name: 'Group',
})

const props = defineProps<{
  node: VDom
  skin: Skin
}>()

const comment = computed(() => {
  const {tag, slotName, dataComment} = props.node
  if (dataComment) return dataComment
  if (tag === 'slot' && slotName) return slotName
  switch (tag) {
    case 'grandStaff':
      return '复谱表'
    case 'singleStaff':
      return '单谱表'
    case 'measure':
      return '小节'
    default:
      return ''
  }
})
</script>

<template>
  <g
      :data-comment="comment"
      :transform="`translate(${node.x}, ${node.y})`"

      :data-tag="node.tag"
      :data-slot-name="node.slotName"
  >
    <rect
        v-if="node.tag === 'grandStaff' || node.tag === 'singleStaff'"
        x="0"
        y="0"
        :width="node.w"
        :height="node.h"
        fill="none"
        stroke="transparent"
    />
  </g>
</template>
