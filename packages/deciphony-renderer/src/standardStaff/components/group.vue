<script lang="ts" setup>
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
    :data-slot-name="node.slotName"

    :data-tag="node.tag"
    :transform="`translate(${node.x}, ${node.y})`"
  >
    <rect
      :height="node.h"
      :width="node.w"
      fill="none"
      stroke="transparent"
      x="0"
      y="0"
    />
  </g>
</template>
